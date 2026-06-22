using System.Text;
using HAPM.Application.Common;
using HAPM.Application.DTOs;
using HAPM.Application.Services;
using HAPM.Application.Tests.Infrastructure;
using HAPM.Domain.Enums;

namespace HAPM.Application.Tests.Services;

public class LabReportServiceTests : ServiceTestBase
{
    private LabReportService CreateSut() =>
        new(Uow, CurrentUser, FileStorage, Notifications);

    [Fact]
    public async Task GetPagedAsync_patient_sees_own_reports_only()
    {
        var scenario = await SeedScenarioAsync();
        CurrentUser.As(UserRole.Patient, scenario.PatientUserId);
        await SeedReportAsync(scenario.PatientId, scenario.DoctorId);
        await SeedReportAsync(scenario.SecondPatientId, scenario.DoctorId);

        var sut = CreateSut();
        var result = await sut.GetPagedAsync(new LabReportQueryParams
        {
            PatientId = scenario.PatientId,
            DoctorId = scenario.DoctorId,
            ReportType = "Blood",
            Status = LabReportStatus.Uploaded,
            Search = "CBC",
            SortDescending = false,
            Page = 1,
            PageSize = 10
        });

        Assert.Single(result.Items);
    }

    [Fact]
    public async Task GetByIdAsync_returns_report_for_staff()
    {
        var scenario = await SeedScenarioAsync();
        CurrentUser.As(UserRole.Receptionist, scenario.ReceptionistUserId);
        var report = await SeedReportAsync(scenario.PatientId, scenario.DoctorId);

        var sut = CreateSut();
        var dto = await sut.GetByIdAsync(report.Id);
        Assert.Equal("CBC Panel", dto.Title);
    }

    [Fact]
    public async Task UploadAsync_saves_file_and_notifies_patient()
    {
        var scenario = await SeedScenarioAsync();
        CurrentUser.As(UserRole.Receptionist, scenario.ReceptionistUserId);
        var sut = CreateSut();

        using var stream = new MemoryStream(Encoding.UTF8.GetBytes("pdf-content"));
        var result = await sut.UploadAsync(
            new UploadLabReportRequest
            {
                PatientId = scenario.PatientId,
                DoctorId = scenario.DoctorId,
                ReportType = "Blood",
                Title = "CBC Panel"
            },
            stream,
            "report.pdf",
            "application/pdf",
            stream.Length);

        Assert.Equal("CBC Panel", result.Title);
        Assert.Contains(Notifications.Sent, n => n.Type == NotificationType.LabReportUploaded);
    }

    [Fact]
    public async Task UploadAsync_empty_file_throws_bad_request()
    {
        var scenario = await SeedScenarioAsync();
        CurrentUser.As(UserRole.Receptionist, scenario.ReceptionistUserId);
        var sut = CreateSut();

        using var stream = new MemoryStream();
        await Assert.ThrowsAsync<BadRequestException>(() => sut.UploadAsync(
            new UploadLabReportRequest { PatientId = scenario.PatientId, ReportType = "Blood", Title = "T" },
            stream, "report.pdf", "application/pdf", 0));
    }

    [Fact]
    public async Task UploadAsync_invalid_extension_throws_bad_request()
    {
        var scenario = await SeedScenarioAsync();
        CurrentUser.As(UserRole.Receptionist, scenario.ReceptionistUserId);
        var sut = CreateSut();

        using var stream = new MemoryStream(new byte[] { 1, 2, 3 });
        await Assert.ThrowsAsync<BadRequestException>(() => sut.UploadAsync(
            new UploadLabReportRequest { PatientId = scenario.PatientId, ReportType = "Blood", Title = "T" },
            stream, "report.exe", "application/octet-stream", 3));
    }

    [Fact]
    public async Task UploadAsync_invalid_appointment_throws_bad_request()
    {
        var scenario = await SeedScenarioAsync();
        CurrentUser.As(UserRole.Receptionist, scenario.ReceptionistUserId);
        var sut = CreateSut();

        using var stream = new MemoryStream(new byte[] { 1, 2, 3 });
        await Assert.ThrowsAsync<BadRequestException>(() => sut.UploadAsync(
            new UploadLabReportRequest
            {
                PatientId = scenario.PatientId,
                AppointmentId = 9999,
                ReportType = "Blood",
                Title = "T"
            },
            stream, "report.pdf", "application/pdf", 3));
    }

    [Fact]
    public async Task DownloadAsync_returns_file_stream()
    {
        var scenario = await SeedScenarioAsync();
        CurrentUser.As(UserRole.Receptionist, scenario.ReceptionistUserId);
        var report = await SeedReportAsync(scenario.PatientId, scenario.DoctorId);

        var sut = CreateSut();
        var file = await sut.DownloadAsync(report.Id);

        Assert.Equal("report.pdf", file.FileName);
        Assert.NotNull(file.Content);
    }

    [Fact]
    public async Task UpdateAsync_metadata_only_succeeds()
    {
        var scenario = await SeedScenarioAsync();
        CurrentUser.As(UserRole.Doctor, scenario.DoctorUserId);
        var report = await SeedReportAsync(scenario.PatientId, scenario.DoctorId);
        var sut = CreateSut();

        var updated = await sut.UpdateAsync(report.Id, new UpdateLabReportRequest
        {
            DoctorId = scenario.DoctorId,
            ReportType = "Imaging",
            Title = "Updated Title"
        }, null, null, null, null);

        Assert.Equal("Updated Title", updated.Title);
    }

    [Fact]
    public async Task UpdateAsync_replaces_file()
    {
        var scenario = await SeedScenarioAsync();
        CurrentUser.As(UserRole.Receptionist, scenario.ReceptionistUserId);
        var report = await SeedReportAsync(scenario.PatientId, scenario.DoctorId);
        var sut = CreateSut();

        using var stream = new MemoryStream(new byte[] { 9, 8, 7 });
        var updated = await sut.UpdateAsync(report.Id, new UpdateLabReportRequest
        {
            ReportType = "Blood",
            Title = "Replaced"
        }, stream, "new.pdf", "application/pdf", stream.Length);

        Assert.Equal("Replaced", updated.Title);
        Assert.Equal(LabReportStatus.Uploaded, updated.Status);
    }

    [Fact]
    public async Task UpdateAsync_patient_forbidden()
    {
        var scenario = await SeedScenarioAsync();
        CurrentUser.As(UserRole.Patient, scenario.PatientUserId);
        var report = await SeedReportAsync(scenario.PatientId, scenario.DoctorId);
        var sut = CreateSut();

        await Assert.ThrowsAsync<ForbiddenException>(() => sut.UpdateAsync(report.Id, new UpdateLabReportRequest
        {
            ReportType = "Blood",
            Title = "X"
        }, null, null, null, null));
    }

    [Fact]
    public async Task ReviewAsync_doctor_reviews_report()
    {
        var scenario = await SeedScenarioAsync();
        CurrentUser.As(UserRole.Doctor, scenario.DoctorUserId);
        var report = await SeedReportAsync(scenario.PatientId, scenario.DoctorId);
        var sut = CreateSut();

        var reviewed = await sut.ReviewAsync(report.Id, new ReviewLabReportRequest { Remarks = "Looks good" });
        Assert.Equal(LabReportStatus.Reviewed, reviewed.Status);
    }

    [Fact]
    public async Task ReviewAsync_non_doctor_forbidden()
    {
        var scenario = await SeedScenarioAsync();
        CurrentUser.As(UserRole.Receptionist, scenario.ReceptionistUserId);
        var report = await SeedReportAsync(scenario.PatientId, scenario.DoctorId);
        var sut = CreateSut();

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            sut.ReviewAsync(report.Id, new ReviewLabReportRequest { Remarks = "Nope" }));
    }

    [Fact]
    public async Task DeleteAsync_removes_report_and_file()
    {
        var scenario = await SeedScenarioAsync();
        var report = await SeedReportAsync(scenario.PatientId, scenario.DoctorId);
        var path = report.StoredFilePath;
        var sut = CreateSut();

        await sut.DeleteAsync(report.Id);

        Assert.Null(await Uow.LabReports.GetByIdAsync(report.Id));
        Assert.False(FileStorage.Contains(path));
    }

    private async Task<Domain.Entities.LabReport> SeedReportAsync(int patientId, int doctorId)
    {
        using var stream = new MemoryStream(new byte[] { 1, 2, 3, 4 });
        var stored = await FileStorage.SaveAsync(stream, "report.pdf", "lab-reports");

        var report = new Domain.Entities.LabReport
        {
            PatientId = patientId,
            DoctorId = doctorId,
            ReportType = "Blood",
            Title = "CBC Panel",
            FileName = "report.pdf",
            StoredFilePath = stored.RelativePath,
            ContentType = "application/pdf",
            FileSizeBytes = stored.SizeBytes,
            Status = LabReportStatus.Uploaded,
            UploadedByUserId = 1
        };
        await Uow.LabReports.AddAsync(report);
        await Uow.SaveChangesAsync();
        return report;
    }
}
