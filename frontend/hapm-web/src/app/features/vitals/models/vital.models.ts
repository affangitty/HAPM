import { PaginationParams } from '../../../core/api/api.models';

export interface RecordVitalSignRequest {
  appointmentId: number;
  temperatureCelsius?: number;
  pulseBpm?: number;
  respiratoryRatePerMin?: number;
  systolicBpMmHg?: number;
  diastolicBpMmHg?: number;
  oxygenSaturationPercent?: number;
  heightCm?: number;
  weightKg?: number;
  notes?: string;
}

export interface VitalSignQueryParams extends PaginationParams {
  patientId?: number;
  appointmentId?: number;
}

export interface VitalSignDto {
  id: number;
  appointmentId: number;
  patientId: number;
  patientName: string;
  temperatureCelsius?: number;
  pulseBpm?: number;
  respiratoryRatePerMin?: number;
  systolicBpMmHg?: number;
  diastolicBpMmHg?: number;
  oxygenSaturationPercent?: number;
  heightCm?: number;
  weightKg?: number;
  bmi?: number;
  notes?: string;
  recordedAtUtc: string;
}

export type VitalMetricKey = 'pulseBpm' | 'systolicBpMmHg' | 'oxygenSaturationPercent' | 'temperatureCelsius' | 'bmi';

export const VITAL_METRIC_LABELS: Record<VitalMetricKey, string> = {
  pulseBpm: 'Pulse (bpm)',
  systolicBpMmHg: 'Systolic BP',
  oxygenSaturationPercent: 'SpO₂ (%)',
  temperatureCelsius: 'Temperature (°C)',
  bmi: 'BMI',
};
