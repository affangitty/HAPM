using HAPM.Application.Common;
using HAPM.Application.DTOs;
using HAPM.Application.Interfaces;
using HAPM.Application.Mapping;
using HAPM.Domain.Entities;
using HAPM.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace HAPM.Application.Services;

public class LabReportService : ILabReportService
{
    private const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10 MB
    private static readonly string[] AllowedExtensions = { ".pdf", ".jpg", ".jpeg", ".png", ".dcm" };

    private readonly IUnitOfWork _uow;
    private readonly ICurrentUserService _currentUser;
    private readonly IFileStorageService _fileStorage;
    private readonly INotificationService _notifications;

    public LabReportService(IUnitOfWork uow, ICurrentUserService currentUser, IFileStorageService fileStorage, INotificationService notifications)
    {
        _uow = uow;
        _currentUser = currentUser;
        _fileStorage = fileStorage;
        _notifications = notifications;
    }

    public async Task<PagedResult<LabReportDto>> GetPagedAsync(LabReportQueryParams query, CancellationToken ct = default)
    {
        var reports = await ScopeToCurrentUserAsync(_uow.LabReports.Query(), ct);

        if (query.PatientId.HasValue)
            reports = reports.Where(r => r.PatientId == query.PatientId.Value);

        if (query.DoctorId.HasValue)
            reports = reports.Where(r => r.DoctorId == query.DoctorId.Value);

        if (!string.IsNullOrWhiteSpace(query.ReportType))
            reports = reports.Where(r => r.ReportType.ToLower() == query.ReportType.Trim().ToLower());

        if (query.Status.HasValue)
            reports = reports.Where(r => r.Status == query.Status.Value);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim().ToLower();
            reports = reports.Where(r =>
                r.Title.ToLower().Contains(term) ||
                r.ReportType.ToLower().Contains(term) ||
                r.Patient.User.FullName.ToLower().Contains(term) ||
                r.Patient.MedicalRecordNumber.ToLower().Contains(term));
        }

        reports = query.SortDescending
            ? reports.OrderByDescending(r => r.CreatedAtUtc)
            : reports.OrderBy(r => r.CreatedAtUtc);

        return await reports.Select(Projections.LabReport).ToPagedResultAsync(query.Page, query.PageSize, ct);
    }

    public async Task<LabReportDto> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var scoped = await ScopeToCurrentUserAsync(_uow.LabReports.Query(), ct);
        return await scoped
            .Where(r => r.Id == id)
            .Select(Projections.LabReport)
            .FirstOrDefaultAsync(ct) ?? throw new NotFoundException("Lab report", id);
    }

    public async Task<LabReportDto> UploadAsync(UploadLabReportRequest request, Stream content, string fileName, string contentType, long sizeBytes, CancellationToken ct = default)
    {
        if (sizeBytes <= 0)
            throw new BadRequestException("The uploaded file is empty.");

        if (sizeBytes > MaxFileSizeBytes)
            throw new BadRequestException($"File exceeds the maximum allowed size of {MaxFileSizeBytes / (1024 * 1024)} MB.");

        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension))
            throw new BadRequestException($"File type '{extension}' is not allowed. Allowed types: {string.Join(", ", AllowedExtensions)}.");

        var patient = await _uow.Patients.Query()
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.Id == request.PatientId, ct)
            ?? throw new NotFoundException("Patient", request.PatientId);

        if (request.DoctorId.HasValue && !await _uow.Doctors.Query().AnyAsync(d => d.Id == request.DoctorId.Value, ct))
            throw new NotFoundException("Doctor", request.DoctorId.Value);

        if (request.AppointmentId.HasValue && !await _uow.Appointments.Query()
                .AnyAsync(a => a.Id == request.AppointmentId.Value && a.PatientId == request.PatientId, ct))
            throw new BadRequestException("The appointment does not exist or does not belong to this patient.");

        var stored = await _fileStorage.SaveAsync(content, fileName, "lab-reports", ct);

        var report = new LabReport
        {
            PatientId = request.PatientId,
            DoctorId = request.DoctorId,
            AppointmentId = request.AppointmentId,
            ReportType = request.ReportType.Trim(),
            Title = request.Title.Trim(),
            FileName = fileName,
            StoredFilePath = stored.RelativePath,
            ContentType = contentType,
            FileSizeBytes = stored.SizeBytes,
            UploadedByUserId = _currentUser.UserId ?? 0
        };

        await _uow.LabReports.AddAsync(report, ct);
        await _uow.SaveChangesAsync(ct);

        await _notifications.NotifyAsync(patient.UserId, NotificationType.LabReportUploaded,
            "Lab report uploaded", $"A new lab report '{report.Title}' ({report.ReportType}) is available in your records.", ct);

        return await _uow.LabReports.Query()
            .Where(r => r.Id == report.Id)
            .Select(Projections.LabReport)
            .FirstAsync(ct);
    }

    public async Task<LabReportFileDto> DownloadAsync(int id, CancellationToken ct = default)
    {
        var scoped = await ScopeToCurrentUserAsync(_uow.LabReports.Query(), ct);
        var report = await scoped.FirstOrDefaultAsync(r => r.Id == id, ct)
            ?? throw new NotFoundException("Lab report", id);

        var stream = _fileStorage.OpenRead(report.StoredFilePath);
        return new LabReportFileDto(stream, report.FileName, report.ContentType);
    }

    public async Task<LabReportDto> PatchAsync(int id, PatchLabReportRequest request, Stream? content, string? fileName, string? contentType, long? sizeBytes, CancellationToken ct = default)
    {
        var hasMetadata = request.DoctorId.HasValue || request.AppointmentId.HasValue ||
                          request.ReportType is not null || request.Title is not null;
        if (!hasMetadata && content is null)
            PatchValidation.EnsureAnyFieldSet(request);

        if (_currentUser.Role is not (UserRole.Admin or UserRole.Receptionist or UserRole.Doctor))
            throw new ForbiddenException("Only clinical staff can update lab reports.");

        var report = await _uow.LabReports.QueryTracked()
            .FirstOrDefaultAsync(r => r.Id == id, ct) ?? throw new NotFoundException("Lab report", id);

        if (request.DoctorId.HasValue)
        {
            if (!await _uow.Doctors.Query().AnyAsync(d => d.Id == request.DoctorId.Value, ct))
                throw new NotFoundException("Doctor", request.DoctorId.Value);
            report.DoctorId = request.DoctorId;
        }

        if (request.AppointmentId.HasValue)
        {
            if (!await _uow.Appointments.Query()
                    .AnyAsync(a => a.Id == request.AppointmentId.Value && a.PatientId == report.PatientId, ct))
                throw new BadRequestException("The appointment does not exist or does not belong to this patient.");
            report.AppointmentId = request.AppointmentId;
        }

        if (request.ReportType is not null) report.ReportType = request.ReportType.Trim();
        if (request.Title is not null) report.Title = request.Title.Trim();

        if (content is not null)
        {
            if (string.IsNullOrWhiteSpace(fileName) || string.IsNullOrWhiteSpace(contentType) || !sizeBytes.HasValue)
                throw new BadRequestException("fileName, contentType and a non-empty file are required when replacing the report file.");

            if (sizeBytes.Value <= 0)
                throw new BadRequestException("The uploaded file is empty.");

            if (sizeBytes.Value > MaxFileSizeBytes)
                throw new BadRequestException($"File exceeds the maximum allowed size of {MaxFileSizeBytes / (1024 * 1024)} MB.");

            var extension = Path.GetExtension(fileName).ToLowerInvariant();
            if (!AllowedExtensions.Contains(extension))
                throw new BadRequestException($"File type '{extension}' is not allowed. Allowed types: {string.Join(", ", AllowedExtensions)}.");

            _fileStorage.Delete(report.StoredFilePath);
            var stored = await _fileStorage.SaveAsync(content, fileName, "lab-reports", ct);

            report.FileName = fileName;
            report.StoredFilePath = stored.RelativePath;
            report.ContentType = contentType;
            report.FileSizeBytes = stored.SizeBytes;
            report.Status = LabReportStatus.Uploaded;
            report.ReviewRemarks = null;
        }

        await _uow.SaveChangesAsync(ct);

        return await _uow.LabReports.Query()
            .Where(r => r.Id == id)
            .Select(Projections.LabReport)
            .FirstAsync(ct);
    }

    public async Task<LabReportDto> ReviewAsync(int id, ReviewLabReportRequest request, CancellationToken ct = default)
    {
        if (_currentUser.Role != UserRole.Doctor)
            throw new ForbiddenException("Only doctors can review lab reports.");

        var doctorId = await _uow.Doctors.Query()
            .Where(d => d.UserId == _currentUser.UserId)
            .Select(d => (int?)d.Id)
            .FirstOrDefaultAsync(ct) ?? throw new ForbiddenException("No doctor profile exists for the current user.");

        var report = await _uow.LabReports.QueryTracked()
            .FirstOrDefaultAsync(r => r.Id == id, ct) ?? throw new NotFoundException("Lab report", id);

        var canReview = report.DoctorId == doctorId;
        if (!canReview && report.AppointmentId is int appointmentId)
        {
            canReview = await _uow.Appointments.Query()
                .AnyAsync(a => a.Id == appointmentId && a.DoctorId == doctorId, ct);
        }

        if (!canReview)
            throw new ForbiddenException("You can only review lab reports assigned to you.");

        report.Status = LabReportStatus.Reviewed;
        report.ReviewRemarks = request.Remarks.Trim();
        await _uow.SaveChangesAsync(ct);

        return await _uow.LabReports.Query()
            .Where(r => r.Id == id)
            .Select(Projections.LabReport)
            .FirstAsync(ct);
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var report = await _uow.LabReports.GetByIdAsync(id, ct) ?? throw new NotFoundException("Lab report", id);

        _fileStorage.Delete(report.StoredFilePath);
        _uow.LabReports.Remove(report);
        await _uow.SaveChangesAsync(ct);
    }

    private async Task<IQueryable<LabReport>> ScopeToCurrentUserAsync(IQueryable<LabReport> query, CancellationToken ct)
    {
        switch (_currentUser.Role)
        {
            case UserRole.Patient:
            {
                var patientId = await _uow.Patients.Query()
                    .Where(p => p.UserId == _currentUser.UserId)
                    .Select(p => (int?)p.Id)
                    .FirstOrDefaultAsync(ct);
                return query.Where(r => r.PatientId == (patientId ?? -1));
            }
            case UserRole.Doctor:
            {
                var doctorId = await _uow.Doctors.Query()
                    .Where(d => d.UserId == _currentUser.UserId)
                    .Select(d => (int?)d.Id)
                    .FirstOrDefaultAsync(ct);
                if (doctorId is null)
                    return query.Where(_ => false);

                return query.Where(r =>
                    r.DoctorId == doctorId ||
                    (r.AppointmentId != null &&
                     _uow.Appointments.Query().Any(a => a.Id == r.AppointmentId && a.DoctorId == doctorId)));
            }
            default:
                return query;
        }
    }
}
