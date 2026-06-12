using HAPM.Domain.Common;

namespace HAPM.Domain.Entities;

/// <summary>Patient feedback for a completed appointment; one review per appointment.</summary>
public class DoctorReview : BaseEntity
{
    public int DoctorId { get; set; }
    public Doctor Doctor { get; set; } = null!;

    public int PatientId { get; set; }
    public Patient Patient { get; set; } = null!;

    public int AppointmentId { get; set; }
    public Appointment Appointment { get; set; } = null!;

    /// <summary>1 to 5 stars.</summary>
    public int Rating { get; set; }
    public string? Comment { get; set; }
}
