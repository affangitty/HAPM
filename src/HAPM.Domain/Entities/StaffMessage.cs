using HAPM.Domain.Common;
using HAPM.Domain.Enums;

namespace HAPM.Domain.Entities;

/// <summary>Internal staff-only operational message (not patient-facing).</summary>
public class StaffMessage : BaseEntity
{
    public int SenderUserId { get; set; }
    public User Sender { get; set; } = null!;

    public StaffMessageTarget Target { get; set; }

    /// <summary>Set when <see cref="Target"/> is <see cref="StaffMessageTarget.DoctorRoom"/>.</summary>
    public int? DoctorId { get; set; }
    public Doctor? Doctor { get; set; }

    public string Content { get; set; } = null!;
}
