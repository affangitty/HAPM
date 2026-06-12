using System.ComponentModel.DataAnnotations;
using HAPM.Application.Common;
using HAPM.Domain.Enums;

namespace HAPM.Application.DTOs;

public class UploadLabReportRequest
{
    [Required]
    public int PatientId { get; set; }

    public int? DoctorId { get; set; }

    public int? AppointmentId { get; set; }

    [Required, MaxLength(100)]
    public string ReportType { get; set; } = null!;

    [Required, MaxLength(200)]
    public string Title { get; set; } = null!;
}

public class UpdateLabReportRequest
{
    public int? DoctorId { get; set; }

    public int? AppointmentId { get; set; }

    [Required, MaxLength(100)]
    public string ReportType { get; set; } = null!;

    [Required, MaxLength(200)]
    public string Title { get; set; } = null!;
}

public class ReviewLabReportRequest
{
    [Required, MaxLength(2000)]
    public string Remarks { get; set; } = null!;
}

public class LabReportQueryParams : PaginationParams
{
    public int? PatientId { get; set; }
    public int? DoctorId { get; set; }
    public string? ReportType { get; set; }
    public LabReportStatus? Status { get; set; }
}

public record LabReportDto(
    int Id,
    int PatientId,
    string PatientName,
    string MedicalRecordNumber,
    int? DoctorId,
    string? DoctorName,
    int? AppointmentId,
    string ReportType,
    string Title,
    string FileName,
    string ContentType,
    long FileSizeBytes,
    LabReportStatus Status,
    string? ReviewRemarks,
    DateTime UploadedAtUtc);

public record LabReportFileDto(Stream Content, string FileName, string ContentType);
