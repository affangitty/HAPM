import { PaginationParams } from '../../../core/api/api.models';
import { LabReportStatus } from '../../../shared/models/enums';

export interface LabReportDto {
  id: number;
  patientId: number;
  patientName: string;
  medicalRecordNumber: string;
  doctorId?: number;
  doctorName?: string;
  appointmentId?: number;
  reportType: string;
  title: string;
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
  status: LabReportStatus;
  reviewRemarks?: string;
  uploadedAtUtc: string;
}

export interface LabReportQueryParams extends PaginationParams {
  patientId?: number;
  doctorId?: number;
  reportType?: string;
  status?: LabReportStatus;
}

export interface UploadLabReportRequest {
  patientId: number;
  doctorId?: number;
  appointmentId?: number;
  reportType: string;
  title: string;
  file: File;
}

export interface ReviewLabReportRequest {
  remarks: string;
}

export const LAB_REPORT_ACCEPT = '.pdf,.jpg,.jpeg,.png,.dcm';
export const LAB_REPORT_MAX_BYTES = 10 * 1024 * 1024;
