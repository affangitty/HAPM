using HAPM.Domain.Common;

namespace HAPM.Domain.Entities;

public class Prescription : BaseEntity
{
    public int AppointmentId { get; set; }
    public Appointment Appointment { get; set; } = null!;

    public int DoctorId { get; set; }
    public Doctor Doctor { get; set; } = null!;

    public int PatientId { get; set; }
    public Patient Patient { get; set; } = null!;

    public string Diagnosis { get; set; } = null!;
    public string? Notes { get; set; }
    public DateOnly? FollowUpDate { get; set; }

    /// <summary>Set once the follow-up reminder notification has been sent (deduplication).</summary>
    public bool FollowUpReminderSent { get; set; }

    public ICollection<PrescriptionItem> Items { get; set; } = new List<PrescriptionItem>();
}
