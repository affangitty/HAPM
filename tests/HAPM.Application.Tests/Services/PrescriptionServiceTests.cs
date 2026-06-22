using HAPM.Application.Common;
using HAPM.Application.DTOs;
using HAPM.Application.Services;
using HAPM.Application.Tests.Infrastructure;
using HAPM.Domain.Enums;

namespace HAPM.Application.Tests.Services;

public class PrescriptionServiceTests : ServiceTestBase
{
    private PrescriptionService CreateSut() =>
        new(Uow, CurrentUser, Notifications);

    private static CreatePrescriptionRequest SampleRequest(int appointmentId) => new()
    {
        AppointmentId = appointmentId,
        Diagnosis = "Hypertension",
        Items =
        {
            new PrescriptionItemRequest
            {
                MedicineName = "Amlodipine",
                Dosage = "5mg",
                Frequency = "Once daily",
                DurationDays = 30
            }
        }
    };

    [Fact]
    public async Task CreateAsync_checked_in_appointment_succeeds()
    {
        var scenario = await SeedScenarioAsync();
        var appointment = await TestData.SeedAppointmentAsync(
            Uow, scenario.DoctorId, scenario.PatientId,
            scenario.FutureBookingDate, scenario.DefaultSlotStart, AppointmentStatus.CheckedIn);

        CurrentUser.As(UserRole.Doctor, scenario.DoctorUserId);
        var sut = CreateSut();

        var prescription = await sut.CreateAsync(SampleRequest(appointment.Id));

        Assert.Equal("Hypertension", prescription.Diagnosis);
        Assert.Single(prescription.Items);
        Assert.Contains(Notifications.Sent, n => n.Type == NotificationType.PrescriptionIssued);
    }

    [Fact]
    public async Task CreateAsync_non_doctor_throws_forbidden()
    {
        var scenario = await SeedScenarioAsync();
        var appointment = await TestData.SeedAppointmentAsync(
            Uow, scenario.DoctorId, scenario.PatientId,
            scenario.FutureBookingDate, scenario.DefaultSlotStart, AppointmentStatus.CheckedIn);

        CurrentUser.As(UserRole.Patient, scenario.PatientUserId);
        var sut = CreateSut();

        await Assert.ThrowsAsync<ForbiddenException>(() => sut.CreateAsync(SampleRequest(appointment.Id)));
    }

    [Fact]
    public async Task CreateAsync_pending_appointment_throws_conflict()
    {
        var scenario = await SeedScenarioAsync();
        var appointment = await TestData.SeedAppointmentAsync(
            Uow, scenario.DoctorId, scenario.PatientId,
            scenario.FutureBookingDate, scenario.DefaultSlotStart, AppointmentStatus.Pending);

        CurrentUser.As(UserRole.Doctor, scenario.DoctorUserId);
        var sut = CreateSut();

        await Assert.ThrowsAsync<ConflictException>(() => sut.CreateAsync(SampleRequest(appointment.Id)));
    }

    [Fact]
    public async Task CreateAsync_duplicate_prescription_throws_conflict()
    {
        var scenario = await SeedScenarioAsync();
        var appointment = await TestData.SeedAppointmentAsync(
            Uow, scenario.DoctorId, scenario.PatientId,
            scenario.FutureBookingDate, scenario.DefaultSlotStart, AppointmentStatus.CheckedIn);

        CurrentUser.As(UserRole.Doctor, scenario.DoctorUserId);
        var sut = CreateSut();
        await sut.CreateAsync(SampleRequest(appointment.Id));

        await Assert.ThrowsAsync<ConflictException>(() => sut.CreateAsync(SampleRequest(appointment.Id)));
    }

    [Fact]
    public async Task UpdateAsync_prescribing_doctor_updates_diagnosis()
    {
        var scenario = await SeedScenarioAsync();
        var appointment = await TestData.SeedAppointmentAsync(
            Uow, scenario.DoctorId, scenario.PatientId,
            scenario.FutureBookingDate, scenario.DefaultSlotStart, AppointmentStatus.CheckedIn);

        CurrentUser.As(UserRole.Doctor, scenario.DoctorUserId);
        var sut = CreateSut();
        var created = await sut.CreateAsync(SampleRequest(appointment.Id));

        var updated = await sut.UpdateAsync(created.Id, new UpdatePrescriptionRequest
        {
            Diagnosis = "Updated diagnosis",
            Items = SampleRequest(appointment.Id).Items
        });

        Assert.Equal("Updated diagnosis", updated.Diagnosis);
    }
}
