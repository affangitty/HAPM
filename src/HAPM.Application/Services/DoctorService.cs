using HAPM.Application.Common;
using HAPM.Application.DTOs;
using HAPM.Application.Interfaces;
using HAPM.Application.Mapping;
using HAPM.Domain.Entities;
using HAPM.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace HAPM.Application.Services;

public class DoctorService : IDoctorService
{
    private readonly IUnitOfWork _uow;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ICurrentUserService _currentUser;

    public DoctorService(IUnitOfWork uow, IPasswordHasher passwordHasher, ICurrentUserService currentUser)
    {
        _uow = uow;
        _passwordHasher = passwordHasher;
        _currentUser = currentUser;
    }

    public async Task<PagedResult<DoctorDto>> GetPagedAsync(DoctorQueryParams query, CancellationToken ct = default)
    {
        var doctors = _uow.Doctors.Query();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim().ToLower();
            doctors = doctors.Where(d =>
                d.User.FullName.ToLower().Contains(term) ||
                d.Specialization.ToLower().Contains(term) ||
                d.Qualification.ToLower().Contains(term) ||
                d.LicenseNumber.ToLower().Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(query.Specialization))
            doctors = doctors.Where(d => d.Specialization.ToLower() == query.Specialization.Trim().ToLower());

        if (query.IsAvailable.HasValue)
            doctors = doctors.Where(d => d.IsAvailable == query.IsAvailable.Value);

        doctors = (query.SortBy?.ToLowerInvariant(), query.SortDescending) switch
        {
            ("name", true) => doctors.OrderByDescending(d => d.User.FullName),
            ("fee", false) => doctors.OrderBy(d => d.ConsultationFee),
            ("fee", true) => doctors.OrderByDescending(d => d.ConsultationFee),
            ("experience", false) => doctors.OrderBy(d => d.ExperienceYears),
            ("experience", true) => doctors.OrderByDescending(d => d.ExperienceYears),
            ("specialization", false) => doctors.OrderBy(d => d.Specialization),
            ("specialization", true) => doctors.OrderByDescending(d => d.Specialization),
            (_, _) => doctors.OrderBy(d => d.User.FullName)
        };

        return await doctors.Select(Projections.Doctor).ToPagedResultAsync(query.Page, query.PageSize, ct);
    }

    public async Task<DoctorDto> GetByIdAsync(int id, CancellationToken ct = default)
    {
        return await _uow.Doctors.Query()
            .Where(d => d.Id == id)
            .Select(Projections.Doctor)
            .FirstOrDefaultAsync(ct) ?? throw new NotFoundException("Doctor", id);
    }

    public async Task<DoctorDto> GetCurrentAsync(CancellationToken ct = default)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedException();
        return await _uow.Doctors.Query()
            .Where(d => d.UserId == userId)
            .Select(Projections.Doctor)
            .FirstOrDefaultAsync(ct) ?? throw new NotFoundException("No doctor profile exists for the current user.");
    }

    public async Task<DoctorDto> CreateAsync(CreateDoctorRequest request, CancellationToken ct = default)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        if (await _uow.Users.Query().AnyAsync(u => u.Email == email, ct))
            throw new ConflictException($"An account with email '{email}' already exists.");

        if (await _uow.Doctors.Query().AnyAsync(d => d.LicenseNumber == request.LicenseNumber, ct))
            throw new ConflictException($"A doctor with license number '{request.LicenseNumber}' already exists.");

        var doctor = new Doctor
        {
            User = new User
            {
                Email = email,
                PasswordHash = _passwordHasher.Hash(request.Password),
                FullName = request.FullName.Trim(),
                PhoneNumber = request.PhoneNumber,
                Role = UserRole.Doctor
            },
            Specialization = request.Specialization.Trim(),
            Qualification = request.Qualification.Trim(),
            LicenseNumber = request.LicenseNumber.Trim(),
            ExperienceYears = request.ExperienceYears,
            ConsultationFee = request.ConsultationFee,
            RoomNumber = request.RoomNumber,
            Biography = request.Biography
        };

        await _uow.Doctors.AddAsync(doctor, ct);
        await _uow.SaveChangesAsync(ct);

        return await GetByIdAsync(doctor.Id, ct);
    }

    public async Task<DoctorDto> UpdateAsync(int id, UpdateDoctorRequest request, CancellationToken ct = default)
    {
        var doctor = await _uow.Doctors.QueryTracked()
            .Include(d => d.User)
            .FirstOrDefaultAsync(d => d.Id == id, ct) ?? throw new NotFoundException("Doctor", id);

        doctor.User.FullName = request.FullName.Trim();
        doctor.User.PhoneNumber = request.PhoneNumber;
        doctor.Specialization = request.Specialization.Trim();
        doctor.Qualification = request.Qualification.Trim();
        doctor.ExperienceYears = request.ExperienceYears;
        doctor.ConsultationFee = request.ConsultationFee;
        doctor.RoomNumber = request.RoomNumber;
        doctor.Biography = request.Biography;
        doctor.IsAvailable = request.IsAvailable;

        await _uow.SaveChangesAsync(ct);
        return await GetByIdAsync(id, ct);
    }

    public async Task<DoctorDto> UpdateOwnProfileAsync(int id, UpdateOwnDoctorProfileRequest request, CancellationToken ct = default)
    {
        if (_currentUser.Role != UserRole.Doctor)
            throw new ForbiddenException("Only doctors can update their own profile.");

        var doctor = await _uow.Doctors.QueryTracked()
            .Include(d => d.User)
            .FirstOrDefaultAsync(d => d.Id == id, ct) ?? throw new NotFoundException("Doctor", id);

        if (doctor.UserId != _currentUser.UserId)
            throw new ForbiddenException("You can only update your own doctor profile.");

        doctor.User.FullName = request.FullName.Trim();
        doctor.User.PhoneNumber = request.PhoneNumber;
        doctor.RoomNumber = request.RoomNumber;
        doctor.Biography = request.Biography;

        await _uow.SaveChangesAsync(ct);
        return await GetByIdAsync(id, ct);
    }

    public async Task DeactivateAsync(int id, CancellationToken ct = default)
    {
        var doctor = await _uow.Doctors.QueryTracked()
            .Include(d => d.User)
            .FirstOrDefaultAsync(d => d.Id == id, ct) ?? throw new NotFoundException("Doctor", id);

        var hasUpcoming = await _uow.Appointments.Query().AnyAsync(a =>
            a.DoctorId == id &&
            a.AppointmentDate >= DateOnly.FromDateTime(DateTime.UtcNow.Date) &&
            (a.Status == AppointmentStatus.Pending || a.Status == AppointmentStatus.Confirmed), ct);

        if (hasUpcoming)
            throw new ConflictException("Doctor has upcoming appointments. Cancel or reassign them before deactivating.");

        doctor.IsAvailable = false;
        doctor.User.IsActive = false;
        await RefreshTokenRevocation.RevokeAllForUserAsync(_uow, doctor.UserId, ct);
        await _uow.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<DoctorScheduleDto>> SetSchedulesAsync(int doctorId, List<ScheduleSlotRequest> slots, CancellationToken ct = default)
    {
        var doctor = await _uow.Doctors.QueryTracked()
            .Include(d => d.Schedules)
            .FirstOrDefaultAsync(d => d.Id == doctorId, ct) ?? throw new NotFoundException("Doctor", doctorId);

        foreach (var slot in slots)
        {
            if (slot.StartTime >= slot.EndTime)
                throw new BadRequestException($"Schedule for {slot.DayOfWeek}: start time must be before end time.");
        }

        var overlapping = slots
            .GroupBy(s => s.DayOfWeek)
            .Any(g => g.OrderBy(s => s.StartTime)
                       .Zip(g.OrderBy(s => s.StartTime).Skip(1), (a, b) => a.EndTime > b.StartTime)
                       .Any(x => x));
        if (overlapping)
            throw new BadRequestException("Schedule windows on the same day must not overlap.");

        doctor.Schedules.Clear();
        foreach (var slot in slots)
        {
            doctor.Schedules.Add(new DoctorSchedule
            {
                DayOfWeek = slot.DayOfWeek,
                StartTime = slot.StartTime,
                EndTime = slot.EndTime,
                SlotDurationMinutes = slot.SlotDurationMinutes
            });
        }

        await _uow.SaveChangesAsync(ct);
        return await GetSchedulesAsync(doctorId, ct);
    }

    public async Task<IReadOnlyList<DoctorScheduleDto>> GetSchedulesAsync(int doctorId, CancellationToken ct = default)
    {
        if (!await _uow.Doctors.Query().AnyAsync(d => d.Id == doctorId, ct))
            throw new NotFoundException("Doctor", doctorId);

        return await _uow.DoctorSchedules.Query()
            .Where(s => s.DoctorId == doctorId)
            .OrderBy(s => s.DayOfWeek).ThenBy(s => s.StartTime)
            .Select(s => new DoctorScheduleDto(s.Id, s.DayOfWeek, s.StartTime, s.EndTime, s.SlotDurationMinutes))
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<AvailableSlotDto>> GetAvailableSlotsAsync(int doctorId, DateOnly date, CancellationToken ct = default)
    {
        if (date < HospitalClock.Today)
            throw new BadRequestException("Cannot fetch availability for a past date.");

        var doctor = await _uow.Doctors.Query().FirstOrDefaultAsync(d => d.Id == doctorId, ct)
            ?? throw new NotFoundException("Doctor", doctorId);

        if (!doctor.IsAvailable)
            return Array.Empty<AvailableSlotDto>();

        var onLeave = await _uow.DoctorLeaves.Query()
            .AnyAsync(l => l.DoctorId == doctorId && l.StartDate <= date && l.EndDate >= date, ct);
        if (onLeave)
            return Array.Empty<AvailableSlotDto>();

        var schedules = await _uow.DoctorSchedules.Query()
            .Where(s => s.DoctorId == doctorId && s.DayOfWeek == date.DayOfWeek)
            .OrderBy(s => s.StartTime)
            .ToListAsync(ct);

        if (schedules.Count == 0)
            return Array.Empty<AvailableSlotDto>();

        var booked = await _uow.Appointments.Query()
            .Where(a => a.DoctorId == doctorId &&
                        a.AppointmentDate == date &&
                        a.Status != AppointmentStatus.Cancelled &&
                        a.Status != AppointmentStatus.NoShow)
            .Select(a => new { a.StartTime, a.EndTime })
            .ToListAsync(ct);

        var isToday = date == HospitalClock.Today;
        var nowTime = HospitalClock.CurrentTime;

        var slots = new List<AvailableSlotDto>();
        foreach (var schedule in schedules)
        {
            var cursor = schedule.StartTime;
            while (cursor.AddMinutes(schedule.SlotDurationMinutes) <= schedule.EndTime)
            {
                var slotEnd = cursor.AddMinutes(schedule.SlotDurationMinutes);
                var clashes = booked.Any(b => cursor < b.EndTime && slotEnd > b.StartTime);
                var inPast = isToday && cursor <= nowTime;

                if (!clashes && !inPast)
                    slots.Add(new AvailableSlotDto(cursor, slotEnd));

                cursor = slotEnd;
            }
        }

        return slots;
    }

    public async Task<IReadOnlyList<string>> GetSpecializationsAsync(CancellationToken ct = default)
    {
        return await _uow.Doctors.Query()
            .Select(d => d.Specialization)
            .Distinct()
            .OrderBy(s => s)
            .ToListAsync(ct);
    }

    public async Task<DoctorPerformanceDto> GetPerformanceAsync(int id, CancellationToken ct = default)
    {
        var doctor = await _uow.Doctors.Query()
            .Where(d => d.Id == id)
            .Select(d => new { d.Id, d.UserId, d.User.FullName, d.Specialization })
            .FirstOrDefaultAsync(ct) ?? throw new NotFoundException("Doctor", id);

        if (_currentUser.Role == UserRole.Doctor && doctor.UserId != _currentUser.UserId)
            throw new ForbiddenException("Doctors can only view their own performance metrics.");

        var statusCounts = await _uow.Appointments.Query()
            .Where(a => a.DoctorId == id)
            .GroupBy(a => a.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        var total = statusCounts.Sum(s => s.Count);
        var completed = statusCounts.FirstOrDefault(s => s.Status == AppointmentStatus.Completed)?.Count ?? 0;
        var cancelled = statusCounts.FirstOrDefault(s => s.Status == AppointmentStatus.Cancelled)?.Count ?? 0;
        var noShows = statusCounts.FirstOrDefault(s => s.Status == AppointmentStatus.NoShow)?.Count ?? 0;

        // No-show rate over appointments that actually reached an attended-or-missed outcome.
        var concluded = completed + noShows;
        var noShowRate = concluded == 0 ? 0 : Math.Round(noShows * 100.0 / concluded, 1);

        var averageRating = await _uow.DoctorReviews.Query()
            .Where(r => r.DoctorId == id)
            .AverageAsync(r => (double?)r.Rating, ct) ?? 0;

        var reviewCount = await _uow.DoctorReviews.Query().CountAsync(r => r.DoctorId == id, ct);
        var prescriptionCount = await _uow.Prescriptions.Query().CountAsync(p => p.DoctorId == id, ct);

        var distinctPatients = await _uow.Appointments.Query()
            .Where(a => a.DoctorId == id)
            .Select(a => a.PatientId)
            .Distinct()
            .CountAsync(ct);

        var totalRevenue = await _uow.Payments.Query()
            .Where(p => p.Invoice.Appointment != null && p.Invoice.Appointment.DoctorId == id)
            .SumAsync(p => (decimal?)p.Amount, ct) ?? 0m;

        return new DoctorPerformanceDto(
            doctor.Id, doctor.FullName, doctor.Specialization,
            total, completed, cancelled, noShows, noShowRate,
            Math.Round(averageRating, 2), reviewCount, prescriptionCount,
            distinctPatients, totalRevenue);
    }
}
