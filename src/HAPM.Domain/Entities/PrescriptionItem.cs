using HAPM.Domain.Common;

namespace HAPM.Domain.Entities;

public class PrescriptionItem : BaseEntity
{
    public int PrescriptionId { get; set; }
    public Prescription Prescription { get; set; } = null!;

    public string MedicineName { get; set; } = null!;
    public string Dosage { get; set; } = null!;          // e.g. "500 mg"
    public string Frequency { get; set; } = null!;       // e.g. "1-0-1"
    public int DurationDays { get; set; }
    public string? Instructions { get; set; }            // e.g. "After food"
}
