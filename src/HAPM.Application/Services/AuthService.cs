using HAPM.Application.Common;
using HAPM.Application.DTOs;
using HAPM.Application.Interfaces;
using HAPM.Application.Mapping;
using HAPM.Domain.Entities;
using HAPM.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace HAPM.Application.Services;

public class AuthService : IAuthService
{
    private readonly IUnitOfWork _uow;
    private readonly ITokenService _tokenService;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ICurrentUserService _currentUser;

    public AuthService(IUnitOfWork uow, ITokenService tokenService, IPasswordHasher passwordHasher, ICurrentUserService currentUser)
    {
        _uow = uow;
        _tokenService = tokenService;
        _passwordHasher = passwordHasher;
        _currentUser = currentUser;
    }

    public async Task<AuthResponse> RegisterPatientAsync(RegisterPatientRequest request, CancellationToken ct = default)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        if (await _uow.Users.Query().AnyAsync(u => u.Email == email, ct))
            throw new ConflictException($"An account with email '{email}' already exists.");

        var user = new User
        {
            Email = email,
            PasswordHash = _passwordHasher.Hash(request.Password),
            FullName = request.FullName.Trim(),
            PhoneNumber = request.PhoneNumber,
            Role = UserRole.Patient
        };

        var patient = new Patient
        {
            User = user,
            MedicalRecordNumber = await GenerateMrnAsync(ct),
            DateOfBirth = request.DateOfBirth,
            Gender = request.Gender,
            BloodGroup = request.BloodGroup,
            Address = request.Address
        };

        await _uow.Patients.AddAsync(patient, ct);
        await _uow.SaveChangesAsync(ct);

        return await IssueTokensAsync(user, ct);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken ct = default)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await _uow.Users.QueryTracked().FirstOrDefaultAsync(u => u.Email == email, ct);

        if (user is null || !_passwordHasher.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedException("Invalid email or password.");

        if (!user.IsActive)
            throw new UnauthorizedException("This account has been deactivated. Contact the administrator.");

        return await IssueTokensAsync(user, ct);
    }

    public async Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request, CancellationToken ct = default)
    {
        var token = await _uow.RefreshTokens.QueryTracked()
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Token == request.RefreshToken, ct);

        if (token is null || !token.IsActive)
            throw new UnauthorizedException("Invalid or expired refresh token.");

        if (!token.User.IsActive)
            throw new UnauthorizedException("This account has been deactivated.");

        // Rotate: revoke the old token and issue a new pair.
        token.RevokedAtUtc = DateTime.UtcNow;
        var response = await IssueTokensAsync(token.User, ct);
        token.ReplacedByToken = response.RefreshToken;
        await _uow.SaveChangesAsync(ct);

        return response;
    }

    public async Task LogoutAsync(RefreshTokenRequest request, CancellationToken ct = default)
    {
        var token = await _uow.RefreshTokens.QueryTracked()
            .FirstOrDefaultAsync(t => t.Token == request.RefreshToken, ct);

        if (token is not null && token.IsActive)
        {
            token.RevokedAtUtc = DateTime.UtcNow;
            await _uow.SaveChangesAsync(ct);
        }
    }

    public async Task ChangePasswordAsync(ChangePasswordRequest request, CancellationToken ct = default)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedException();
        var user = await _uow.Users.QueryTracked().FirstAsync(u => u.Id == userId, ct);

        if (!_passwordHasher.Verify(request.CurrentPassword, user.PasswordHash))
            throw new BadRequestException("Current password is incorrect.");

        user.PasswordHash = _passwordHasher.Hash(request.NewPassword);
        await _uow.SaveChangesAsync(ct);
    }

    public async Task<UserDto> GetCurrentUserAsync(CancellationToken ct = default)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedException();
        return await _uow.Users.Query()
            .Where(u => u.Id == userId)
            .Select(Projections.User)
            .FirstOrDefaultAsync(ct) ?? throw new NotFoundException("User", userId);
    }

    private async Task<AuthResponse> IssueTokensAsync(User user, CancellationToken ct)
    {
        var accessToken = _tokenService.CreateAccessToken(user);
        var refreshToken = new RefreshToken
        {
            UserId = user.Id,
            Token = _tokenService.CreateRefreshTokenValue(),
            ExpiresAtUtc = DateTime.UtcNow.AddDays(_tokenService.RefreshTokenDays)
        };

        await _uow.RefreshTokens.AddAsync(refreshToken, ct);
        await _uow.SaveChangesAsync(ct);

        return new AuthResponse(
            accessToken,
            refreshToken.Token,
            DateTime.UtcNow.AddMinutes(_tokenService.AccessTokenMinutes),
            new UserDto(user.Id, user.Email, user.FullName, user.PhoneNumber, user.Role.ToString(), user.IsActive, user.CreatedAtUtc));
    }

    private async Task<string> GenerateMrnAsync(CancellationToken ct)
    {
        var sequence = await _uow.Patients.Query().CountAsync(ct) + 1;
        return $"MRN-{DateTime.UtcNow.Year}-{sequence:D6}";
    }
}
