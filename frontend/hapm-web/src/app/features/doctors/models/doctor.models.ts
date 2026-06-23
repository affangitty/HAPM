import { PaginationParams } from '../../../core/api/api.models';

export type DayOfWeek =
  | 'Sunday'
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday';

export interface DoctorScheduleDto {
  id: number;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
}

export interface DoctorDto {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  specialization: string;
  qualification: string;
  licenseNumber: string;
  experienceYears: number;
  consultationFee: number;
  roomNumber: string | null;
  biography: string | null;
  isAvailable: boolean;
  isActive: boolean;
  averageRating: number;
  reviewCount: number;
  schedules: DoctorScheduleDto[];
}

export interface AvailableSlotDto {
  startTime: string;
  endTime: string;
}

export interface DoctorLeaveDto {
  id: number;
  doctorId: number;
  doctorName: string;
  startDate: string;
  endDate: string;
  reason: string;
  createdAtUtc: string;
}

export interface ReviewDto {
  id: number;
  doctorId: number;
  doctorName: string;
  patientId: number;
  patientName: string;
  appointmentId: number;
  rating: number;
  comment: string | null;
  createdAtUtc: string;
}

export interface DoctorPerformanceDto {
  doctorId: number;
  doctorName: string;
  specialization: string;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  noShowRatePercent: number;
  averageRating: number;
  reviewCount: number;
  prescriptionCount: number;
  distinctPatients: number;
  totalRevenue: number;
}

export interface DoctorQueryParams extends PaginationParams {
  specialization?: string;
  isAvailable?: boolean;
}

export interface ReviewQueryParams extends PaginationParams {
  doctorId?: number;
  minRating?: number;
}

export interface CreateDoctorRequest {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  specialization: string;
  qualification: string;
  licenseNumber: string;
  experienceYears: number;
  consultationFee: number;
  roomNumber?: string;
  biography?: string;
}

export interface UpdateDoctorRequest {
  fullName: string;
  phoneNumber: string;
  specialization: string;
  qualification: string;
  experienceYears: number;
  consultationFee: number;
  roomNumber?: string;
  biography?: string;
  isAvailable: boolean;
}

export interface UpdateOwnDoctorProfileRequest {
  fullName: string;
  phoneNumber: string;
  roomNumber?: string;
  biography?: string;
}

export interface ScheduleSlotRequest {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
}

export interface CreateDoctorLeaveRequest {
  startDate: string;
  endDate: string;
  reason: string;
}

export type DoctorDetailTab = 'overview' | 'schedule' | 'availability' | 'reviews';
