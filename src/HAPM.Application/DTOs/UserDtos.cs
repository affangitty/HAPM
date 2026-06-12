using System.ComponentModel.DataAnnotations;
using HAPM.Application.Common;
using HAPM.Application.Validation;
using HAPM.Domain.Enums;

namespace HAPM.Application.DTOs;

public class UserQueryParams : PaginationParams
{
    public UserRole? Role { get; set; }
    public bool? IsActive { get; set; }
}

public class ResetPasswordRequest
{
    [Required, StrongPassword, MaxLength(100)]
    public string NewPassword { get; set; } = null!;
}

public class SetUserActiveRequest
{
    [Required]
    public bool IsActive { get; set; }
}

public class CreateReceptionistRequest
{
    [Required, EmailAddress, MaxLength(256)]
    public string Email { get; set; } = null!;

    [Required, StrongPassword, MaxLength(100)]
    public string Password { get; set; } = null!;

    [Required, MaxLength(150)]
    public string FullName { get; set; } = null!;

    [Required, Phone, MaxLength(20)]
    public string PhoneNumber { get; set; } = null!;
}
