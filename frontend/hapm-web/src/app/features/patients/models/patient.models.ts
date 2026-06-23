import { PaginationParams } from '../../../core/api/api.models';

export type Gender = 'Male' | 'Female' | 'Other';

export interface PatientDto {
  id: number;
  userId: number;
  medicalRecordNumber: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  dateOfBirth: string;
  age: number;
  gender: Gender;
  bloodGroup: string | null;
  address: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  allergies: string | null;
  chronicConditions: string | null;
  isActive: boolean;
  registeredAtUtc: string;
}

export interface PatientQueryParams extends PaginationParams {
  gender?: Gender;
  bloodGroup?: string;
}

export interface CreatePatientRequest {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: Gender;
  bloodGroup?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  allergies?: string;
  chronicConditions?: string;
}

export interface UpdatePatientRequest {
  fullName: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: Gender;
  bloodGroup?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  allergies?: string;
  chronicConditions?: string;
}

export interface AppointmentSummaryDto {
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
  status: string;
  reason: string;
  notes: string | null;
  cancellationReason: string | null;
  hasPrescription: boolean;
  hasInvoice: boolean;
  createdAtUtc: string;
}

export interface PrescriptionSummaryDto {
  id: number;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  issuedAtUtc: string;
  status: string;
}

export interface LabReportSummaryDto {
  id: number;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  testName: string;
  status: string;
  resultSummary: string | null;
  createdAtUtc: string;
}

export interface PatientMedicalHistoryDto {
  patient: PatientDto;
  appointments: AppointmentSummaryDto[];
  prescriptions: PrescriptionSummaryDto[];
  labReports: LabReportSummaryDto[];
}

export type PatientDetailTab =
  | 'profile'
  | 'medical-history'
  | 'emergency'
  | 'allergies'
  | 'conditions';
