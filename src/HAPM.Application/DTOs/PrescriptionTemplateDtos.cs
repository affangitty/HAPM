using System.ComponentModel.DataAnnotations;

namespace HAPM.Application.DTOs;

public class SavePrescriptionTemplateRequest
{
    [Required, MaxLength(100)]
    public string Name { get; set; } = null!;

    [Required, MaxLength(1000)]
    public string Diagnosis { get; set; } = null!;

    [MaxLength(2000)]
    public string? Notes { get; set; }

    [Required, MinLength(1)]
    public List<PrescriptionItemRequest> Items { get; set; } = new();
}

public record PrescriptionTemplateItemDto(
    int Id, string MedicineName, string Dosage, string Frequency, int DurationDays, string? Instructions);

public record PrescriptionTemplateDto(
    int Id,
    string Name,
    string Diagnosis,
    string? Notes,
    DateTime CreatedAtUtc,
    DateTime? UpdatedAtUtc,
    IReadOnlyList<PrescriptionTemplateItemDto> Items);
