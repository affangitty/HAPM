using HAPM.Application.Common;
using HAPM.Application.DTOs;
using HAPM.Application.Interfaces;
using HAPM.Application.Mapping;
using HAPM.Domain.Entities;
using HAPM.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace HAPM.Application.Services;

public class PatientService : IPatientService
{
    private readonly IUnitOfWork _uow;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ICurrentUserService _currentUser;

    public PatientService(IUnitOfWork uow, IPasswordHasher passwordHasher, ICurrentUserService currentUser)
    {
        _uow = uow;
        _passwordHasher = passwordHasher;
        _currentUser = currentUser;
    }

    public async Task<PagedResult<PatientDto>> GetPagedAsync(PatientQueryParams query, CancellationToken ct = default)
    {
        var patients = await PatientAccessScope.ApplyToPatientsAsync(_uow.Patients.Query(), _uow, _currentUser, ct);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim().ToLower();
            patients = patients.Where(p =>
                p.User.FullName.ToLower().Contains(term) ||
                p.User.Email.ToLower().Contains(term) ||
                p.MedicalRecordNumber.ToLower().Contains(term) ||
                (p.User.PhoneNumber != null && p.User.PhoneNumber.Contains(term)));
        }

        if (query.Gender.HasValue)
            patients = patients.Where(p => p.Gender == query.Gender.Value);

        if (!string.IsNullOrWhiteSpace(query.BloodGroup))
            patients = patients.Where(p => p.BloodGroup == query.BloodGroup);

        patients = (query.SortBy?.ToLowerInvariant(), query.SortDescending) switch
        {
            ("name", true) => patients.OrderByDescending(p => p.User.FullName),
            ("name", false) => patients.OrderBy(p => p.User.FullName),
            ("mrn", false) => patients.OrderBy(p => p.MedicalRecordNumber),
            ("mrn", true) => patients.OrderByDescending(p => p.MedicalRecordNumber),
            ("registeredat", false) => patients.OrderBy(p => p.CreatedAtUtc),
            (_, _) => patients.OrderByDescending(p => p.CreatedAtUtc)
        };

        return await patients.Select(Projections.Patient).ToPagedResultAsync(query.Page, query.PageSize, ct);
    }

    public async Task<PatientDto> GetByIdAsync(int id, CancellationToken ct = default)
    {
        await EnsureCanAccessPatientAsync(id, ct);

        return await _uow.Patients.Query()
            .Where(p => p.Id == id)
            .Select(Projections.Patient)
            .FirstOrDefaultAsync(ct) ?? throw new NotFoundException("Patient", id);
    }

    public async Task<PatientDto> GetMyProfileAsync(CancellationToken ct = default)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedException();
        return await _uow.Patients.Query()
            .Where(p => p.UserId == userId)
            .Select(Projections.Patient)
            .FirstOrDefaultAsync(ct) ?? throw new NotFoundException("No patient profile exists for the current user.");
    }

    public async Task<PatientDto> CreateAsync(CreatePatientRequest request, CancellationToken ct = default)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        if (await _uow.Users.Query().AnyAsync(u => u.Email == email, ct))
            throw new ConflictException($"An account with email '{email}' already exists.");

        var patient = new Patient
        {
            User = new User
            {
                Email = email,
                PasswordHash = _passwordHasher.Hash(request.Password),
                FullName = request.FullName.Trim(),
                PhoneNumber = request.PhoneNumber,
                Role = UserRole.Patient
            },
            MedicalRecordNumber = await GenerateMrnAsync(ct),
            DateOfBirth = request.DateOfBirth,
            Gender = request.Gender,
            BloodGroup = request.BloodGroup,
            Address = request.Address,
            EmergencyContactName = request.EmergencyContactName,
            EmergencyContactPhone = request.EmergencyContactPhone,
            Allergies = request.Allergies,
            ChronicConditions = request.ChronicConditions
        };

        await _uow.Patients.AddAsync(patient, ct);
        await _uow.SaveChangesAsync(ct);

        return await _uow.Patients.Query()
            .Where(p => p.Id == patient.Id)
            .Select(Projections.Patient)
            .FirstAsync(ct);
    }

    public async Task<PatientDto> PatchAsync(int id, PatchPatientRequest request, CancellationToken ct = default)
    {
        PatchValidation.EnsureAnyFieldSet(request);
        await EnsureCanAccessPatientAsync(id, ct);

        var patient = await _uow.Patients.QueryTracked()
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.Id == id, ct) ?? throw new NotFoundException("Patient", id);

        if (request.FullName is not null) patient.User.FullName = request.FullName.Trim();
        if (request.PhoneNumber is not null) patient.User.PhoneNumber = request.PhoneNumber;
        if (request.DateOfBirth.HasValue) patient.DateOfBirth = request.DateOfBirth.Value;
        if (request.Gender.HasValue) patient.Gender = request.Gender.Value;
        if (request.BloodGroup is not null) patient.BloodGroup = request.BloodGroup;
        if (request.Address is not null) patient.Address = request.Address;
        if (request.EmergencyContactName is not null) patient.EmergencyContactName = request.EmergencyContactName;
        if (request.EmergencyContactPhone is not null) patient.EmergencyContactPhone = request.EmergencyContactPhone;
        if (request.Allergies is not null) patient.Allergies = request.Allergies;
        if (request.ChronicConditions is not null) patient.ChronicConditions = request.ChronicConditions;

        await _uow.SaveChangesAsync(ct);

        return await _uow.Patients.Query()
            .Where(p => p.Id == id)
            .Select(Projections.Patient)
            .FirstAsync(ct);
    }

    public async Task DeactivateAsync(int id, CancellationToken ct = default)
    {
        var patient = await _uow.Patients.QueryTracked()
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.Id == id, ct) ?? throw new NotFoundException("Patient", id);

        patient.User.IsActive = false;
        await RefreshTokenRevocation.RevokeAllForUserAsync(_uow, patient.UserId, ct);
        await _uow.SaveChangesAsync(ct);
    }

    public async Task<PatientMedicalHistoryDto> GetMedicalHistoryAsync(int id, CancellationToken ct = default)
    {
        var patient = await GetByIdAsync(id, ct);

        var appointments = await _uow.Appointments.Query()
            .Where(a => a.PatientId == id)
            .OrderByDescending(a => a.AppointmentDate).ThenByDescending(a => a.StartTime)
            .Select(Projections.Appointment)
            .ToListAsync(ct);

        var prescriptions = await _uow.Prescriptions.Query()
            .Where(p => p.PatientId == id)
            .OrderByDescending(p => p.CreatedAtUtc)
            .Select(Projections.Prescription)
            .ToListAsync(ct);

        var labReports = await _uow.LabReports.Query()
            .Where(r => r.PatientId == id)
            .OrderByDescending(r => r.CreatedAtUtc)
            .Select(Projections.LabReport)
            .ToListAsync(ct);

        return new PatientMedicalHistoryDto(patient, appointments, prescriptions, labReports);
    }

    private Task EnsureCanAccessPatientAsync(int patientId, CancellationToken ct) =>
        PatientAccessScope.EnsureCanAccessPatientAsync(patientId, _uow, _currentUser, ct);

    private async Task<string> GenerateMrnAsync(CancellationToken ct)
    {
        var sequence = await _uow.Patients.Query().CountAsync(ct) + 1;
        return $"MRN-{DateTime.UtcNow.Year}-{sequence:D6}";
    }
}
