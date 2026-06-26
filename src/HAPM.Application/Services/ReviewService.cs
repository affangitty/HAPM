using HAPM.Application.Common;
using HAPM.Application.DTOs;
using HAPM.Application.Interfaces;
using HAPM.Application.Mapping;
using HAPM.Domain.Entities;
using HAPM.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace HAPM.Application.Services;

public class ReviewService : IReviewService
{
    private readonly IUnitOfWork _uow;
    private readonly ICurrentUserService _currentUser;

    public ReviewService(IUnitOfWork uow, ICurrentUserService currentUser)
    {
        _uow = uow;
        _currentUser = currentUser;
    }

    public async Task<PagedResult<ReviewDto>> GetPagedAsync(ReviewQueryParams query, CancellationToken ct = default)
    {
        var reviews = _uow.DoctorReviews.Query();

        if (query.DoctorId.HasValue)
            reviews = reviews.Where(r => r.DoctorId == query.DoctorId.Value);

        if (query.MinRating.HasValue)
            reviews = reviews.Where(r => r.Rating >= query.MinRating.Value);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim().ToLower();
            reviews = reviews.Where(r =>
                (r.Comment != null && r.Comment.ToLower().Contains(term)) ||
                r.Doctor.User.FullName.ToLower().Contains(term) ||
                r.Patient.User.FullName.ToLower().Contains(term));
        }

        reviews = (query.SortBy?.ToLowerInvariant(), query.SortDescending) switch
        {
            ("rating", false) => reviews.OrderBy(r => r.Rating),
            ("rating", true) => reviews.OrderByDescending(r => r.Rating),
            ("date", false) => reviews.OrderBy(r => r.CreatedAtUtc),
            ("date", true) => reviews.OrderByDescending(r => r.CreatedAtUtc),
            ("createdat", false) => reviews.OrderBy(r => r.CreatedAtUtc),
            ("createdat", true) => reviews.OrderByDescending(r => r.CreatedAtUtc),
            (_, _) => reviews.OrderByDescending(r => r.CreatedAtUtc)
        };

        return await reviews.Select(Projections.Review).ToPagedResultAsync(query.Page, query.PageSize, ct);
    }

    public async Task<ReviewDto> GetByIdAsync(int id, CancellationToken ct = default) =>
        await _uow.DoctorReviews.Query()
            .Where(r => r.Id == id)
            .Select(Projections.Review)
            .FirstOrDefaultAsync(ct) ?? throw new NotFoundException("Review", id);

    public async Task<ReviewDto> CreateAsync(CreateReviewRequest request, CancellationToken ct = default)
    {
        if (_currentUser.Role != UserRole.Patient)
            throw new ForbiddenException("Only patients can submit reviews.");

        var patientId = await _uow.Patients.Query()
            .Where(p => p.UserId == _currentUser.UserId)
            .Select(p => (int?)p.Id)
            .FirstOrDefaultAsync(ct) ?? throw new NotFoundException("No patient profile exists for the current user.");

        var appointment = await _uow.Appointments.Query()
            .FirstOrDefaultAsync(a => a.Id == request.AppointmentId, ct)
            ?? throw new NotFoundException("Appointment", request.AppointmentId);

        if (appointment.PatientId != patientId)
            throw new ForbiddenException("You can only review your own appointments.");

        if (appointment.Status != AppointmentStatus.Completed)
            throw new ConflictException("Only completed appointments can be reviewed.");

        if (await _uow.DoctorReviews.Query().AnyAsync(r => r.AppointmentId == request.AppointmentId, ct))
            throw new ConflictException("A review already exists for this appointment.");

        var review = new DoctorReview
        {
            DoctorId = appointment.DoctorId,
            PatientId = patientId,
            AppointmentId = appointment.Id,
            Rating = request.Rating,
            Comment = request.Comment?.Trim()
        };

        await _uow.DoctorReviews.AddAsync(review, ct);
        await _uow.SaveChangesAsync(ct);

        return await _uow.DoctorReviews.Query()
            .Where(r => r.Id == review.Id)
            .Select(Projections.Review)
            .FirstAsync(ct);
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var review = await _uow.DoctorReviews.QueryTracked()
            .Include(r => r.Patient)
            .FirstOrDefaultAsync(r => r.Id == id, ct) ?? throw new NotFoundException("Review", id);

        var isOwner = _currentUser.Role == UserRole.Patient && review.Patient.UserId == _currentUser.UserId;
        if (_currentUser.Role != UserRole.Admin && !isOwner)
            throw new ForbiddenException("Only admins or the review author can delete a review.");

        _uow.DoctorReviews.Remove(review);
        await _uow.SaveChangesAsync(ct);
    }
}
