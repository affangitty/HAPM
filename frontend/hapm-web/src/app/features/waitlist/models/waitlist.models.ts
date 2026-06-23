import { PaginationParams } from '../../../core/api/api.models';
import { WaitlistStatus } from '../../../shared/models/enums';

export interface JoinWaitlistRequest {
  doctorId: number;
  patientId?: number;
  preferredDate: string;
  notes?: string;
}

export interface WaitlistQueryParams extends PaginationParams {
  doctorId?: number;
  preferredDate?: string;
  status?: WaitlistStatus;
}

export interface WaitlistEntryDto {
  id: number;
  doctorId: number;
  doctorName: string;
  specialization: string;
  patientId: number;
  patientName: string;
  preferredDate: string;
  status: WaitlistStatus;
  notes?: string;
  notifiedAtUtc?: string;
  createdAtUtc: string;
}
