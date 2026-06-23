import { PrescriptionItemRequest } from '../../prescriptions/models/prescription.models';

export interface SavePrescriptionTemplateRequest {
  name: string;
  diagnosis: string;
  notes?: string;
  items: PrescriptionItemRequest[];
}

export interface PrescriptionTemplateItemDto {
  id: number;
  medicineName: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  instructions?: string;
}

export interface PrescriptionTemplateDto {
  id: number;
  name: string;
  diagnosis: string;
  notes?: string;
  createdAtUtc: string;
  updatedAtUtc?: string;
  items: PrescriptionTemplateItemDto[];
}
