using HAPM.Application.Common;
using HAPM.Application.DTOs;
using HAPM.Application.Interfaces;
using HAPM.Application.Mapping;
using HAPM.Domain.Entities;
using HAPM.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace HAPM.Application.Services;

public class WaitlistService : IWaitlistService
{
    private readonly IUnitOfWork _uow;
    private readonly ICurrentUserService _currentUser;

    public WaitlistService(IUnitOfWork uow, ICurrentUserService currentUser)
    {
        _uow = uow;
        _currentUser = currentUser;
    }

    public async Task<PagedResult<WaitlistEntryDto>> GetPagedAsync(WaitlistQueryParams query, CancellationToken ct = default)
    {
        var entries = await ScopeToCurrentUserAsync(_uow.WaitlistEntries.Query(), ct);

        if (query.DoctorId.HasValue)
            entries = entries.Where(w => w.DoctorId == query.DoctorId.Value);

        if (query.PreferredDate.HasValue)
            entries = entries.Where(w => w.PreferredDate == query.PreferredDate.Value);

        if (query.Status.HasValue)
            entries = entries.Where(w => w.Status == query.Status.Value);

        return await entries
            .OrderBy(w => w.PreferredDate).ThenBy(w => w.CreatedAtUtc)
            .Select(Projections.Waitlist)
            .ToPagedResultAsync(query.Page, query.PageSize, ct);
    }

    public async Task<WaitlistEntryDto> JoinAsync(JoinWaitlistRequest request, CancellationToken ct = default)
    {
        var patientId = await ResolvePatientIdAsync(request.PatientId, ct);

        var doctor = await _uow.Doctors.Query()
            .Include(d => d.User)
            .FirstOrDefaultAsync(d => d.Id == request.DoctorId, ct)
            ?? throw new NotFoundException("Doctor", request.DoctorId);

        if (!doctor.IsAvailable || !doctor.User.IsActive)
            throw new BadRequestException("This doctor is not currently accepting appointments.");

        if (request.PreferredDate < HospitalClock.Today)
            throw new BadRequestException("The preferred date cannot be in the past.");

        var duplicate = await _uow.WaitlistEntries.Query().AnyAsync(w =>
            w.DoctorId == request.DoctorId &&
            w.PatientId == patientId &&
            w.PreferredDate == request.PreferredDate &&
            w.Status == WaitlistStatus.Active, ct);
        if (duplicate)
            throw new ConflictException("The patient is already on the waitlist for this doctor and date.");

        var entry = new WaitlistEntry
        {
            DoctorId = request.DoctorId,
            PatientId = patientId,
            PreferredDate = request.PreferredDate,
            Notes = request.Notes
        };

        await _uow.WaitlistEntries.AddAsync(entry, ct);
        await _uow.SaveChangesAsync(ct);

        return await _uow.WaitlistEntries.Query()
            .Where(w => w.Id == entry.Id)
            .Select(Projections.Waitlist)
            .FirstAsync(ct);
    }

    public async Task CancelAsync(int id, CancellationToken ct = default)
    {
        var entry = await _uow.WaitlistEntries.QueryTracked()
            .Include(w => w.Patient)
            .FirstOrDefaultAsync(w => w.Id == id, ct) ?? throw new NotFoundException("Waitlist entry", id);

        var isOwner = _currentUser.Role == UserRole.Patient && entry.Patient.UserId == _currentUser.UserId;
        var isStaff = _currentUser.Role is UserRole.Admin or UserRole.Receptionist;
        if (!isOwner && !isStaff)
            throw new ForbiddenException();

        if (entry.Status == WaitlistStatus.Cancelled)
            throw new ConflictException("This waitlist entry is already cancelled.");

        entry.Status = WaitlistStatus.Cancelled;
        await _uow.SaveChangesAsync(ct);
    }

    private async Task<int> ResolvePatientIdAsync(int? requestedPatientId, CancellationToken ct)
    {
        if (_currentUser.Role == UserRole.Patient)
        {
            return await _uow.Patients.Query()
                .Where(p => p.UserId == _currentUser.UserId)
                .Select(p => (int?)p.Id)
                .FirstOrDefaultAsync(ct) ?? throw new NotFoundException("No patient profile exists for the current user.");
        }

        if (requestedPatientId is null)
            throw new BadRequestException("PatientId is required when joining the waitlist on behalf of a patient.");

        if (!await _uow.Patients.Query().AnyAsync(p => p.Id == requestedPatientId.Value, ct))
            throw new NotFoundException("Patient", requestedPatientId.Value);

        return requestedPatientId.Value;
    }

    private async Task<IQueryable<WaitlistEntry>> ScopeToCurrentUserAsync(IQueryable<WaitlistEntry> query, CancellationToken ct)
    {
        switch (_currentUser.Role)
        {
            case UserRole.Patient:
            {
                var patientId = await _uow.Patients.Query()
                    .Where(p => p.UserId == _currentUser.UserId)
                    .Select(p => (int?)p.Id)
                    .FirstOrDefaultAsync(ct);
                return query.Where(w => w.PatientId == (patientId ?? -1));
            }
            case UserRole.Doctor:
            {
                var doctorId = await _uow.Doctors.Query()
                    .Where(d => d.UserId == _currentUser.UserId)
                    .Select(d => (int?)d.Id)
                    .FirstOrDefaultAsync(ct);
                return query.Where(w => w.DoctorId == (doctorId ?? -1));
            }
            default:
                return query;
        }
    }
}
