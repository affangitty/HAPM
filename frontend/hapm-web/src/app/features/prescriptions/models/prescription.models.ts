import { PaginationParams } from '../../../core/api/api.models';

export interface PrescriptionItemRequest {
  medicineName: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  instructions?: string;
}

export interface CreatePrescriptionRequest {
  appointmentId: number;
  diagnosis: string;
  notes?: string;
  followUpDate?: string;
  items: PrescriptionItemRequest[];
}

export interface UpdatePrescriptionRequest {
  diagnosis: string;
  notes?: string;
  followUpDate?: string;
  items: PrescriptionItemRequest[];
}

export interface PrescriptionQueryParams extends PaginationParams {
  patientId?: number;
  doctorId?: number;
  fromDate?: string;
  toDate?: string;
}

export interface PrescriptionItemDto {
  id: number;
  medicineName: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  instructions?: string;
}

export interface PrescriptionDto {
  id: number;
  appointmentId: number;
  appointmentDate: string;
  doctorId: number;
  doctorName: string;
  specialization: string;
  patientId: number;
  patientName: string;
  medicalRecordNumber: string;
  diagnosis: string;
  notes?: string;
  followUpDate?: string;
  createdAtUtc: string;
  items: PrescriptionItemDto[];
}
