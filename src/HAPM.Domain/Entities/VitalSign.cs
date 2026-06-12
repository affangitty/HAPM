using HAPM.Domain.Common;

namespace HAPM.Domain.Entities;

/// <summary>A set of vital sign readings captured during a visit.</summary>
public class VitalSign : BaseEntity
{
    public int AppointmentId { get; set; }
    public Appointment Appointment { get; set; } = null!;

    public int PatientId { get; set; }
    public Patient Patient { get; set; } = null!;

    public int RecordedByUserId { get; set; }

    public decimal? TemperatureCelsius { get; set; }
    public int? PulseBpm { get; set; }
    public int? RespiratoryRatePerMin { get; set; }
    public int? SystolicBpMmHg { get; set; }
    public int? DiastolicBpMmHg { get; set; }
    public decimal? OxygenSaturationPercent { get; set; }
    public decimal? HeightCm { get; set; }
    public decimal? WeightKg { get; set; }
    public string? Notes { get; set; }
}
