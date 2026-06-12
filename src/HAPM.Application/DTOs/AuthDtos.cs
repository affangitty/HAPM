using System.ComponentModel.DataAnnotations;
using HAPM.Application.Validation;
using HAPM.Domain.Enums;

namespace HAPM.Application.DTOs;

public class RegisterPatientRequest
{
    [Required, EmailAddress, MaxLength(256)]
    public string Email { get; set; } = null!;

    [Required, StrongPassword, MaxLength(100)]
    public string Password { get; set; } = null!;

    [Required, MaxLength(150)]
    public string FullName { get; set; } = null!;

    [Required, Phone, MaxLength(20)]
    public string PhoneNumber { get; set; } = null!;

    [Required]
    public DateOnly DateOfBirth { get; set; }

    [Required]
    public Gender Gender { get; set; }

    [MaxLength(10)]
    public string? BloodGroup { get; set; }

    [MaxLength(500)]
    public string? Address { get; set; }
}

public class LoginRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = null!;

    [Required]
    public string Password { get; set; } = null!;
}

public class RefreshTokenRequest
{
    [Required]
    public string RefreshToken { get; set; } = null!;
}

public class ChangePasswordRequest
{
    [Required]
    public string CurrentPassword { get; set; } = null!;

    [Required, StrongPassword, MaxLength(100)]
    public string NewPassword { get; set; } = null!;
}

public record UserDto(int Id, string Email, string FullName, string? PhoneNumber, string Role, bool IsActive, DateTime CreatedAtUtc);

public record AuthResponse(
    string AccessToken,
    string RefreshToken,
    DateTime AccessTokenExpiresAtUtc,
    UserDto User);
