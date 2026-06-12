using HAPM.API.Security;
using HAPM.Application.Common;
using HAPM.Application.DTOs;
using HAPM.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HAPM.API.Controllers;

[ApiController]
[Route("api/reviews")]
public class ReviewsController : ControllerBase
{
    private readonly IReviewService _reviewService;

    public ReviewsController(IReviewService reviewService) => _reviewService = reviewService;

    /// <summary>Public doctor reviews; filter by doctorId / minRating, sort by rating or date.</summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<PagedResult<ReviewDto>>> GetAll([FromQuery] ReviewQueryParams query, CancellationToken ct) =>
        Ok(await _reviewService.GetPagedAsync(query, ct));

    /// <summary>Submit a rating (1-5) for one of your completed appointments. One review per appointment.</summary>
    [HttpPost]
    [Authorize(Roles = Roles.Patient)]
    public async Task<ActionResult<ReviewDto>> Create(CreateReviewRequest request, CancellationToken ct) =>
        Ok(await _reviewService.CreateAsync(request, ct));

    /// <summary>Delete a review (admin, or the patient who wrote it).</summary>
    [HttpDelete("{id:int}")]
    [Authorize]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await _reviewService.DeleteAsync(id, ct);
        return NoContent();
    }
}
