using HAPM.Application.Common;
using HAPM.Application.DTOs;
using HAPM.Application.Interfaces;
using HAPM.Application.Mapping;
using HAPM.Domain.Entities;
using HAPM.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace HAPM.Application.Services;

public class UserService : IUserService
{
    private readonly IUnitOfWork _uow;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ICurrentUserService _currentUser;

    public UserService(IUnitOfWork uow, IPasswordHasher passwordHasher, ICurrentUserService currentUser)
    {
        _uow = uow;
        _passwordHasher = passwordHasher;
        _currentUser = currentUser;
    }

    public async Task<PagedResult<UserDto>> GetPagedAsync(UserQueryParams query, CancellationToken ct = default)
    {
        var users = _uow.Users.Query();

        if (query.Role.HasValue)
            users = users.Where(u => u.Role == query.Role.Value);

        if (query.IsActive.HasValue)
            users = users.Where(u => u.IsActive == query.IsActive.Value);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim().ToLower();
            users = users.Where(u => u.FullName.ToLower().Contains(term) || u.Email.ToLower().Contains(term));
        }

        users = (query.SortBy?.ToLowerInvariant(), query.SortDescending) switch
        {
            ("name", false) => users.OrderBy(u => u.FullName),
            ("name", true) => users.OrderByDescending(u => u.FullName),
            ("email", false) => users.OrderBy(u => u.Email),
            ("email", true) => users.OrderByDescending(u => u.Email),
            ("createdat", false) => users.OrderBy(u => u.CreatedAtUtc),
            (_, _) => users.OrderByDescending(u => u.CreatedAtUtc)
        };

        return await users.Select(Projections.User).ToPagedResultAsync(query.Page, query.PageSize, ct);
    }

    public async Task<UserDto> CreateReceptionistAsync(CreateReceptionistRequest request, CancellationToken ct = default)
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
            Role = UserRole.Receptionist
        };

        await _uow.Users.AddAsync(user, ct);
        await _uow.SaveChangesAsync(ct);

        return new UserDto(user.Id, user.Email, user.FullName, user.PhoneNumber, user.Role.ToString(), user.IsActive, user.CreatedAtUtc);
    }

    public async Task SetActiveAsync(int userId, bool isActive, CancellationToken ct = default)
    {
        if (_currentUser.UserId == userId)
            throw new BadRequestException("You cannot change the active status of your own account.");

        var user = await _uow.Users.GetByIdAsync(userId, ct) ?? throw new NotFoundException("User", userId);
        user.IsActive = isActive;

        if (!isActive)
        {
            // Revoke all active sessions for deactivated accounts.
            var tokens = await _uow.RefreshTokens.QueryTracked()
                .Where(t => t.UserId == userId && t.RevokedAtUtc == null)
                .ToListAsync(ct);
            foreach (var token in tokens)
                token.RevokedAtUtc = DateTime.UtcNow;
        }

        await _uow.SaveChangesAsync(ct);
    }

    public async Task ResetPasswordAsync(int userId, ResetPasswordRequest request, CancellationToken ct = default)
    {
        var user = await _uow.Users.GetByIdAsync(userId, ct) ?? throw new NotFoundException("User", userId);
        user.PasswordHash = _passwordHasher.Hash(request.NewPassword);
        await _uow.SaveChangesAsync(ct);
    }
}
