import { AppointmentStatus } from '../../../shared/models/enums';
import { AppointmentDto } from '../models/appointment.models';

export interface AppointmentSelectOption {
  label: string;
  value: string;
}

export function appointmentSelectLabel(a: AppointmentDto): string {
  return `#${a.id} · ${a.patientName} · ${a.appointmentDate} ${a.startTime} (${a.doctorName})`;
}

export interface AppointmentPickerFilter {
  statuses?: AppointmentStatus[];
  patientId?: number;
  excludeWithPrescription?: boolean;
  excludeWithInvoice?: boolean;
  excludeAppointmentIds?: Set<number>;
}

export function toAppointmentSelectOptions(
  appointments: AppointmentDto[],
  filter: AppointmentPickerFilter = {},
  includeEmpty = false,
): AppointmentSelectOption[] {
  const statuses = filter.statuses ?? ['Completed', 'CheckedIn'];
  const excluded = filter.excludeAppointmentIds ?? new Set<number>();

  const eligible = appointments
    .filter((a) => statuses.includes(a.status))
    .filter((a) => filter.patientId == null || a.patientId === filter.patientId)
    .filter((a) => !filter.excludeWithPrescription || !a.hasPrescription)
    .filter((a) => !filter.excludeWithInvoice || !a.hasInvoice)
    .filter((a) => !excluded.has(a.id))
    .sort((a, b) => b.appointmentDate.localeCompare(a.appointmentDate) || b.startTime.localeCompare(a.startTime));

  const options = eligible.map((a) => ({
    label: appointmentSelectLabel(a),
    value: String(a.id),
  }));

  return includeEmpty ? [{ label: 'None', value: '' }, ...options] : options;
}
