using HAPM.Domain.Common;
using HAPM.Domain.Enums;

namespace HAPM.Domain.Entities;

public class Appointment : BaseEntity
{
    public int PatientId { get; set; }
    public Patient Patient { get; set; } = null!;

    public int DoctorId { get; set; }
    public Doctor Doctor { get; set; } = null!;

    public DateOnly AppointmentDate { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }

    public AppointmentStatus Status { get; set; } = AppointmentStatus.Pending;
    public string Reason { get; set; } = null!;
    public string? Notes { get; set; }
    public string? CancellationReason { get; set; }
    public bool ReminderSent { get; set; }

    public Prescription? Prescription { get; set; }
    public Invoice? Invoice { get; set; }
}
