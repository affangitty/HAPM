using HAPM.Application.Common;
using HAPM.Application.DTOs;
using HAPM.Application.Services;
using HAPM.Application.Tests.Infrastructure;
using HAPM.Domain.Enums;

namespace HAPM.Application.Tests.Services;

public class AppointmentServiceTests : ServiceTestBase
{
    private AppointmentService CreateSut() =>
        new(Uow, CurrentUser, Notifications, Board);

    [Fact]
    public async Task BookAsync_patient_books_valid_slot()
    {
        var scenario = await SeedScenarioAsync();
        CurrentUser.As(UserRole.Patient, scenario.PatientUserId);
        var sut = CreateSut();

        var result = await sut.BookAsync(new BookAppointmentRequest
        {
            DoctorId = scenario.DoctorId,
            AppointmentDate = scenario.FutureBookingDate,
            StartTime = scenario.DefaultSlotStart,
            Reason = "Chest pain"
        });

        Assert.Equal(AppointmentStatus.Pending, result.Status);
        Assert.Equal(scenario.PatientId, result.PatientId);
        Assert.Equal(2, Notifications.Sent.Count);
    }

    [Fact]
    public async Task BookAsync_unavailable_doctor_throws_bad_request()
    {
        var scenario = await SeedScenarioAsync();
        var doctor = await Uow.Doctors.GetByIdAsync(scenario.DoctorId);
        doctor!.IsAvailable = false;
        await Uow.SaveChangesAsync();

        CurrentUser.As(UserRole.Receptionist, scenario.ReceptionistUserId);
        var sut = CreateSut();

        await Assert.ThrowsAsync<BadRequestException>(() => sut.BookAsync(new BookAppointmentRequest
        {
            DoctorId = scenario.DoctorId,
            PatientId = scenario.PatientId,
            AppointmentDate = scenario.FutureBookingDate,
            StartTime = scenario.DefaultSlotStart,
            Reason = "Visit"
        }));
    }

    [Fact]
    public async Task BookAsync_double_booking_same_doctor_throws_conflict()
    {
        var scenario = await SeedScenarioAsync();
        await TestData.SeedAppointmentAsync(
            Uow, scenario.DoctorId, scenario.SecondPatientId,
            scenario.FutureBookingDate, scenario.DefaultSlotStart, AppointmentStatus.Confirmed);

        CurrentUser.As(UserRole.Patient, scenario.PatientUserId);
        var sut = CreateSut();

        await Assert.ThrowsAsync<ConflictException>(() => sut.BookAsync(new BookAppointmentRequest
        {
            DoctorId = scenario.DoctorId,
            AppointmentDate = scenario.FutureBookingDate,
            StartTime = scenario.DefaultSlotStart,
            Reason = "Visit"
        }));
    }

    [Fact]
    public async Task BookAsync_past_slot_throws_bad_request()
    {
        var scenario = await SeedScenarioAsync();
        CurrentUser.As(UserRole.Receptionist, scenario.ReceptionistUserId);
        var sut = CreateSut();

        await Assert.ThrowsAsync<BadRequestException>(() => sut.BookAsync(new BookAppointmentRequest
        {
            DoctorId = scenario.DoctorId,
            PatientId = scenario.PatientId,
            AppointmentDate = HospitalClock.Today.AddDays(-1),
            StartTime = new TimeOnly(10, 0),
            Reason = "Past"
        }));
    }

    [Fact]
    public async Task ConfirmAsync_pending_to_confirmed()
    {
        var scenario = await SeedScenarioAsync();
        var appointment = await TestData.SeedAppointmentAsync(
            Uow, scenario.DoctorId, scenario.PatientId,
            scenario.FutureBookingDate, scenario.DefaultSlotStart, AppointmentStatus.Pending);

        CurrentUser.As(UserRole.Doctor, scenario.DoctorUserId);
        var sut = CreateSut();

        var result = await sut.ConfirmAsync(appointment.Id);

        Assert.Equal(AppointmentStatus.Confirmed, result.Status);
        Assert.Contains(Notifications.Sent, n => n.Type == NotificationType.AppointmentConfirmed);
    }

    [Fact]
    public async Task ConfirmAsync_non_pending_throws_conflict()
    {
        var scenario = await SeedScenarioAsync();
        var appointment = await TestData.SeedAppointmentAsync(
            Uow, scenario.DoctorId, scenario.PatientId,
            scenario.FutureBookingDate, scenario.DefaultSlotStart, AppointmentStatus.Confirmed);

        CurrentUser.As(UserRole.Doctor, scenario.DoctorUserId);
        var sut = CreateSut();

        await Assert.ThrowsAsync<ConflictException>(() => sut.ConfirmAsync(appointment.Id));
    }

    [Fact]
    public async Task CheckInAsync_confirmed_to_checked_in()
    {
        var scenario = await SeedScenarioAsync();
        var appointment = await TestData.SeedAppointmentAsync(
            Uow, scenario.DoctorId, scenario.PatientId,
            scenario.FutureBookingDate, scenario.DefaultSlotStart, AppointmentStatus.Confirmed);

        CurrentUser.As(UserRole.Receptionist, scenario.ReceptionistUserId);
        var sut = CreateSut();

        var result = await sut.CheckInAsync(appointment.Id);

        Assert.Equal(AppointmentStatus.CheckedIn, result.Status);
    }

    [Fact]
    public async Task CompleteAsync_sends_completion_notification()
    {
        var scenario = await SeedScenarioAsync();
        var appointment = await TestData.SeedAppointmentAsync(
            Uow, scenario.DoctorId, scenario.PatientId,
            scenario.FutureBookingDate, scenario.DefaultSlotStart, AppointmentStatus.CheckedIn);

        CurrentUser.As(UserRole.Doctor, scenario.DoctorUserId);
        var sut = CreateSut();

        var result = await sut.CompleteAsync(appointment.Id, new CompleteAppointmentRequest { Notes = "Recovered" });

        Assert.Equal(AppointmentStatus.Completed, result.Status);
        Assert.Contains(Notifications.Sent, n => n.Type == NotificationType.AppointmentCompleted);
    }

    [Fact]
    public async Task CancelAsync_notifies_waitlisted_patients()
    {
        var scenario = await SeedScenarioAsync();
        var appointment = await TestData.SeedAppointmentAsync(
            Uow, scenario.DoctorId, scenario.PatientId,
            scenario.FutureBookingDate, scenario.DefaultSlotStart, AppointmentStatus.Confirmed);

        await Uow.WaitlistEntries.AddAsync(new Domain.Entities.WaitlistEntry
        {
            DoctorId = scenario.DoctorId,
            PatientId = scenario.SecondPatientId,
            PreferredDate = scenario.FutureBookingDate,
            Status = WaitlistStatus.Active
        });
        await Uow.SaveChangesAsync();

        CurrentUser.As(UserRole.Patient, scenario.PatientUserId);
        var sut = CreateSut();

        await sut.CancelAsync(appointment.Id, new CancelAppointmentRequest { Reason = "Cannot attend" });

        Assert.Contains(Notifications.Sent, n => n.Type == NotificationType.WaitlistSlotOpened);
    }

    [Fact]
    public async Task MarkNoShowAsync_future_appointment_throws_bad_request()
    {
        var scenario = await SeedScenarioAsync();
        var appointment = await TestData.SeedAppointmentAsync(
            Uow, scenario.DoctorId, scenario.PatientId,
            scenario.FutureBookingDate, scenario.DefaultSlotStart, AppointmentStatus.Confirmed);

        CurrentUser.As(UserRole.Doctor, scenario.DoctorUserId);
        var sut = CreateSut();

        await Assert.ThrowsAsync<BadRequestException>(() => sut.MarkNoShowAsync(appointment.Id));
    }

    [Fact]
    public async Task MarkNoShowAsync_past_appointment_succeeds()
    {
        var scenario = await SeedScenarioAsync();
        var pastDate = HospitalClock.Today.AddDays(-2);
        var appointment = await TestData.SeedAppointmentAsync(
            Uow, scenario.DoctorId, scenario.PatientId,
            pastDate, new TimeOnly(10, 0), AppointmentStatus.Confirmed);

        CurrentUser.As(UserRole.Doctor, scenario.DoctorUserId);
        var sut = CreateSut();

        var result = await sut.MarkNoShowAsync(appointment.Id);

        Assert.Equal(AppointmentStatus.NoShow, result.Status);
    }

    [Fact]
    public async Task RescheduleAsync_resets_to_pending()
    {
        var scenario = await SeedScenarioAsync();
        var appointment = await TestData.SeedAppointmentAsync(
            Uow, scenario.DoctorId, scenario.PatientId,
            scenario.FutureBookingDate, scenario.DefaultSlotStart, AppointmentStatus.Confirmed);

        var newStart = scenario.DefaultSlotStart.AddMinutes(30);
        CurrentUser.As(UserRole.Patient, scenario.PatientUserId);
        var sut = CreateSut();

        var result = await sut.RescheduleAsync(appointment.Id, new RescheduleAppointmentRequest
        {
            AppointmentDate = scenario.FutureBookingDate,
            StartTime = newStart
        });

        Assert.Equal(AppointmentStatus.Pending, result.Status);
        Assert.Equal(newStart, result.StartTime);
    }

    [Fact]
    public async Task ConfirmAsync_unauthorized_doctor_throws_forbidden()
    {
        var scenario = await SeedScenarioAsync();
        var appointment = await TestData.SeedAppointmentAsync(
            Uow, scenario.DoctorId, scenario.PatientId,
            scenario.FutureBookingDate, scenario.DefaultSlotStart, AppointmentStatus.Pending);

        CurrentUser.As(UserRole.Doctor, scenario.SecondPatientUserId);
        var sut = CreateSut();

        await Assert.ThrowsAsync<ForbiddenException>(() => sut.ConfirmAsync(appointment.Id));
    }
}
