/**
 * Central API type barrel — mirrors ASP.NET Core DTOs.
 * Feature-specific models live under features; re-exported here for convenience.
 */

export type { PagedResult, PaginationParams, ProblemDetails } from '../api.models';
export type { UserDto, UserRole, AuthResponse, LoginRequest, RegisterRequest, ChangePasswordRequest } from '../../auth/auth.models';

export type { AppointmentDto, AppointmentQueryParams } from '../../../features/appointments/models/appointment.models';
export type { PatientDto, PatientQueryParams } from '../../../features/patients/models/patient.models';
export type { DoctorDto, DoctorQueryParams, DoctorPerformanceDto } from '../../../features/doctors/models/doctor.models';
export type { PrescriptionDto, PrescriptionQueryParams } from '../../../features/prescriptions/models/prescription.models';
export type { PrescriptionTemplateDto } from '../../../features/prescription-templates/models/prescription-template.models';
export type { LabReportDto, LabReportQueryParams } from '../../../features/lab-reports/models/lab-report.models';
export type { InvoiceDto, InvoiceQueryParams } from '../../../features/billing/models/billing.models';
export type { NotificationDto } from '../../../features/notifications/models/notification.models';
export type { VitalSignDto, VitalSignQueryParams } from '../../../features/vitals/models/vital.models';
export type { ReviewDto, ReviewQueryParams } from '../../../features/reviews/models/review.models';
export type { WaitlistEntryDto, WaitlistQueryParams } from '../../../features/waitlist/models/waitlist.models';
export type { StaffMessageDto, StaffMessageQueryParams } from '../../../features/staff-messages/models/staff-message.models';
export type { AuditLogDto, AuditLogQueryParams } from '../../../features/audit-logs/models/audit-log.models';

export interface DashboardStatsDto {
  totalDoctors: number;
  totalPatients: number;
  totalAppointments: number;
  appointmentsToday: number;
  upcomingAppointments: number;
  pendingInvoices: number;
  totalRevenue: number;
  revenueThisMonth: number;
  appointmentsByStatus: { status: string; count: number }[];
  topSpecializations: { specialization: string; doctorCount: number; appointmentCount: number }[];
}

export interface PeakHourCellDto {
  dayOfWeek: string;
  hour: number;
  appointmentCount: number;
}

export interface SpecializationRevenueDto {
  specialization: string;
  paymentCount: number;
  totalRevenue: number;
}
