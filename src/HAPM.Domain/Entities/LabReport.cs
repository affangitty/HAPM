using HAPM.Domain.Common;
using HAPM.Domain.Enums;

namespace HAPM.Domain.Entities;

public class LabReport : BaseEntity
{
    public int PatientId { get; set; }
    public Patient Patient { get; set; } = null!;

    public int? DoctorId { get; set; }
    public Doctor? Doctor { get; set; }

    public int? AppointmentId { get; set; }
    public Appointment? Appointment { get; set; }

    public string ReportType { get; set; } = null!;      // e.g. "Blood Test", "X-Ray"
    public string Title { get; set; } = null!;
    public string FileName { get; set; } = null!;        // original file name
    public string StoredFilePath { get; set; } = null!;  // relative path on disk
    public string ContentType { get; set; } = null!;
    public long FileSizeBytes { get; set; }

    public LabReportStatus Status { get; set; } = LabReportStatus.Uploaded;
    public string? ReviewRemarks { get; set; }
    public int UploadedByUserId { get; set; }
}
