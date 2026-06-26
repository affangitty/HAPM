export interface DashboardKpi {
  title: string;
  value: string;
  subtitle: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  iconBg?: string;
  iconColor?: string;
  iconPath: string;
}

export interface DashboardNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  priority: 'normal' | 'high' | 'critical';
}

export interface DashboardAppointmentItem {
  id: string;
  patient: string;
  doctor: string;
  date: string;
  time: string;
  type: string;
  status: string;
  duration?: string;
}

export interface DashboardActivityItem {
  id: number;
  user: string;
  action: string;
  resource: string;
  time: string;
  category: 'access' | 'create' | 'write' | 'export';
}

export interface DashboardScheduleItem {
  id: string;
  time: string;
  duration: string;
  patient: string;
  type: string;
  status: string;
  highlight?: boolean;
}

export interface DashboardQuickAction {
  label: string;
  route: string;
  iconPath: string;
}

export interface DashboardVitalItem {
  label: string;
  value: string;
  unit: string;
  status: string;
  statusColor: string;
}

export interface DashboardQueueItem {
  id: number;
  name: string;
  time: string;
  doctor: string;
  status: string;
  waitTime: string;
}

export interface DashboardDoctorAvailability {
  id: string;
  name: string;
  specialty: string;
  status: 'available' | 'on-leave' | 'busy';
}

export interface DashboardPrescriptionItem {
  id: string;
  patient: string;
  date: string;
  status: string;
  medications: { name: string; dose: string; freq: string }[];
}

export interface AdminDashboardData {
  greeting: string;
  subtitle: string;
  kpis: DashboardKpi[];
  departmentPerformance: { label: string; count: number }[];
  systemHealth: { label: string; value: string; tone?: 'success' | 'danger' | 'default'; progress?: number }[];
  appointmentTrend: { label: string; appointments: number; completed: number }[];
  appointmentStatus: { label: string; value: number; color: string }[];
  revenue: { label: string; revenue: number }[];
  recentAppointments: DashboardAppointmentItem[];
  activity: DashboardActivityItem[];
  notifications: DashboardNotification[];
}

export interface DoctorDashboardData {
  greeting: string;
  subtitle: string;
  kpis: DashboardKpi[];
  schedule: DashboardScheduleItem[];
  weeklyPatients: { label: string; patients: number }[];
  quickActions: DashboardQuickAction[];
  prescriptions: DashboardPrescriptionItem[];
  notifications: DashboardNotification[];
  attentionItems: { id: string; title: string; subtitle: string; status: string; tone: 'success' | 'danger' | 'default' }[];
}

export interface PatientDashboardData {
  greeting: string;
  subtitle: string;
  kpis: DashboardKpi[];
  upcomingAppointments: DashboardAppointmentItem[];
  prescriptions: DashboardPrescriptionItem[];
  balanceDue: number;
  balanceDueDate: string | null;
  primaryUnpaidInvoiceId: number | null;
  nextAppointment: DashboardAppointmentItem | null;
  vitals: DashboardVitalItem[];
  quickActions: DashboardQuickAction[];
  notifications: DashboardNotification[];
}

export interface ReceptionistDashboardData {
  greeting: string;
  subtitle: string;
  kpis: DashboardKpi[];
  queue: DashboardQueueItem[];
  doctors: DashboardDoctorAvailability[];
  rooms: { id: string; name: string; occupied: boolean; detail?: string }[];
  billingMetrics: { label: string; value: string; subtitle: string; tone?: 'success' | 'danger' | 'default' }[];
  notifications: DashboardNotification[];
}
