using System.ComponentModel.DataAnnotations;
using HAPM.Domain.Enums;

namespace HAPM.Application.DTOs;

public class PatchPatientRequest
{
    [MaxLength(150)]
    public string? FullName { get; set; }

    [Phone, MaxLength(20)]
    public string? PhoneNumber { get; set; }

    public DateOnly? DateOfBirth { get; set; }
    public Gender? Gender { get; set; }

    [MaxLength(10)]
    public string? BloodGroup { get; set; }

    [MaxLength(500)]
    public string? Address { get; set; }

    [MaxLength(150)]
    public string? EmergencyContactName { get; set; }

    [Phone, MaxLength(20)]
    public string? EmergencyContactPhone { get; set; }

    [MaxLength(1000)]
    public string? Allergies { get; set; }

    [MaxLength(1000)]
    public string? ChronicConditions { get; set; }
}

public class PatchDoctorRequest
{
    [MaxLength(150)]
    public string? FullName { get; set; }

    [Phone, MaxLength(20)]
    public string? PhoneNumber { get; set; }

    [MaxLength(100)]
    public string? Specialization { get; set; }

    [MaxLength(200)]
    public string? Qualification { get; set; }

    [Range(0, 80)]
    public int? ExperienceYears { get; set; }

    [Range(0, 1_000_000)]
    public decimal? ConsultationFee { get; set; }

    [MaxLength(20)]
    public string? RoomNumber { get; set; }

    [MaxLength(2000)]
    public string? Biography { get; set; }

    public bool? IsAvailable { get; set; }
}

public class PatchOwnDoctorProfileRequest
{
    [MaxLength(150)]
    public string? FullName { get; set; }

    [Phone, MaxLength(20)]
    public string? PhoneNumber { get; set; }

    [MaxLength(20)]
    public string? RoomNumber { get; set; }

    [MaxLength(2000)]
    public string? Biography { get; set; }
}

public class PatchInvoiceRequest
{
    [Range(0, 100)]
    public decimal? TaxPercent { get; set; }

    [Range(0, 10_000_000)]
    public decimal? DiscountAmount { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }

    [MinLength(1)]
    public List<InvoiceItemRequest>? Items { get; set; }
}

public class PatchPrescriptionRequest
{
    [MaxLength(1000)]
    public string? Diagnosis { get; set; }

    [MaxLength(2000)]
    public string? Notes { get; set; }

    public DateOnly? FollowUpDate { get; set; }

    [MinLength(1)]
    public List<PrescriptionItemRequest>? Items { get; set; }
}

public class PatchLabReportRequest
{
    public int? DoctorId { get; set; }
    public int? AppointmentId { get; set; }

    [MaxLength(100)]
    public string? ReportType { get; set; }

    [MaxLength(200)]
    public string? Title { get; set; }
}

public class PatchPrescriptionTemplateRequest
{
    [MaxLength(100)]
    public string? Name { get; set; }

    [MaxLength(1000)]
    public string? Diagnosis { get; set; }

    [MaxLength(2000)]
    public string? Notes { get; set; }

    [MinLength(1)]
    public List<PrescriptionItemRequest>? Items { get; set; }
}
