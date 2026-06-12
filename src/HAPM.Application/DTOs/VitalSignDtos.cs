using System.ComponentModel.DataAnnotations;
using HAPM.Application.Common;

namespace HAPM.Application.DTOs;

public class RecordVitalSignRequest
{
    [Required]
    public int AppointmentId { get; set; }

    [Range(25, 45)]
    public decimal? TemperatureCelsius { get; set; }

    [Range(20, 300)]
    public int? PulseBpm { get; set; }

    [Range(4, 80)]
    public int? RespiratoryRatePerMin { get; set; }

    [Range(40, 300)]
    public int? SystolicBpMmHg { get; set; }

    [Range(20, 200)]
    public int? DiastolicBpMmHg { get; set; }

    [Range(40, 100)]
    public decimal? OxygenSaturationPercent { get; set; }

    [Range(20, 280)]
    public decimal? HeightCm { get; set; }

    [Range(0.5, 700)]
    public decimal? WeightKg { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }
}

public class VitalSignQueryParams : PaginationParams
{
    public int? PatientId { get; set; }
    public int? AppointmentId { get; set; }
}

public record VitalSignDto(
    int Id,
    int AppointmentId,
    int PatientId,
    string PatientName,
    decimal? TemperatureCelsius,
    int? PulseBpm,
    int? RespiratoryRatePerMin,
    int? SystolicBpMmHg,
    int? DiastolicBpMmHg,
    decimal? OxygenSaturationPercent,
    decimal? HeightCm,
    decimal? WeightKg,
    decimal? Bmi,
    string? Notes,
    DateTime RecordedAtUtc);
