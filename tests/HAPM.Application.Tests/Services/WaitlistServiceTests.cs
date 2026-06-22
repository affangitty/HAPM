using HAPM.Application.Common;
using HAPM.Application.DTOs;
using HAPM.Application.Services;
using HAPM.Application.Tests.Infrastructure;
using HAPM.Domain.Enums;

namespace HAPM.Application.Tests.Services;

public class WaitlistServiceTests : ServiceTestBase
{
    private WaitlistService CreateSut() => new(Uow, CurrentUser);

    [Fact]
    public async Task JoinAsync_patient_joins_waitlist()
    {
        var scenario = await SeedScenarioAsync();
        CurrentUser.As(UserRole.Patient, scenario.PatientUserId);
        var sut = CreateSut();

        var entry = await sut.JoinAsync(new JoinWaitlistRequest
        {
            DoctorId = scenario.DoctorId,
            PreferredDate = scenario.FutureBookingDate,
            Notes = "Need morning slot"
        });

        Assert.Equal(scenario.DoctorId, entry.DoctorId);
        Assert.Equal(WaitlistStatus.Active, entry.Status);
    }

    [Fact]
    public async Task JoinAsync_past_date_throws_bad_request()
    {
        var scenario = await SeedScenarioAsync();
        CurrentUser.As(UserRole.Patient, scenario.PatientUserId);
        var sut = CreateSut();

        await Assert.ThrowsAsync<BadRequestException>(() => sut.JoinAsync(new JoinWaitlistRequest
        {
            DoctorId = scenario.DoctorId,
            PreferredDate = HospitalClock.Today.AddDays(-1)
        }));
    }

    [Fact]
    public async Task JoinAsync_duplicate_entry_throws_conflict()
    {
        var scenario = await SeedScenarioAsync();
        CurrentUser.As(UserRole.Patient, scenario.PatientUserId);
        var sut = CreateSut();

        await sut.JoinAsync(new JoinWaitlistRequest
        {
            DoctorId = scenario.DoctorId,
            PreferredDate = scenario.FutureBookingDate
        });

        await Assert.ThrowsAsync<ConflictException>(() => sut.JoinAsync(new JoinWaitlistRequest
        {
            DoctorId = scenario.DoctorId,
            PreferredDate = scenario.FutureBookingDate
        }));
    }

    [Fact]
    public async Task CancelAsync_owner_cancels_entry()
    {
        var scenario = await SeedScenarioAsync();
        CurrentUser.As(UserRole.Patient, scenario.PatientUserId);
        var sut = CreateSut();

        var entry = await sut.JoinAsync(new JoinWaitlistRequest
        {
            DoctorId = scenario.DoctorId,
            PreferredDate = scenario.FutureBookingDate
        });

        await sut.CancelAsync(entry.Id);

        await Assert.ThrowsAsync<ConflictException>(() => sut.CancelAsync(entry.Id));
    }
}
