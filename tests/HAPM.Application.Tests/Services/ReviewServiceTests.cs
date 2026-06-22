using HAPM.Application.Common;
using HAPM.Application.DTOs;
using HAPM.Application.Services;
using HAPM.Application.Tests.Infrastructure;
using HAPM.Domain.Enums;

namespace HAPM.Application.Tests.Services;

public class ReviewServiceTests : ServiceTestBase
{
    private ReviewService CreateSut() => new(Uow, CurrentUser);

    [Fact]
    public async Task CreateAsync_completed_appointment_succeeds()
    {
        var scenario = await SeedScenarioAsync();
        var appointment = await TestData.SeedAppointmentAsync(
            Uow, scenario.DoctorId, scenario.PatientId,
            scenario.FutureBookingDate, scenario.DefaultSlotStart, AppointmentStatus.Completed);

        CurrentUser.As(UserRole.Patient, scenario.PatientUserId);
        var sut = CreateSut();

        var review = await sut.CreateAsync(new CreateReviewRequest
        {
            AppointmentId = appointment.Id,
            Rating = 5,
            Comment = "Excellent care"
        });

        Assert.Equal(5, review.Rating);
        Assert.Equal(scenario.DoctorId, review.DoctorId);
    }

    [Fact]
    public async Task CreateAsync_non_patient_throws_forbidden()
    {
        var scenario = await SeedScenarioAsync();
        var appointment = await TestData.SeedAppointmentAsync(
            Uow, scenario.DoctorId, scenario.PatientId,
            scenario.FutureBookingDate, scenario.DefaultSlotStart, AppointmentStatus.Completed);

        CurrentUser.As(UserRole.Doctor, scenario.DoctorUserId);
        var sut = CreateSut();

        await Assert.ThrowsAsync<ForbiddenException>(() => sut.CreateAsync(new CreateReviewRequest
        {
            AppointmentId = appointment.Id,
            Rating = 4
        }));
    }

    [Fact]
    public async Task CreateAsync_pending_appointment_throws_conflict()
    {
        var scenario = await SeedScenarioAsync();
        var appointment = await TestData.SeedAppointmentAsync(
            Uow, scenario.DoctorId, scenario.PatientId,
            scenario.FutureBookingDate, scenario.DefaultSlotStart, AppointmentStatus.Pending);

        CurrentUser.As(UserRole.Patient, scenario.PatientUserId);
        var sut = CreateSut();

        await Assert.ThrowsAsync<ConflictException>(() => sut.CreateAsync(new CreateReviewRequest
        {
            AppointmentId = appointment.Id,
            Rating = 3
        }));
    }

    [Fact]
    public async Task CreateAsync_duplicate_review_throws_conflict()
    {
        var scenario = await SeedScenarioAsync();
        var appointment = await TestData.SeedAppointmentAsync(
            Uow, scenario.DoctorId, scenario.PatientId,
            scenario.FutureBookingDate, scenario.DefaultSlotStart, AppointmentStatus.Completed);

        CurrentUser.As(UserRole.Patient, scenario.PatientUserId);
        var sut = CreateSut();

        await sut.CreateAsync(new CreateReviewRequest { AppointmentId = appointment.Id, Rating = 5 });

        await Assert.ThrowsAsync<ConflictException>(() => sut.CreateAsync(new CreateReviewRequest
        {
            AppointmentId = appointment.Id,
            Rating = 4
        }));
    }

    [Fact]
    public async Task DeleteAsync_author_can_delete_own_review()
    {
        var scenario = await SeedScenarioAsync();
        var appointment = await TestData.SeedAppointmentAsync(
            Uow, scenario.DoctorId, scenario.PatientId,
            scenario.FutureBookingDate, scenario.DefaultSlotStart, AppointmentStatus.Completed);

        CurrentUser.As(UserRole.Patient, scenario.PatientUserId);
        var sut = CreateSut();
        var review = await sut.CreateAsync(new CreateReviewRequest { AppointmentId = appointment.Id, Rating = 4 });

        await sut.DeleteAsync(review.Id);

        await Assert.ThrowsAsync<NotFoundException>(() => sut.DeleteAsync(review.Id));
    }
}
