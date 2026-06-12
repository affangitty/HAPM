using HAPM.Application.Common;
using HAPM.Application.DTOs;
using HAPM.Application.Interfaces;
using HAPM.Application.Mapping;
using HAPM.Domain.Entities;
using HAPM.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace HAPM.Application.Services;

public class AppointmentService : IAppointmentService
{
    private readonly IUnitOfWork _uow;
    private readonly ICurrentUserService _currentUser;
    private readonly INotificationService _notifications;

    public AppointmentService(IUnitOfWork uow, ICurrentUserService currentUser, INotificationService notifications)
    {
        _uow = uow;
        _currentUser = currentUser;
        _notifications = notifications;
    }

    public async Task<PagedResult<AppointmentDto>> GetPagedAsync(AppointmentQueryParams query, CancellationToken ct = default)
    {
        var appointments = await ScopeToCurrentUserAsync(_uow.Appointments.Query(), ct);

        if (query.DoctorId.HasValue)
            appointments = appointments.Where(a => a.DoctorId == query.DoctorId.Value);

        if (query.PatientId.HasValue)
            appointments = appointments.Where(a => a.PatientId == query.PatientId.Value);

        if (query.Status.HasValue)
            appointments = appointments.Where(a => a.Status == query.Status.Value);

        if (query.FromDate.HasValue)
            appointments = appointments.Where(a => a.AppointmentDate >= query.FromDate.Value);

        if (query.ToDate.HasValue)
            appointments = appointments.Where(a => a.AppointmentDate <= query.ToDate.Value);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim().ToLower();
            appointments = appointments.Where(a =>
                a.Patient.User.FullName.ToLower().Contains(term) ||
                a.Patient.MedicalRecordNumber.ToLower().Contains(term) ||
                a.Doctor.User.FullName.ToLower().Contains(term) ||
                a.Reason.ToLower().Contains(term));
        }

        appointments = (query.SortBy?.ToLowerInvariant(), query.SortDescending) switch
        {
            ("date", false) => appointments.OrderBy(a => a.AppointmentDate).ThenBy(a => a.StartTime),
            ("status", false) => appointments.OrderBy(a => a.Status),
            ("status", true) => appointments.OrderByDescending(a => a.Status),
            ("createdat", false) => appointments.OrderBy(a => a.CreatedAtUtc),
            ("createdat", true) => appointments.OrderByDescending(a => a.CreatedAtUtc),
            (_, _) => appointments.OrderByDescending(a => a.AppointmentDate).ThenByDescending(a => a.StartTime)
        };

        return await appointments.Select(Projections.Appointment).ToPagedResultAsync(query.Page, query.PageSize, ct);
    }

    public async Task<AppointmentDto> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var scoped = await ScopeToCurrentUserAsync(_uow.Appointments.Query(), ct);
        return await scoped
            .Where(a => a.Id == id)
            .Select(Projections.Appointment)
            .FirstOrDefaultAsync(ct) ?? throw new NotFoundException("Appointment", id);
    }

    public async Task<AppointmentDto> BookAsync(BookAppointmentRequest request, CancellationToken ct = default)
    {
        var patientId = await ResolvePatientIdAsync(request.PatientId, ct);

        var doctor = await _uow.Doctors.Query()
            .Include(d => d.User)
            .FirstOrDefaultAsync(d => d.Id == request.DoctorId, ct) ?? throw new NotFoundException("Doctor", request.DoctorId);

        if (!doctor.IsAvailable || !doctor.User.IsActive)
            throw new BadRequestException("This doctor is not currently accepting appointments.");

        var schedule = await ValidateSlotAsync(request.DoctorId, request.AppointmentDate, request.StartTime, ct);
        var endTime = request.StartTime.AddMinutes(schedule.SlotDurationMinutes);

        await EnsureNoConflictsAsync(request.DoctorId, patientId, request.AppointmentDate, request.StartTime, endTime, excludeAppointmentId: null, ct);

        var appointment = new Appointment
        {
            PatientId = patientId,
            DoctorId = request.DoctorId,
            AppointmentDate = request.AppointmentDate,
            StartTime = request.StartTime,
            EndTime = endTime,
            Reason = request.Reason.Trim(),
            Status = AppointmentStatus.Pending
        };

        await _uow.Appointments.AddAsync(appointment, ct);
        await _uow.SaveChangesAsync(ct);

        var patientUserId = await GetPatientUserIdAsync(patientId, ct);
        var when = $"{request.AppointmentDate:yyyy-MM-dd} at {request.StartTime:HH\\:mm}";
        await _notifications.NotifyAsync(patientUserId, NotificationType.AppointmentBooked,
            "Appointment booked", $"Your appointment with Dr. {doctor.User.FullName} on {when} has been requested and is awaiting confirmation.", ct);
        await _notifications.NotifyAsync(doctor.UserId, NotificationType.AppointmentBooked,
            "New appointment request", $"A new appointment has been requested for {when}.", ct);

        return await GetByIdUnscopedAsync(appointment.Id, ct);
    }

    public async Task<AppointmentDto> ConfirmAsync(int id, CancellationToken ct = default)
    {
        var appointment = await LoadForUpdateAsync(id, ct);
        EnsureStaffOrOwningDoctor(appointment);

        if (appointment.Status != AppointmentStatus.Pending)
            throw new ConflictException($"Only pending appointments can be confirmed (current status: {appointment.Status}).");

        appointment.Status = AppointmentStatus.Confirmed;
        await _uow.SaveChangesAsync(ct);

        await _notifications.NotifyAsync(appointment.Patient.UserId, NotificationType.AppointmentConfirmed,
            "Appointment confirmed",
            $"Your appointment with Dr. {appointment.Doctor.User.FullName} on {appointment.AppointmentDate:yyyy-MM-dd} at {appointment.StartTime:HH\\:mm} is confirmed.", ct);

        return await GetByIdUnscopedAsync(id, ct);
    }

    public async Task<AppointmentDto> CheckInAsync(int id, CancellationToken ct = default)
    {
        var appointment = await LoadForUpdateAsync(id, ct);
        EnsureStaffOrOwningDoctor(appointment);

        if (appointment.Status != AppointmentStatus.Confirmed)
            throw new ConflictException($"Only confirmed appointments can be checked in (current status: {appointment.Status}).");

        appointment.Status = AppointmentStatus.CheckedIn;
        await _uow.SaveChangesAsync(ct);
        return await GetByIdUnscopedAsync(id, ct);
    }

    public async Task<AppointmentDto> CompleteAsync(int id, CompleteAppointmentRequest request, CancellationToken ct = default)
    {
        var appointment = await LoadForUpdateAsync(id, ct);
        EnsureStaffOrOwningDoctor(appointment);

        if (appointment.Status is not (AppointmentStatus.Confirmed or AppointmentStatus.CheckedIn))
            throw new ConflictException($"Only confirmed or checked-in appointments can be completed (current status: {appointment.Status}).");

        appointment.Status = AppointmentStatus.Completed;
        appointment.Notes = request.Notes;
        await _uow.SaveChangesAsync(ct);

        await _notifications.NotifyAsync(appointment.Patient.UserId, NotificationType.AppointmentCompleted,
            "Appointment completed",
            $"Your appointment with Dr. {appointment.Doctor.User.FullName} on {appointment.AppointmentDate:yyyy-MM-dd} has been marked completed.", ct);

        return await GetByIdUnscopedAsync(id, ct);
    }

    public async Task<AppointmentDto> CancelAsync(int id, CancelAppointmentRequest request, CancellationToken ct = default)
    {
        var appointment = await LoadForUpdateAsync(id, ct);
        await EnsureCanModifyAsync(appointment, ct);

        if (appointment.Status is AppointmentStatus.Completed or AppointmentStatus.Cancelled or AppointmentStatus.NoShow)
            throw new ConflictException($"Appointment in status '{appointment.Status}' cannot be cancelled.");

        appointment.Status = AppointmentStatus.Cancelled;
        appointment.CancellationReason = request.Reason.Trim();
        await _uow.SaveChangesAsync(ct);

        var when = $"{appointment.AppointmentDate:yyyy-MM-dd} at {appointment.StartTime:HH\\:mm}";
        await _notifications.NotifyAsync(appointment.Patient.UserId, NotificationType.AppointmentCancelled,
            "Appointment cancelled", $"Your appointment on {when} with Dr. {appointment.Doctor.User.FullName} was cancelled.", ct);
        await _notifications.NotifyAsync(appointment.Doctor.UserId, NotificationType.AppointmentCancelled,
            "Appointment cancelled", $"The appointment on {when} with {appointment.Patient.User.FullName} was cancelled.", ct);

        await NotifyWaitlistedPatientsAsync(appointment, ct);

        return await GetByIdUnscopedAsync(id, ct);
    }

    /// <summary>Tells waitlisted patients that a slot opened up after a cancellation.</summary>
    private async Task NotifyWaitlistedPatientsAsync(Appointment cancelled, CancellationToken ct)
    {
        var waitlisted = await _uow.WaitlistEntries.QueryTracked()
            .Include(w => w.Patient)
            .Where(w => w.DoctorId == cancelled.DoctorId &&
                        w.PreferredDate == cancelled.AppointmentDate &&
                        w.Status == WaitlistStatus.Active &&
                        w.PatientId != cancelled.PatientId)
            .ToListAsync(ct);

        if (waitlisted.Count == 0)
            return;

        foreach (var entry in waitlisted)
        {
            entry.Status = WaitlistStatus.Notified;
            entry.NotifiedAtUtc = DateTime.UtcNow;

            await _notifications.NotifyAsync(entry.Patient.UserId, NotificationType.WaitlistSlotOpened,
                "A slot opened up",
                $"A slot with Dr. {cancelled.Doctor.User.FullName} on {cancelled.AppointmentDate:yyyy-MM-dd} " +
                $"({cancelled.StartTime:HH\\:mm}–{cancelled.EndTime:HH\\:mm}) just became available. Book soon!", ct);
        }

        await _uow.SaveChangesAsync(ct);
    }

    public async Task<AppointmentDto> MarkNoShowAsync(int id, CancellationToken ct = default)
    {
        var appointment = await LoadForUpdateAsync(id, ct);
        EnsureStaffOrOwningDoctor(appointment);

        if (appointment.Status is not (AppointmentStatus.Pending or AppointmentStatus.Confirmed))
            throw new ConflictException($"Appointment in status '{appointment.Status}' cannot be marked as no-show.");

        var slotStart = appointment.AppointmentDate.ToDateTime(appointment.StartTime);
        if (slotStart > HospitalClock.Now)
            throw new BadRequestException("Cannot mark a future appointment as no-show.");

        appointment.Status = AppointmentStatus.NoShow;
        await _uow.SaveChangesAsync(ct);
        return await GetByIdUnscopedAsync(id, ct);
    }

    public async Task<AppointmentDto> RescheduleAsync(int id, RescheduleAppointmentRequest request, CancellationToken ct = default)
    {
        var appointment = await LoadForUpdateAsync(id, ct);
        await EnsureCanModifyAsync(appointment, ct);

        if (appointment.Status is not (AppointmentStatus.Pending or AppointmentStatus.Confirmed))
            throw new ConflictException($"Appointment in status '{appointment.Status}' cannot be rescheduled.");

        var schedule = await ValidateSlotAsync(appointment.DoctorId, request.AppointmentDate, request.StartTime, ct);
        var endTime = request.StartTime.AddMinutes(schedule.SlotDurationMinutes);

        await EnsureNoConflictsAsync(appointment.DoctorId, appointment.PatientId, request.AppointmentDate, request.StartTime, endTime, excludeAppointmentId: id, ct);

        appointment.AppointmentDate = request.AppointmentDate;
        appointment.StartTime = request.StartTime;
        appointment.EndTime = endTime;
        appointment.Status = AppointmentStatus.Pending;
        appointment.ReminderSent = false;
        await _uow.SaveChangesAsync(ct);

        var when = $"{request.AppointmentDate:yyyy-MM-dd} at {request.StartTime:HH\\:mm}";
        await _notifications.NotifyAsync(appointment.Patient.UserId, NotificationType.AppointmentBooked,
            "Appointment rescheduled", $"Your appointment with Dr. {appointment.Doctor.User.FullName} was moved to {when} and awaits confirmation.", ct);
        await _notifications.NotifyAsync(appointment.Doctor.UserId, NotificationType.AppointmentBooked,
            "Appointment rescheduled", $"The appointment with {appointment.Patient.User.FullName} was moved to {when}.", ct);

        return await GetByIdUnscopedAsync(id, ct);
    }

    // ---- helpers -------------------------------------------------------

    private async Task<IQueryable<Appointment>> ScopeToCurrentUserAsync(IQueryable<Appointment> query, CancellationToken ct)
    {
        switch (_currentUser.Role)
        {
            case UserRole.Patient:
            {
                var patientId = await _uow.Patients.Query()
                    .Where(p => p.UserId == _currentUser.UserId)
                    .Select(p => (int?)p.Id)
                    .FirstOrDefaultAsync(ct);
                return query.Where(a => a.PatientId == (patientId ?? -1));
            }
            case UserRole.Doctor:
            {
                var doctorId = await _uow.Doctors.Query()
                    .Where(d => d.UserId == _currentUser.UserId)
                    .Select(d => (int?)d.Id)
                    .FirstOrDefaultAsync(ct);
                return query.Where(a => a.DoctorId == (doctorId ?? -1));
            }
            default:
                return query;
        }
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
            throw new BadRequestException("PatientId is required when booking on behalf of a patient.");

        if (!await _uow.Patients.Query().AnyAsync(p => p.Id == requestedPatientId.Value, ct))
            throw new NotFoundException("Patient", requestedPatientId.Value);

        return requestedPatientId.Value;
    }

    /// <summary>Validates the requested slot falls inside the doctor's weekly schedule and aligns to the slot grid.</summary>
    private async Task<DoctorSchedule> ValidateSlotAsync(int doctorId, DateOnly date, TimeOnly startTime, CancellationToken ct)
    {
        var now = HospitalClock.Now;
        if (date < HospitalClock.Today || (date == HospitalClock.Today && startTime <= HospitalClock.CurrentTime))
            throw new BadRequestException("Appointments must be booked for a future date and time.");

        var onLeave = await _uow.DoctorLeaves.Query()
            .AnyAsync(l => l.DoctorId == doctorId && l.StartDate <= date && l.EndDate >= date, ct);
        if (onLeave)
            throw new BadRequestException("The doctor is on leave on the requested date.");

        var schedules = await _uow.DoctorSchedules.Query()
            .Where(s => s.DoctorId == doctorId && s.DayOfWeek == date.DayOfWeek)
            .ToListAsync(ct);

        if (schedules.Count == 0)
            throw new BadRequestException($"The doctor does not consult on {date.DayOfWeek}s.");

        foreach (var schedule in schedules)
        {
            var slotEnd = startTime.AddMinutes(schedule.SlotDurationMinutes);
            if (startTime < schedule.StartTime || slotEnd > schedule.EndTime)
                continue;

            var offsetMinutes = (startTime - schedule.StartTime).TotalMinutes;
            if (offsetMinutes % schedule.SlotDurationMinutes != 0)
                throw new BadRequestException(
                    $"Start time must align to {schedule.SlotDurationMinutes}-minute slots beginning at {schedule.StartTime:HH\\:mm}.");

            return schedule;
        }

        throw new BadRequestException("The requested time is outside the doctor's consulting hours for that day.");
    }

    private async Task EnsureNoConflictsAsync(int doctorId, int patientId, DateOnly date, TimeOnly start, TimeOnly end, int? excludeAppointmentId, CancellationToken ct)
    {
        var active = _uow.Appointments.Query()
            .Where(a => a.AppointmentDate == date &&
                        a.Status != AppointmentStatus.Cancelled &&
                        a.Status != AppointmentStatus.NoShow &&
                        (excludeAppointmentId == null || a.Id != excludeAppointmentId.Value) &&
                        a.StartTime < end && a.EndTime > start);

        if (await active.AnyAsync(a => a.DoctorId == doctorId, ct))
            throw new ConflictException("The doctor already has an appointment in this time slot.");

        if (await active.AnyAsync(a => a.PatientId == patientId, ct))
            throw new ConflictException("The patient already has an appointment in this time slot.");
    }

    private async Task<Appointment> LoadForUpdateAsync(int id, CancellationToken ct)
    {
        return await _uow.Appointments.QueryTracked()
            .Include(a => a.Patient).ThenInclude(p => p.User)
            .Include(a => a.Doctor).ThenInclude(d => d.User)
            .FirstOrDefaultAsync(a => a.Id == id, ct) ?? throw new NotFoundException("Appointment", id);
    }

    private void EnsureStaffOrOwningDoctor(Appointment appointment)
    {
        if (_currentUser.Role is UserRole.Admin or UserRole.Receptionist)
            return;

        if (_currentUser.Role == UserRole.Doctor && appointment.Doctor.UserId == _currentUser.UserId)
            return;

        throw new ForbiddenException();
    }

    private async Task EnsureCanModifyAsync(Appointment appointment, CancellationToken ct)
    {
        if (_currentUser.Role is UserRole.Admin or UserRole.Receptionist)
            return;

        if (_currentUser.Role == UserRole.Doctor && appointment.Doctor.UserId == _currentUser.UserId)
            return;

        if (_currentUser.Role == UserRole.Patient && appointment.Patient.UserId == _currentUser.UserId)
            return;

        await Task.CompletedTask;
        throw new ForbiddenException();
    }

    private async Task<int> GetPatientUserIdAsync(int patientId, CancellationToken ct)
    {
        return await _uow.Patients.Query()
            .Where(p => p.Id == patientId)
            .Select(p => p.UserId)
            .FirstAsync(ct);
    }

    private async Task<AppointmentDto> GetByIdUnscopedAsync(int id, CancellationToken ct)
    {
        return await _uow.Appointments.Query()
            .Where(a => a.Id == id)
            .Select(Projections.Appointment)
            .FirstAsync(ct);
    }
}
