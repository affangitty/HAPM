using HAPM.Application.Common;
using HAPM.Application.DTOs;
using HAPM.Application.Services;
using HAPM.Application.Tests.Infrastructure;
using HAPM.Domain.Enums;

namespace HAPM.Application.Tests.Services;

public class VitalSignServiceTests : ServiceTestBase
{
    private VitalSignService CreateSut() => new(Uow, CurrentUser);

    [Fact]
    public async Task RecordAsync_valid_reading_persists()
    {
        var scenario = await SeedScenarioAsync();
        var appointment = await TestData.SeedAppointmentAsync(
            Uow, scenario.DoctorId, scenario.PatientId,
            scenario.FutureBookingDate, scenario.DefaultSlotStart, AppointmentStatus.CheckedIn);

        CurrentUser.As(UserRole.Doctor, scenario.DoctorUserId);
        var sut = CreateSut();

        var result = await sut.RecordAsync(new RecordVitalSignRequest
        {
            AppointmentId = appointment.Id,
            PulseBpm = 72,
            SystolicBpMmHg = 120,
            DiastolicBpMmHg = 80
        });

        Assert.Equal(72, result.PulseBpm);
        Assert.Equal(120, result.SystolicBpMmHg);
    }

    [Fact]
    public async Task RecordAsync_no_readings_throws_bad_request()
    {
        var scenario = await SeedScenarioAsync();
        var appointment = await TestData.SeedAppointmentAsync(
            Uow, scenario.DoctorId, scenario.PatientId,
            scenario.FutureBookingDate, scenario.DefaultSlotStart, AppointmentStatus.CheckedIn);

        CurrentUser.As(UserRole.Doctor, scenario.DoctorUserId);
        var sut = CreateSut();

        await Assert.ThrowsAsync<BadRequestException>(() => sut.RecordAsync(new RecordVitalSignRequest
        {
            AppointmentId = appointment.Id
        }));
    }

    [Fact]
    public async Task RecordAsync_invalid_blood_pressure_throws_bad_request()
    {
        var scenario = await SeedScenarioAsync();
        var appointment = await TestData.SeedAppointmentAsync(
            Uow, scenario.DoctorId, scenario.PatientId,
            scenario.FutureBookingDate, scenario.DefaultSlotStart, AppointmentStatus.CheckedIn);

        CurrentUser.As(UserRole.Doctor, scenario.DoctorUserId);
        var sut = CreateSut();

        await Assert.ThrowsAsync<BadRequestException>(() => sut.RecordAsync(new RecordVitalSignRequest
        {
            AppointmentId = appointment.Id,
            SystolicBpMmHg = 80,
            DiastolicBpMmHg = 120
        }));
    }

    [Fact]
    public async Task RecordAsync_cancelled_appointment_throws_conflict()
    {
        var scenario = await SeedScenarioAsync();
        var appointment = await TestData.SeedAppointmentAsync(
            Uow, scenario.DoctorId, scenario.PatientId,
            scenario.FutureBookingDate, scenario.DefaultSlotStart, AppointmentStatus.Cancelled);

        CurrentUser.As(UserRole.Doctor, scenario.DoctorUserId);
        var sut = CreateSut();

        await Assert.ThrowsAsync<ConflictException>(() => sut.RecordAsync(new RecordVitalSignRequest
        {
            AppointmentId = appointment.Id,
            PulseBpm = 70
        }));
    }

    [Fact]
    public async Task RecordAsync_computes_bmi_when_height_and_weight_provided()
    {
        var scenario = await SeedScenarioAsync();
        var appointment = await TestData.SeedAppointmentAsync(
            Uow, scenario.DoctorId, scenario.PatientId,
            scenario.FutureBookingDate, scenario.DefaultSlotStart, AppointmentStatus.CheckedIn);

        CurrentUser.As(UserRole.Doctor, scenario.DoctorUserId);
        var sut = CreateSut();

        var result = await sut.RecordAsync(new RecordVitalSignRequest
        {
            AppointmentId = appointment.Id,
            HeightCm = 170m,
            WeightKg = 68m
        });

        Assert.NotNull(result.Bmi);
        Assert.Equal(23.5m, result.Bmi);
    }
}
