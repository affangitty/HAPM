using HAPM.Application.Common;
using HAPM.Application.DTOs;
using HAPM.Application.Validation;
using HAPM.Application.Interfaces;
using HAPM.Application.Mapping;
using HAPM.Domain.Entities;
using HAPM.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace HAPM.Application.Services;

public class VitalSignService : IVitalSignService
{
    private readonly IUnitOfWork _uow;
    private readonly ICurrentUserService _currentUser;

    public VitalSignService(IUnitOfWork uow, ICurrentUserService currentUser)
    {
        _uow = uow;
        _currentUser = currentUser;
    }

    public async Task<PagedResult<VitalSignDto>> GetPagedAsync(VitalSignQueryParams query, CancellationToken ct = default)
    {
        var vitals = await ScopeToCurrentUserAsync(_uow.VitalSigns.Query(), ct);

        if (query.PatientId.HasValue)
            vitals = vitals.Where(v => v.PatientId == query.PatientId.Value);

        if (query.AppointmentId.HasValue)
            vitals = vitals.Where(v => v.AppointmentId == query.AppointmentId.Value);

        return await vitals
            .OrderByDescending(v => v.CreatedAtUtc)
            .Select(Projections.VitalSign)
            .ToPagedResultAsync(query.Page, query.PageSize, ct);
    }

    public async Task<VitalSignDto> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var scoped = await ScopeToCurrentUserAsync(_uow.VitalSigns.Query(), ct);
        return await scoped
            .Where(v => v.Id == id)
            .Select(Projections.VitalSign)
            .FirstOrDefaultAsync(ct) ?? throw new NotFoundException("Vital sign record", id);
    }

    public async Task<VitalSignDto> RecordAsync(RecordVitalSignRequest request, CancellationToken ct = default)
    {
        var appointment = await _uow.Appointments.Query()
            .FirstOrDefaultAsync(a => a.Id == request.AppointmentId, ct)
            ?? throw new NotFoundException("Appointment", request.AppointmentId);

        if (appointment.Status is AppointmentStatus.Cancelled or AppointmentStatus.NoShow)
            throw new ConflictException("Vitals cannot be recorded for a cancelled or no-show appointment.");

        await EnsureCanRecordForAppointmentAsync(appointment, ct);

        if (request.TemperatureCelsius is null && request.PulseBpm is null && request.RespiratoryRatePerMin is null &&
            request.SystolicBpMmHg is null && request.DiastolicBpMmHg is null && request.OxygenSaturationPercent is null &&
            request.HeightCm is null && request.WeightKg is null)
            throw new BadRequestException("At least one vital sign reading is required.");

        VitalSignRules.ValidateBloodPressure(request.SystolicBpMmHg, request.DiastolicBpMmHg);

        var vitals = new VitalSign
        {
            AppointmentId = appointment.Id,
            PatientId = appointment.PatientId,
            RecordedByUserId = _currentUser.UserId ?? 0,
            TemperatureCelsius = request.TemperatureCelsius,
            PulseBpm = request.PulseBpm,
            RespiratoryRatePerMin = request.RespiratoryRatePerMin,
            SystolicBpMmHg = request.SystolicBpMmHg,
            DiastolicBpMmHg = request.DiastolicBpMmHg,
            OxygenSaturationPercent = request.OxygenSaturationPercent,
            HeightCm = request.HeightCm,
            WeightKg = request.WeightKg,
            Notes = request.Notes
        };

        await _uow.VitalSigns.AddAsync(vitals, ct);
        await _uow.SaveChangesAsync(ct);

        return await _uow.VitalSigns.Query()
            .Where(v => v.Id == vitals.Id)
            .Select(Projections.VitalSign)
            .FirstAsync(ct);
    }

    private async Task<IQueryable<VitalSign>> ScopeToCurrentUserAsync(IQueryable<VitalSign> query, CancellationToken ct)
    {
        if (_currentUser.Role == UserRole.Patient)
        {
            var patientId = await _uow.Patients.Query()
                .Where(p => p.UserId == _currentUser.UserId)
                .Select(p => (int?)p.Id)
                .FirstOrDefaultAsync(ct);
            return query.Where(v => v.PatientId == (patientId ?? -1));
        }

        if (_currentUser.Role == UserRole.Doctor)
        {
            var doctorId = await _uow.Doctors.Query()
                .Where(d => d.UserId == _currentUser.UserId)
                .Select(d => (int?)d.Id)
                .FirstOrDefaultAsync(ct);

            if (doctorId is null)
                return query.Where(_ => false);

            return query.Where(v => v.Appointment.DoctorId == doctorId);
        }

        return query;
    }

    /// <summary>Doctors record vitals only for their appointments; receptionists and admins for any visit.</summary>
    private async Task EnsureCanRecordForAppointmentAsync(Appointment appointment, CancellationToken ct)
    {
        if (_currentUser.Role != UserRole.Doctor)
            return;

        var doctorId = await _uow.Doctors.Query()
            .Where(d => d.UserId == _currentUser.UserId)
            .Select(d => (int?)d.Id)
            .FirstOrDefaultAsync(ct);

        if (doctorId is null || appointment.DoctorId != doctorId)
            throw new ForbiddenException("You can only record vitals for your own appointments.");
    }
}
