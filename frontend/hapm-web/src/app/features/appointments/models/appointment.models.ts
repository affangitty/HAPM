import { PaginationParams } from '../../../core/api/api.models';
import { AppointmentStatus } from '../../../shared/models/enums';

export interface AppointmentDto {
  id: number;
  patientId: number;
  patientName: string;
  medicalRecordNumber: string;
  doctorId: number;
  doctorName: string;
  specialization: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  reason: string;
  notes: string | null;
  cancellationReason: string | null;
  hasPrescription: boolean;
  hasInvoice: boolean;
  createdAtUtc: string;
}

export interface AppointmentQueryParams extends PaginationParams {
  doctorId?: number;
  patientId?: number;
  status?: AppointmentStatus;
  fromDate?: string;
  toDate?: string;
}

export interface BookAppointmentRequest {
  doctorId: number;
  patientId?: number;
  appointmentDate: string;
  startTime: string;
  reason: string;
}

export interface RescheduleAppointmentRequest {
  appointmentDate: string;
  startTime: string;
}

export interface CancelAppointmentRequest {
  reason: string;
}

export interface CompleteAppointmentRequest {
  notes?: string;
}

export type AppointmentViewMode = 'list' | 'calendar';
