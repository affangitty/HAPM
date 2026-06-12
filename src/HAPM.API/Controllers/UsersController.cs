using HAPM.API.Security;
using HAPM.Application.Common;
using HAPM.Application.DTOs;
using HAPM.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HAPM.API.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Roles = Roles.Admin)]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService) => _userService = userService;

    /// <summary>Lists all user accounts with search, filtering and pagination.</summary>
    [HttpGet]
    public async Task<ActionResult<PagedResult<UserDto>>> GetAll([FromQuery] UserQueryParams query, CancellationToken ct) =>
        Ok(await _userService.GetPagedAsync(query, ct));

    [HttpPost("receptionists")]
    public async Task<ActionResult<UserDto>> CreateReceptionist(CreateReceptionistRequest request, CancellationToken ct) =>
        Ok(await _userService.CreateReceptionistAsync(request, ct));

    /// <summary>Activates or deactivates an account. Deactivation revokes all refresh tokens.</summary>
    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> SetActive(int id, SetUserActiveRequest request, CancellationToken ct)
    {
        await _userService.SetActiveAsync(id, request.IsActive, ct);
        return NoContent();
    }

    [HttpPost("{id:int}/reset-password")]
    public async Task<IActionResult> ResetPassword(int id, ResetPasswordRequest request, CancellationToken ct)
    {
        await _userService.ResetPasswordAsync(id, request, ct);
        return NoContent();
    }
}
