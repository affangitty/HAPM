using HAPM.Application.Common;
using HAPM.Application.DTOs;
using HAPM.Application.Services;
using HAPM.Application.Tests.Infrastructure;

namespace HAPM.Application.Tests.Services;

public class DoctorLeaveServiceTests : ServiceTestBase
{
    private DoctorLeaveService CreateSut() => new(Uow, CurrentUser);

    [Fact]
    public async Task CreateAsync_doctor_adds_leave()
    {
        var scenario = await SeedScenarioAsync();
        CurrentUser.As(Domain.Enums.UserRole.Doctor, scenario.DoctorUserId);
        var sut = CreateSut();

        var leave = await sut.CreateAsync(scenario.DoctorId, new CreateDoctorLeaveRequest
        {
            StartDate = scenario.FutureBookingDate,
            EndDate = scenario.FutureBookingDate.AddDays(2),
            Reason = "Conference"
        });

        Assert.Equal(scenario.DoctorId, leave.DoctorId);
    }

    [Fact]
    public async Task CreateAsync_overlapping_leave_throws_conflict()
    {
        var scenario = await SeedScenarioAsync();
        CurrentUser.As(Domain.Enums.UserRole.Doctor, scenario.DoctorUserId);
        var sut = CreateSut();

        var request = new CreateDoctorLeaveRequest
        {
            StartDate = scenario.FutureBookingDate,
            EndDate = scenario.FutureBookingDate.AddDays(1),
            Reason = "Leave 1"
        };

        await sut.CreateAsync(scenario.DoctorId, request);

        await Assert.ThrowsAsync<ConflictException>(() =>
            sut.CreateAsync(scenario.DoctorId, request));
    }

    [Fact]
    public async Task CreateAsync_end_before_start_throws_bad_request()
    {
        var scenario = await SeedScenarioAsync();
        CurrentUser.As(Domain.Enums.UserRole.Doctor, scenario.DoctorUserId);
        var sut = CreateSut();

        await Assert.ThrowsAsync<BadRequestException>(() => sut.CreateAsync(scenario.DoctorId, new CreateDoctorLeaveRequest
        {
            StartDate = scenario.FutureBookingDate.AddDays(5),
            EndDate = scenario.FutureBookingDate,
            Reason = "Invalid"
        }));
    }
}
