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
        var patients = _uow.Patients.Query();

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

    public async Task<PatientDto> UpdateAsync(int id, UpdatePatientRequest request, CancellationToken ct = default)
    {
        await EnsureCanAccessPatientAsync(id, ct);

        var patient = await _uow.Patients.QueryTracked()
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.Id == id, ct) ?? throw new NotFoundException("Patient", id);

        patient.User.FullName = request.FullName.Trim();
        patient.User.PhoneNumber = request.PhoneNumber;
        patient.DateOfBirth = request.DateOfBirth;
        patient.Gender = request.Gender;
        patient.BloodGroup = request.BloodGroup;
        patient.Address = request.Address;
        patient.EmergencyContactName = request.EmergencyContactName;
        patient.EmergencyContactPhone = request.EmergencyContactPhone;
        patient.Allergies = request.Allergies;
        patient.ChronicConditions = request.ChronicConditions;

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

    /// <summary>Patients may only access their own record; staff and doctors may access any.</summary>
    private async Task EnsureCanAccessPatientAsync(int patientId, CancellationToken ct)
    {
        if (_currentUser.Role != UserRole.Patient)
            return;

        var ownsRecord = await _uow.Patients.Query()
            .AnyAsync(p => p.Id == patientId && p.UserId == _currentUser.UserId, ct);

        if (!ownsRecord)
            throw new ForbiddenException("Patients can only access their own record.");
    }

    private async Task<string> GenerateMrnAsync(CancellationToken ct)
    {
        var sequence = await _uow.Patients.Query().CountAsync(ct) + 1;
        return $"MRN-{DateTime.UtcNow.Year}-{sequence:D6}";
    }
}
