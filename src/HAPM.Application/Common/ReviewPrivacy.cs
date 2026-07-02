using HAPM.Application.DTOs;
using HAPM.Domain.Enums;

namespace HAPM.Application.Common;

public static class ReviewPrivacy
{
    public const string MaskedPatientName = "Verified patient";

    public static ReviewDto Apply(ReviewDto review, UserRole? viewerRole, int? viewerDoctorId, int? viewerPatientId) =>
        CanViewPatientIdentity(review, viewerRole, viewerDoctorId, viewerPatientId)
            ? review
            : review with { PatientId = 0, PatientName = MaskedPatientName };

    public static IReadOnlyList<ReviewDto> ApplyAll(
        IReadOnlyList<ReviewDto> reviews,
        UserRole? viewerRole,
        int? viewerDoctorId,
        int? viewerPatientId) =>
        reviews.Select(r => Apply(r, viewerRole, viewerDoctorId, viewerPatientId)).ToList();

    private static bool CanViewPatientIdentity(
        ReviewDto review,
        UserRole? viewerRole,
        int? viewerDoctorId,
        int? viewerPatientId)
    {
        if (viewerRole is null)
            return false;

        return viewerRole switch
        {
            UserRole.Admin or UserRole.Receptionist => true,
            UserRole.Doctor => viewerDoctorId == review.DoctorId,
            UserRole.Patient => viewerPatientId == review.PatientId,
            _ => false
        };
    }
}
