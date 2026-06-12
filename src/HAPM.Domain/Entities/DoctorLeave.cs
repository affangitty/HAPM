using HAPM.Domain.Common;

namespace HAPM.Domain.Entities;

/// <summary>An absence window during which a doctor cannot be booked.</summary>
public class DoctorLeave : BaseEntity
{
    public int DoctorId { get; set; }
    public Doctor Doctor { get; set; } = null!;

    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public string Reason { get; set; } = null!;
    public int CreatedByUserId { get; set; }
}
