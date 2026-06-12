using HAPM.Domain.Common;
using HAPM.Domain.Enums;

namespace HAPM.Domain.Entities;

public class Patient : BaseEntity
{
    public int UserId { get; set; }
    public User User { get; set; } = null!;

    /// <summary>Auto-generated Medical Record Number, e.g. MRN-2026-000123.</summary>
    public string MedicalRecordNumber { get; set; } = null!;
    public DateOnly DateOfBirth { get; set; }
    public Gender Gender { get; set; }
    public string? BloodGroup { get; set; }
    public string? Address { get; set; }
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactPhone { get; set; }
    public string? Allergies { get; set; }
    public string? ChronicConditions { get; set; }

    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
    public ICollection<LabReport> LabReports { get; set; } = new List<LabReport>();
    public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
}
