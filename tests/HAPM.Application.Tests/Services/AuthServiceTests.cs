using HAPM.Application.Common;
using HAPM.Application.DTOs;
using HAPM.Application.Services;
using HAPM.Application.Tests.Infrastructure;
using HAPM.Domain.Enums;

namespace HAPM.Application.Tests.Services;

public class AuthServiceTests : ServiceTestBase
{
    private AuthService CreateSut() =>
        new(Uow, TokenService, PasswordHasher, CurrentUser);

    [Fact]
    public async Task RegisterPatientAsync_creates_user_and_returns_tokens()
    {
        var sut = CreateSut();
        var request = new RegisterPatientRequest
        {
            Email = "new.patient@test.local",
            Password = TestData.DefaultPassword,
            FullName = "New Patient",
            PhoneNumber = "+19998887777",
            DateOfBirth = new DateOnly(1995, 1, 1),
            Gender = Gender.Female
        };

        var response = await sut.RegisterPatientAsync(request);

        Assert.NotEmpty(response.AccessToken);
        Assert.NotEmpty(response.RefreshToken);
        Assert.Equal("new.patient@test.local", response.User.Email);
        Assert.Equal("Patient", response.User.Role);
    }

    [Fact]
    public async Task RegisterPatientAsync_duplicate_email_throws_conflict()
    {
        var scenario = await SeedScenarioAsync();
        _ = scenario;

        var sut = CreateSut();
        var request = new RegisterPatientRequest
        {
            Email = "patient@test.local",
            Password = TestData.DefaultPassword,
            FullName = "Duplicate",
            PhoneNumber = "+11111111111",
            DateOfBirth = new DateOnly(1990, 1, 1),
            Gender = Gender.Male
        };

        await Assert.ThrowsAsync<ConflictException>(() => sut.RegisterPatientAsync(request));
    }

    [Fact]
    public async Task LoginAsync_valid_credentials_returns_tokens()
    {
        var scenario = await SeedScenarioAsync();
        var sut = CreateSut();

        var response = await sut.LoginAsync(new LoginRequest
        {
            Email = "patient@test.local",
            Password = TestData.DefaultPassword
        });

        Assert.Equal(scenario.PatientUserId, response.User.Id);
        Assert.StartsWith("access-token-", response.AccessToken);
    }

    [Fact]
    public async Task LoginAsync_wrong_password_throws_unauthorized()
    {
        await SeedScenarioAsync();
        var sut = CreateSut();

        await Assert.ThrowsAsync<UnauthorizedException>(() => sut.LoginAsync(new LoginRequest
        {
            Email = "patient@test.local",
            Password = "Wrong@12345"
        }));
    }

    [Fact]
    public async Task LoginAsync_deactivated_user_throws_unauthorized()
    {
        var scenario = await SeedScenarioAsync();
        var user = await Uow.Users.GetByIdAsync(scenario.PatientUserId);
        user!.IsActive = false;
        await Uow.SaveChangesAsync();

        var sut = CreateSut();
        await Assert.ThrowsAsync<UnauthorizedException>(() => sut.LoginAsync(new LoginRequest
        {
            Email = "patient@test.local",
            Password = TestData.DefaultPassword
        }));
    }

    [Fact]
    public async Task RefreshTokenAsync_rotates_token()
    {
        await SeedScenarioAsync();
        var sut = CreateSut();
        var login = await sut.LoginAsync(new LoginRequest
        {
            Email = "patient@test.local",
            Password = TestData.DefaultPassword
        });

        var refreshed = await sut.RefreshTokenAsync(new RefreshTokenRequest { RefreshToken = login.RefreshToken });

        Assert.NotEqual(login.RefreshToken, refreshed.RefreshToken);
        Assert.NotEmpty(refreshed.AccessToken);
    }

    [Fact]
    public async Task RefreshTokenAsync_invalid_token_throws_unauthorized()
    {
        await SeedScenarioAsync();
        var sut = CreateSut();

        await Assert.ThrowsAsync<UnauthorizedException>(() =>
            sut.RefreshTokenAsync(new RefreshTokenRequest { RefreshToken = "invalid-token" }));
    }

    [Fact]
    public async Task ChangePasswordAsync_wrong_current_password_throws_bad_request()
    {
        var scenario = await SeedScenarioAsync();
        CurrentUser.As(UserRole.Patient, scenario.PatientUserId);
        var sut = CreateSut();

        await Assert.ThrowsAsync<BadRequestException>(() => sut.ChangePasswordAsync(new ChangePasswordRequest
        {
            CurrentPassword = "Wrong@12345",
            NewPassword = "NewPass@12345"
        }));
    }

    [Fact]
    public async Task ChangePasswordAsync_success_updates_hash()
    {
        var scenario = await SeedScenarioAsync();
        CurrentUser.As(UserRole.Patient, scenario.PatientUserId);
        var sut = CreateSut();

        await sut.ChangePasswordAsync(new ChangePasswordRequest
        {
            CurrentPassword = TestData.DefaultPassword,
            NewPassword = "NewPass@12345"
        });

        var login = await sut.LoginAsync(new LoginRequest
        {
            Email = "patient@test.local",
            Password = "NewPass@12345"
        });
        Assert.Equal(scenario.PatientUserId, login.User.Id);
    }

    [Fact]
    public async Task GetCurrentUserAsync_returns_authenticated_user()
    {
        var scenario = await SeedScenarioAsync();
        CurrentUser.As(UserRole.Patient, scenario.PatientUserId, "patient@test.local");
        var sut = CreateSut();

        var user = await sut.GetCurrentUserAsync();

        Assert.Equal(scenario.PatientUserId, user.Id);
        Assert.Equal("patient@test.local", user.Email);
    }
}
