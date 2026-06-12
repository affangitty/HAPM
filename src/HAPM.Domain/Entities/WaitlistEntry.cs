using HAPM.Domain.Common;
using HAPM.Domain.Enums;

namespace HAPM.Domain.Entities;

/// <summary>A patient waiting for a slot with a doctor on a preferred date.</summary>
public class WaitlistEntry : BaseEntity
{
    public int DoctorId { get; set; }
    public Doctor Doctor { get; set; } = null!;

    public int PatientId { get; set; }
    public Patient Patient { get; set; } = null!;

    public DateOnly PreferredDate { get; set; }
    public WaitlistStatus Status { get; set; } = WaitlistStatus.Active;
    public string? Notes { get; set; }
    public DateTime? NotifiedAtUtc { get; set; }
}
