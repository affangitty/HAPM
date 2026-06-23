import { PaginationParams } from '../../../core/api/api.models';

export interface CreateReviewRequest {
  appointmentId: number;
  rating: number;
  comment?: string;
}

export interface ReviewQueryParams extends PaginationParams {
  doctorId?: number;
  minRating?: number;
}

export interface ReviewDto {
  id: number;
  doctorId: number;
  doctorName: string;
  patientId: number;
  patientName: string;
  appointmentId: number;
  rating: number;
  comment?: string;
  createdAtUtc: string;
}
