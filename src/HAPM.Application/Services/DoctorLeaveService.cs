using HAPM.Application.Common;
using HAPM.Application.DTOs;
using HAPM.Application.Interfaces;
using HAPM.Application.Mapping;
using HAPM.Domain.Entities;
using HAPM.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace HAPM.Application.Services;

public class DoctorLeaveService : IDoctorLeaveService
{
    private readonly IUnitOfWork _uow;
    private readonly ICurrentUserService _currentUser;

    public DoctorLeaveService(IUnitOfWork uow, ICurrentUserService currentUser)
    {
        _uow = uow;
        _currentUser = currentUser;
    }

    public async Task<IReadOnlyList<DoctorLeaveDto>> GetForDoctorAsync(int doctorId, CancellationToken ct = default)
    {
        if (!await _uow.Doctors.Query().AnyAsync(d => d.Id == doctorId, ct))
            throw new NotFoundException("Doctor", doctorId);

        return await _uow.DoctorLeaves.Query()
            .Where(l => l.DoctorId == doctorId)
            .OrderByDescending(l => l.StartDate)
            .Select(Projections.DoctorLeave)
            .ToListAsync(ct);
    }

    public async Task<DoctorLeaveDto> CreateAsync(int doctorId, CreateDoctorLeaveRequest request, CancellationToken ct = default)
    {
        await EnsureAdminOrOwningDoctorAsync(doctorId, ct);

        if (request.StartDate > request.EndDate)
            throw new BadRequestException("Leave start date must be on or before the end date.");

        if (request.EndDate < HospitalClock.Today)
            throw new BadRequestException("Leave cannot end in the past.");

        var overlaps = await _uow.DoctorLeaves.Query().AnyAsync(l =>
            l.DoctorId == doctorId && l.StartDate <= request.EndDate && l.EndDate >= request.StartDate, ct);
        if (overlaps)
            throw new ConflictException("This period overlaps an existing leave for the doctor.");

        var activeAppointments = await _uow.Appointments.Query().CountAsync(a =>
            a.DoctorId == doctorId &&
            a.AppointmentDate >= request.StartDate && a.AppointmentDate <= request.EndDate &&
            (a.Status == AppointmentStatus.Pending || a.Status == AppointmentStatus.Confirmed || a.Status == AppointmentStatus.CheckedIn), ct);
        if (activeAppointments > 0)
            throw new ConflictException($"The doctor has {activeAppointments} active appointment(s) in this period. Cancel or reschedule them first.");

        var leave = new DoctorLeave
        {
            DoctorId = doctorId,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Reason = request.Reason.Trim(),
            CreatedByUserId = _currentUser.UserId ?? 0
        };

        await _uow.DoctorLeaves.AddAsync(leave, ct);
        await _uow.SaveChangesAsync(ct);

        return await _uow.DoctorLeaves.Query()
            .Where(l => l.Id == leave.Id)
            .Select(Projections.DoctorLeave)
            .FirstAsync(ct);
    }

    public async Task DeleteAsync(int doctorId, int leaveId, CancellationToken ct = default)
    {
        await EnsureAdminOrOwningDoctorAsync(doctorId, ct);

        var leave = await _uow.DoctorLeaves.QueryTracked()
            .FirstOrDefaultAsync(l => l.Id == leaveId && l.DoctorId == doctorId, ct)
            ?? throw new NotFoundException("Doctor leave", leaveId);

        _uow.DoctorLeaves.Remove(leave);
        await _uow.SaveChangesAsync(ct);
    }

    private async Task EnsureAdminOrOwningDoctorAsync(int doctorId, CancellationToken ct)
    {
        if (_currentUser.Role == UserRole.Admin)
            return;

        if (_currentUser.Role == UserRole.Doctor)
        {
            var ownsProfile = await _uow.Doctors.Query()
                .AnyAsync(d => d.Id == doctorId && d.UserId == _currentUser.UserId, ct);
            if (ownsProfile)
                return;
        }

        throw new ForbiddenException("Only admins or the doctor themselves can manage leave.");
    }
}
