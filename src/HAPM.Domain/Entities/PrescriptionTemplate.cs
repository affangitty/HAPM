using HAPM.Domain.Common;

namespace HAPM.Domain.Entities;

/// <summary>
/// A doctor's reusable diagnosis + medicines preset (e.g. "Viral Fever Protocol").
/// Applying a template is optional - it only prefills a normal prescription.
/// </summary>
public class PrescriptionTemplate : BaseEntity
{
    public int DoctorId { get; set; }
    public Doctor Doctor { get; set; } = null!;

    public string Name { get; set; } = null!;
    public string Diagnosis { get; set; } = null!;
    public string? Notes { get; set; }

    public ICollection<PrescriptionTemplateItem> Items { get; set; } = new List<PrescriptionTemplateItem>();
}

public class PrescriptionTemplateItem : BaseEntity
{
    public int PrescriptionTemplateId { get; set; }
    public PrescriptionTemplate Template { get; set; } = null!;

    public string MedicineName { get; set; } = null!;
    public string Dosage { get; set; } = null!;
    public string Frequency { get; set; } = null!;
    public int DurationDays { get; set; }
    public string? Instructions { get; set; }
}
