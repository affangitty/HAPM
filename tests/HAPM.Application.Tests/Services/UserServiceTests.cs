using HAPM.Application.Common;
using HAPM.Application.DTOs;
using HAPM.Application.Services;
using HAPM.Application.Tests.Infrastructure;
using HAPM.Domain.Enums;

namespace HAPM.Application.Tests.Services;

public class UserServiceTests : ServiceTestBase
{
    private UserService CreateSut() =>
        new(Uow, PasswordHasher, CurrentUser);

    [Fact]
    public async Task CreateReceptionistAsync_creates_user()
    {
        await SeedScenarioAsync();
        var sut = CreateSut();

        var user = await sut.CreateReceptionistAsync(new CreateReceptionistRequest
        {
            Email = "new.reception@test.local",
            Password = TestData.DefaultPassword,
            FullName = "New Receptionist",
            PhoneNumber = "+12223334444"
        });

        Assert.Equal("Receptionist", user.Role);
        Assert.True(user.IsActive);
    }

    [Fact]
    public async Task CreateReceptionistAsync_duplicate_email_throws_conflict()
    {
        await SeedScenarioAsync();
        var sut = CreateSut();

        await Assert.ThrowsAsync<ConflictException>(() => sut.CreateReceptionistAsync(new CreateReceptionistRequest
        {
            Email = "reception@test.local",
            Password = TestData.DefaultPassword,
            FullName = "Duplicate",
            PhoneNumber = "+11111111111"
        }));
    }

    [Fact]
    public async Task SetActiveAsync_deactivates_user_and_revokes_tokens()
    {
        var scenario = await SeedScenarioAsync();
        await Uow.RefreshTokens.AddAsync(new Domain.Entities.RefreshToken
        {
            UserId = scenario.PatientUserId,
            Token = TokenHasher.Hash("active-token"),
            ExpiresAtUtc = DateTime.UtcNow.AddDays(7)
        });
        await Uow.SaveChangesAsync();

        CurrentUser.As(UserRole.Admin, scenario.AdminUserId);
        var sut = CreateSut();

        await sut.SetActiveAsync(scenario.PatientUserId, isActive: false);

        var user = await Uow.Users.GetByIdAsync(scenario.PatientUserId);
        Assert.False(user!.IsActive);
    }

    [Fact]
    public async Task SetActiveAsync_own_account_throws_bad_request()
    {
        var scenario = await SeedScenarioAsync();
        CurrentUser.As(UserRole.Admin, scenario.AdminUserId);
        var sut = CreateSut();

        await Assert.ThrowsAsync<BadRequestException>(() =>
            sut.SetActiveAsync(scenario.AdminUserId, isActive: false));
    }

    [Fact]
    public async Task ResetPasswordAsync_updates_hash()
    {
        var scenario = await SeedScenarioAsync();
        var sut = CreateSut();

        await sut.ResetPasswordAsync(scenario.PatientUserId, new ResetPasswordRequest
        {
            NewPassword = "Reset@12345"
        });

        var user = await Uow.Users.GetByIdAsync(scenario.PatientUserId);
        Assert.True(PasswordHasher.Verify("Reset@12345", user!.PasswordHash));
    }
}
