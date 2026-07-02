using HAPM.API.Security;
using HAPM.Application.Common;
using HAPM.Application.DTOs;
using HAPM.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HAPM.API.Controllers;

[ApiController]
[Route("api/doctors")]
[Authorize]
public class DoctorsController : ControllerBase
{
    private readonly IDoctorService _doctorService;
    private readonly IDoctorLeaveService _leaveService;

    public DoctorsController(IDoctorService doctorService, IDoctorLeaveService leaveService)
    {
        _doctorService = doctorService;
        _leaveService = leaveService;
    }

    /// <summary>Browse doctors with search (name/specialization/qualification), filters, sorting and pagination.</summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<PagedResult<DoctorDto>>> GetAll([FromQuery] DoctorQueryParams query, CancellationToken ct) =>
        Ok(await _doctorService.GetPagedAsync(query, ct));

    [HttpGet("specializations")]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<string>>> GetSpecializations(CancellationToken ct) =>
        Ok(await _doctorService.GetSpecializationsAsync(ct));

    [HttpGet("me")]
    [Authorize(Roles = Roles.Doctor)]
    public async Task<ActionResult<DoctorDto>> GetCurrent(CancellationToken ct) =>
        Ok(await _doctorService.GetCurrentAsync(ct));

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<ActionResult<DoctorDto>> GetById(int id, CancellationToken ct) =>
        Ok(await _doctorService.GetByIdAsync(id, ct));

    /// <summary>Free slots for a doctor on a given date, derived from the weekly schedule minus booked appointments.</summary>
    [HttpGet("{id:int}/available-slots")]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<AvailableSlotDto>>> GetAvailableSlots(int id, [FromQuery] DateOnly date, CancellationToken ct) =>
        Ok(await _doctorService.GetAvailableSlotsAsync(id, date, ct));

    [HttpGet("{id:int}/schedules")]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<DoctorScheduleDto>>> GetSchedules(int id, CancellationToken ct) =>
        Ok(await _doctorService.GetSchedulesAsync(id, ct));

    /// <summary>Performance metrics: appointment outcomes, no-show rate, ratings, prescriptions, revenue. Doctors see their own only.</summary>
    [HttpGet("{id:int}/performance")]
    [Authorize(Roles = Roles.Admin + "," + Roles.Doctor)]
    public async Task<ActionResult<DoctorPerformanceDto>> GetPerformance(int id, CancellationToken ct) =>
        Ok(await _doctorService.GetPerformanceAsync(id, ct));

    /// <summary>Creates the doctor's login account and profile.</summary>
    [HttpPost]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<DoctorDto>> Create(CreateDoctorRequest request, CancellationToken ct)
    {
        var doctor = await _doctorService.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = doctor.Id }, doctor);
    }

    [HttpPatch("{id:int}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<DoctorDto>> Patch(int id, PatchDoctorRequest request, CancellationToken ct) =>
        Ok(await _doctorService.PatchAsync(id, request, ct));

    /// <summary>Doctor updates their own profile (name, phone, room, biography).</summary>
    [HttpPatch("{id:int}/profile")]
    [Authorize(Roles = Roles.Doctor)]
    public async Task<ActionResult<DoctorDto>> PatchOwnProfile(int id, PatchOwnDoctorProfileRequest request, CancellationToken ct) =>
        Ok(await _doctorService.PatchOwnProfileAsync(id, request, ct));

    /// <summary>Replaces the doctor's weekly consulting schedule.</summary>
    [HttpPut("{id:int}/schedules")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<IReadOnlyList<DoctorScheduleDto>>> SetSchedules(int id, List<ScheduleSlotRequest> slots, CancellationToken ct) =>
        Ok(await _doctorService.SetSchedulesAsync(id, slots, ct));

    /// <summary>Soft delete: deactivates the doctor's account and hides them from booking.</summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Deactivate(int id, CancellationToken ct)
    {
        await _doctorService.DeactivateAsync(id, ct);
        return NoContent();
    }

    // ---- leave management ------------------------------------------------

    [HttpGet("{id:int}/leaves")]
    [Authorize(Roles = Roles.Admin + "," + Roles.Doctor + "," + Roles.Receptionist)]
    public async Task<ActionResult<IReadOnlyList<DoctorLeaveDto>>> GetLeaves(int id, CancellationToken ct) =>
        Ok(await _leaveService.GetForDoctorAsync(id, ct));

    /// <summary>
    /// Registers a leave window (admin or the doctor themselves). Booking and slot lookup are
    /// blocked for the period; creation is rejected while active appointments exist in it.
    /// </summary>
    [HttpPost("{id:int}/leaves")]
    [Authorize(Roles = Roles.Admin + "," + Roles.Doctor)]
    public async Task<ActionResult<DoctorLeaveDto>> CreateLeave(int id, CreateDoctorLeaveRequest request, CancellationToken ct) =>
        Ok(await _leaveService.CreateAsync(id, request, ct));

    [HttpDelete("{id:int}/leaves/{leaveId:int}")]
    [Authorize(Roles = Roles.Admin + "," + Roles.Doctor)]
    public async Task<IActionResult> DeleteLeave(int id, int leaveId, CancellationToken ct)
    {
        await _leaveService.DeleteAsync(id, leaveId, ct);
        return NoContent();
    }
}
