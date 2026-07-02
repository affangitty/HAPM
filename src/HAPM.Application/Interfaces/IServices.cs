using HAPM.Application.Common;
using HAPM.Application.DTOs;
using HAPM.Domain.Enums;

namespace HAPM.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResponse> RegisterPatientAsync(RegisterPatientRequest request, CancellationToken ct = default);
    Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken ct = default);
    Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request, CancellationToken ct = default);
    Task LogoutAsync(RefreshTokenRequest request, CancellationToken ct = default);
    Task ChangePasswordAsync(ChangePasswordRequest request, CancellationToken ct = default);
    Task<ForgotPasswordResponse> ForgotPasswordAsync(ForgotPasswordRequest request, bool includeDevToken, CancellationToken ct = default);
    Task ResetPasswordAsync(CompletePasswordResetRequest request, CancellationToken ct = default);
    Task<UserDto> GetCurrentUserAsync(CancellationToken ct = default);
}

public interface IUserService
{
    Task<PagedResult<UserDto>> GetPagedAsync(UserQueryParams query, CancellationToken ct = default);
    Task<UserDto> CreateReceptionistAsync(CreateReceptionistRequest request, CancellationToken ct = default);
    Task SetActiveAsync(int userId, bool isActive, CancellationToken ct = default);
    Task ResetPasswordAsync(int userId, ResetPasswordRequest request, CancellationToken ct = default);
}

public interface IDoctorService
{
    Task<PagedResult<DoctorDto>> GetPagedAsync(DoctorQueryParams query, CancellationToken ct = default);
    Task<DoctorDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<DoctorDto> GetCurrentAsync(CancellationToken ct = default);
    Task<DoctorDto> CreateAsync(CreateDoctorRequest request, CancellationToken ct = default);
    Task<DoctorDto> PatchAsync(int id, PatchDoctorRequest request, CancellationToken ct = default);
    Task<DoctorDto> PatchOwnProfileAsync(int id, PatchOwnDoctorProfileRequest request, CancellationToken ct = default);
    Task DeactivateAsync(int id, CancellationToken ct = default);
    Task<IReadOnlyList<DoctorScheduleDto>> SetSchedulesAsync(int doctorId, List<ScheduleSlotRequest> slots, CancellationToken ct = default);
    Task<IReadOnlyList<DoctorScheduleDto>> GetSchedulesAsync(int doctorId, CancellationToken ct = default);
    Task<IReadOnlyList<AvailableSlotDto>> GetAvailableSlotsAsync(int doctorId, DateOnly date, CancellationToken ct = default);
    Task<IReadOnlyList<string>> GetSpecializationsAsync(CancellationToken ct = default);
    Task<DoctorPerformanceDto> GetPerformanceAsync(int id, CancellationToken ct = default);
}

public interface IPatientService
{
    Task<PagedResult<PatientDto>> GetPagedAsync(PatientQueryParams query, CancellationToken ct = default);
    Task<PatientDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<PatientDto> GetMyProfileAsync(CancellationToken ct = default);
    Task<PatientDto> CreateAsync(CreatePatientRequest request, CancellationToken ct = default);
    Task<PatientDto> PatchAsync(int id, PatchPatientRequest request, CancellationToken ct = default);
    Task DeactivateAsync(int id, CancellationToken ct = default);
    Task<PatientMedicalHistoryDto> GetMedicalHistoryAsync(int id, CancellationToken ct = default);
}

public interface IAppointmentService
{
    Task<PagedResult<AppointmentDto>> GetPagedAsync(AppointmentQueryParams query, CancellationToken ct = default);
    Task<AppointmentDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<AppointmentDto> BookAsync(BookAppointmentRequest request, CancellationToken ct = default);
    Task<AppointmentDto> ConfirmAsync(int id, CancellationToken ct = default);
    Task<AppointmentDto> CheckInAsync(int id, CancellationToken ct = default);
    Task<AppointmentDto> CompleteAsync(int id, CompleteAppointmentRequest request, CancellationToken ct = default);
    Task<AppointmentDto> CancelAsync(int id, CancelAppointmentRequest request, CancellationToken ct = default);
    Task<AppointmentDto> MarkNoShowAsync(int id, CancellationToken ct = default);
    Task<AppointmentDto> RescheduleAsync(int id, RescheduleAppointmentRequest request, CancellationToken ct = default);
}

public interface IPrescriptionService
{
    Task<PagedResult<PrescriptionDto>> GetPagedAsync(PrescriptionQueryParams query, CancellationToken ct = default);
    Task<PrescriptionDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<PrescriptionDto> GetByAppointmentAsync(int appointmentId, CancellationToken ct = default);
    Task<PrescriptionDto> CreateAsync(CreatePrescriptionRequest request, CancellationToken ct = default);
    Task<PrescriptionDto> PatchAsync(int id, PatchPrescriptionRequest request, CancellationToken ct = default);
}

public interface ILabReportService
{
    Task<PagedResult<LabReportDto>> GetPagedAsync(LabReportQueryParams query, CancellationToken ct = default);
    Task<LabReportDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<LabReportDto> UploadAsync(UploadLabReportRequest request, Stream content, string fileName, string contentType, long sizeBytes, CancellationToken ct = default);
    Task<LabReportFileDto> DownloadAsync(int id, CancellationToken ct = default);
    Task<LabReportDto> ReviewAsync(int id, ReviewLabReportRequest request, CancellationToken ct = default);
    Task<LabReportDto> PatchAsync(int id, PatchLabReportRequest request, Stream? content, string? fileName, string? contentType, long? sizeBytes, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
}

public interface IBillingService
{
    Task<PagedResult<InvoiceDto>> GetPagedAsync(InvoiceQueryParams query, CancellationToken ct = default);
    Task<InvoiceDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<InvoiceDto> CreateAsync(CreateInvoiceRequest request, CancellationToken ct = default);
    Task<InvoiceDto> PatchAsync(int id, PatchInvoiceRequest request, CancellationToken ct = default);
    Task<InvoiceDto> AddPaymentAsync(int id, AddPaymentRequest request, CancellationToken ct = default);
    Task<IReadOnlyList<PaymentDto>> GetPaymentsAsync(int id, CancellationToken ct = default);
    Task<InvoiceDto> CancelAsync(int id, CancellationToken ct = default);
}

public interface INotificationService
{
    Task NotifyAsync(int userId, NotificationType type, string title, string message, CancellationToken ct = default);
    Task<PagedResult<NotificationDto>> GetMyNotificationsAsync(PaginationParams query, bool unreadOnly, CancellationToken ct = default);
    Task<NotificationDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<int> GetUnreadCountAsync(CancellationToken ct = default);
    Task MarkAsReadAsync(int id, CancellationToken ct = default);
    Task MarkAllAsReadAsync(CancellationToken ct = default);
}

public interface IDashboardService
{
    Task<DashboardStatsDto> GetStatsAsync(CancellationToken ct = default);
    Task<IReadOnlyList<PeakHourCellDto>> GetPeakHoursAsync(DateOnly? fromDate, DateOnly? toDate, CancellationToken ct = default);
    Task<IReadOnlyList<SpecializationRevenueDto>> GetRevenueBySpecializationAsync(CancellationToken ct = default);
    Task<DoctorRoleDashboardDto> GetDoctorDashboardAsync(CancellationToken ct = default);
    Task<PatientRoleDashboardDto> GetPatientDashboardAsync(CancellationToken ct = default);
    Task<ReceptionistRoleDashboardDto> GetReceptionistDashboardAsync(CancellationToken ct = default);
}

public interface IVitalSignService
{
    Task<PagedResult<VitalSignDto>> GetPagedAsync(VitalSignQueryParams query, CancellationToken ct = default);
    Task<VitalSignDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<VitalSignDto> RecordAsync(RecordVitalSignRequest request, CancellationToken ct = default);
}

public interface IDoctorLeaveService
{
    Task<IReadOnlyList<DoctorLeaveDto>> GetForDoctorAsync(int doctorId, CancellationToken ct = default);
    Task<DoctorLeaveDto> CreateAsync(int doctorId, CreateDoctorLeaveRequest request, CancellationToken ct = default);
    Task DeleteAsync(int doctorId, int leaveId, CancellationToken ct = default);
}

public interface IReviewService
{
    Task<PagedResult<ReviewDto>> GetPagedAsync(ReviewQueryParams query, CancellationToken ct = default);
    Task<ReviewDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<ReviewDto> CreateAsync(CreateReviewRequest request, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
}

public interface IWaitlistService
{
    Task<PagedResult<WaitlistEntryDto>> GetPagedAsync(WaitlistQueryParams query, CancellationToken ct = default);
    Task<WaitlistEntryDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<WaitlistEntryDto> JoinAsync(JoinWaitlistRequest request, CancellationToken ct = default);
    Task CancelAsync(int id, CancellationToken ct = default);
}

public interface IPrescriptionTemplateService
{
    Task<IReadOnlyList<PrescriptionTemplateDto>> GetMineAsync(CancellationToken ct = default);
    Task<PrescriptionTemplateDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<PrescriptionTemplateDto> CreateAsync(SavePrescriptionTemplateRequest request, CancellationToken ct = default);
    Task<PrescriptionTemplateDto> PatchAsync(int id, PatchPrescriptionTemplateRequest request, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
}

public interface IAuditLogService
{
    Task<PagedResult<AuditLogDto>> GetPagedAsync(AuditLogQueryParams query, CancellationToken ct = default);
    Task<AuditLogDto> GetByIdAsync(int id, CancellationToken ct = default);
}
public record CsvExport(byte[] Content, string FileName);

public interface IExportService
{
    Task<CsvExport> ExportAppointmentsAsync(DateOnly? fromDate, DateOnly? toDate, CancellationToken ct = default);
    Task<CsvExport> ExportPatientsAsync(CancellationToken ct = default);
    Task<CsvExport> ExportInvoicesAsync(DateOnly? fromDate, DateOnly? toDate, CancellationToken ct = default);
}

public interface IStaffMessageService
{
    Task<PagedResult<StaffMessageDto>> GetPagedAsync(StaffMessageQueryParams query, CancellationToken ct = default);
    Task<StaffMessageDto> SendToDoctorAsync(SendDoctorMessageRequest request, CancellationToken ct = default);
    Task<StaffMessageDto> BroadcastToStaffAsync(BroadcastStaffMessageRequest request, CancellationToken ct = default);
}
