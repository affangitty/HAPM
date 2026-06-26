export interface RoleDashboardKpiApi {
  title: string;
  value: string;
  subtitle: string;
  trend?: string | null;
  trendValue?: string | null;
}

export interface RoleDashboardScheduleApi {
  id: number;
  time: string;
  duration: string;
  patient: string;
  type: string;
  status: string;
  highlight: boolean;
}

export interface RoleDashboardAttentionApi {
  id: number;
  title: string;
  subtitle: string;
  status: string;
  tone: string;
}

export interface RoleDashboardNotificationApi {
  id: number;
  type: string;
  title: string;
  message: string;
  createdAtUtc: string;
  isRead: boolean;
}

export interface RoleDashboardAppointmentApi {
  id: number;
  patient: string;
  doctor: string;
  date: string;
  time: string;
  type: string;
  status: string;
}

export interface RoleDashboardPrescriptionApi {
  id: number;
  patient: string;
  date: string;
  status: string;
  medications: { name: string; dose: string; freq: string }[];
}

export interface RoleDashboardVitalApi {
  label: string;
  value: string;
  unit: string;
  status: string;
}

export interface RoleDashboardQueueApi {
  id: number;
  name: string;
  time: string;
  doctor: string;
  status: string;
  waitTime: string;
}

export interface RoleDashboardRoomApi {
  id: string;
  name: string;
  occupied: boolean;
  detail?: string | null;
}

export interface RoleDashboardBillingMetricApi {
  label: string;
  value: string;
  subtitle: string;
  tone?: string | null;
}

export interface DoctorRoleDashboardApi {
  kpis: RoleDashboardKpiApi[];
  schedule: RoleDashboardScheduleApi[];
  attentionItems: RoleDashboardAttentionApi[];
  notifications: RoleDashboardNotificationApi[];
}

export interface PatientRoleDashboardApi {
  kpis: RoleDashboardKpiApi[];
  upcomingAppointments: RoleDashboardAppointmentApi[];
  prescriptions: RoleDashboardPrescriptionApi[];
  balanceDue: number;
  balanceDueDate: string | null;
  primaryUnpaidInvoiceId: number | null;
  vitals: RoleDashboardVitalApi[];
  notifications: RoleDashboardNotificationApi[];
}

export interface ReceptionistRoleDashboardApi {
  kpis: RoleDashboardKpiApi[];
  queue: RoleDashboardQueueApi[];
  rooms: RoleDashboardRoomApi[];
  billingMetrics: RoleDashboardBillingMetricApi[];
  notifications: RoleDashboardNotificationApi[];
}
