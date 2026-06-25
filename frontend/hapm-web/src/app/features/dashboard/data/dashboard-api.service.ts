import { Injectable, inject } from '@angular/core';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';
import { ApiClientService } from '../../../core/api/api-client.service';
import { DashboardStatsDto, PeakHourCellDto, SpecializationRevenueDto } from '../../../core/api/models';
import { AuthService } from '../../../core/auth/auth.service';
import { AppointmentsApiService } from '../../appointments/data/appointments-api.service';
import { AppointmentDto } from '../../appointments/models/appointment.models';
import { NotificationsApiService } from '../../notifications/data/notifications-api.service';
import { NotificationDto } from '../../notifications/models/notification.models';
import {
  AdminDashboardData,
  DashboardKpi,
  DashboardNotification,
  DoctorDashboardData,
  PatientDashboardData,
  ReceptionistDashboardData,
} from '../models/dashboard.models';

export type DashboardStatsApiDto = DashboardStatsDto;

const STATUS_COLORS: Record<string, string> = {
  Pending: '#F59E0B',
  Confirmed: '#3B82F6',
  CheckedIn: '#8B5CF6',
  Completed: '#10B981',
  Cancelled: '#94A3B8',
  NoShow: '#EF4444',
};

const KPI_ICONS = {
  patients: { iconBg: 'bg-blue-50', iconColor: 'text-blue-600', iconPath: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
  doctors: { iconBg: 'bg-violet-50', iconColor: 'text-violet-600', iconPath: 'M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M8.5 3a4 4 0 1 0 0 8M18 8v6M21 11h-6' },
  appointments: { iconBg: 'bg-amber-50', iconColor: 'text-amber-600', iconPath: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z' },
  revenue: { iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', iconPath: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' },
};

@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  private readonly api = inject(ApiClientService);
  private readonly auth = inject(AuthService);
  private readonly appointmentsApi = inject(AppointmentsApiService);
  private readonly notificationsApi = inject(NotificationsApiService);

  getStats(): Observable<DashboardStatsApiDto> {
    return this.api.get<DashboardStatsApiDto>('/dashboard/stats');
  }

  getPeakHours(fromDate?: string, toDate?: string): Observable<PeakHourCellDto[]> {
    return this.api.get<PeakHourCellDto[]>('/dashboard/peak-hours', { fromDate, toDate });
  }

  getRevenueBySpecialization(): Observable<SpecializationRevenueDto[]> {
    return this.api.get<SpecializationRevenueDto[]>('/dashboard/revenue-by-specialization');
  }

  getAdminDashboard(): Observable<AdminDashboardData> {
    return forkJoin({
      stats: this.getStats(),
      appointments: this.appointmentsApi.list({ page: 1, pageSize: 6, sortBy: 'date', sortDescending: true }).pipe(catchError(() => of({ items: [] }))),
      notifications: this.notificationsApi.list({ page: 1, pageSize: 5 }).pipe(catchError(() => of({ items: [] }))),
    }).pipe(map(({ stats, appointments, notifications }) => this.mapAdminFromApi(stats, appointments.items, notifications.items)));
  }

  getDoctorDashboard(): Observable<DoctorDashboardData> {
    return this.api.get<import('../models/dashboard-role-api.models').DoctorRoleDashboardApi>('/dashboard/doctor').pipe(
      map((data) => this.mapDoctorRoleDashboard(data)),
    );
  }

  getPatientDashboard(): Observable<PatientDashboardData> {
    return this.api.get<import('../models/dashboard-role-api.models').PatientRoleDashboardApi>('/dashboard/patient').pipe(
      map((data) => this.mapPatientRoleDashboard(data)),
    );
  }

  getReceptionistDashboard(): Observable<ReceptionistDashboardData> {
    return this.api.get<import('../models/dashboard-role-api.models').ReceptionistRoleDashboardApi>('/dashboard/receptionist').pipe(
      map((data) => this.mapReceptionRoleDashboard(data)),
    );
  }

  private mapDoctorRoleDashboard(data: import('../models/dashboard-role-api.models').DoctorRoleDashboardApi): DoctorDashboardData {
    return {
      ...this.personalizeDoctor(),
      kpis: data.kpis.map((k, i) => this.roleKpi(k, i)),
      schedule: data.schedule.map((s) => ({
        id: String(s.id),
        time: s.time,
        duration: s.duration,
        patient: s.patient,
        type: s.type,
        status: s.status,
        highlight: s.highlight,
      })),
      attentionItems: data.attentionItems.map((a) => ({
        id: String(a.id),
        title: a.title,
        subtitle: a.subtitle,
        status: a.status,
        tone: (a.tone === 'danger' ? 'danger' : a.tone === 'success' ? 'success' : 'default') as 'success' | 'danger' | 'default',
      })),
      notifications: data.notifications.map((n) => this.toRoleNotification(n)),
      weeklyPatients: [],
      quickActions: [],
      prescriptions: [],
    };
  }

  private mapPatientRoleDashboard(data: import('../models/dashboard-role-api.models').PatientRoleDashboardApi): PatientDashboardData {
    return {
      ...this.personalizePatient(),
      kpis: data.kpis.map((k, i) => this.roleKpi(k, i)),
      upcomingAppointments: data.upcomingAppointments.map((a) => ({
        id: String(a.id),
        patient: a.patient,
        doctor: a.doctor,
        date: a.date,
        time: a.time,
        type: a.type,
        status: a.status,
      })),
      prescriptions: data.prescriptions.map((p) => ({
        id: String(p.id),
        patient: p.patient,
        date: p.date,
        status: p.status,
        medications: p.medications,
      })),
      balanceDue: data.balanceDue,
      balanceDueDate: data.balanceDueDate,
      vitals: data.vitals.map((v) => ({
        label: v.label,
        value: v.value,
        unit: v.unit,
        status: v.status,
        statusColor: 'text-emerald-600',
      })),
      notifications: data.notifications.map((n) => this.toRoleNotification(n)),
      nextAppointment: data.upcomingAppointments[0]
        ? {
            id: String(data.upcomingAppointments[0].id),
            patient: data.upcomingAppointments[0].patient,
            doctor: data.upcomingAppointments[0].doctor,
            date: data.upcomingAppointments[0].date,
            time: data.upcomingAppointments[0].time,
            type: data.upcomingAppointments[0].type,
            status: data.upcomingAppointments[0].status,
          }
        : null,
      quickActions: [],
    };
  }

  private mapReceptionRoleDashboard(data: import('../models/dashboard-role-api.models').ReceptionistRoleDashboardApi): ReceptionistDashboardData {
    return {
      ...this.personalizeReception(),
      kpis: data.kpis.map((k, i) => this.roleKpi(k, i)),
      queue: data.queue.map((q) => ({
        id: q.id,
        name: q.name,
        time: q.time,
        doctor: q.doctor,
        status: q.status,
        waitTime: q.waitTime,
      })),
      rooms: data.rooms.map((r) => ({
        id: r.id,
        name: r.name,
        occupied: r.occupied,
        detail: r.detail ?? undefined,
      })),
      billingMetrics: data.billingMetrics.map((m) => ({
        label: m.label,
        value: m.value,
        subtitle: m.subtitle,
        tone: (m.tone === 'danger' ? 'danger' : m.tone === 'success' ? 'success' : 'default') as 'success' | 'danger' | 'default',
      })),
      notifications: data.notifications.map((n) => this.toRoleNotification(n)),
      doctors: [],
    };
  }

  private roleKpi(
    k: { title: string; value: string; subtitle: string; trend?: string | null; trendValue?: string | null },
    index: number,
  ): DashboardKpi {
    const icons = [KPI_ICONS.appointments, KPI_ICONS.patients, KPI_ICONS.revenue, KPI_ICONS.doctors];
    const icon = icons[index % icons.length];
    return {
      title: k.title,
      value: k.value,
      subtitle: k.subtitle,
      trend: (k.trend as DashboardKpi['trend']) ?? 'neutral',
      trendValue: k.trendValue ?? undefined,
      ...icon,
    };
  }

  private toRoleNotification(n: import('../models/dashboard-role-api.models').RoleDashboardNotificationApi): DashboardNotification {
    return {
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      time: this.relativeTime(n.createdAtUtc),
      read: n.isRead,
      priority: 'normal',
    };
  }

  private mapAdminFromApi(
    stats: DashboardStatsApiDto,
    appointments: AppointmentDto[],
    notifications: NotificationDto[],
  ): AdminDashboardData {
    return {
      ...this.personalizeAdmin(),
      kpis: [
        {
          title: 'Total Patients',
          value: stats.totalPatients.toLocaleString(),
          subtitle: `${stats.newPatientsThisMonth} new this month`,
          ...this.trend(stats.newPatientsThisMonth, stats.newPatientsLastMonth),
          ...KPI_ICONS.patients,
        },
        {
          title: 'Active Doctors',
          value: String(stats.totalDoctors),
          subtitle: `${stats.upcomingAppointments} upcoming visits`,
          trend: 'neutral',
          trendValue: undefined,
          ...KPI_ICONS.doctors,
        },
        {
          title: 'Appointments Today',
          value: String(stats.appointmentsToday),
          subtitle: `${stats.appointmentsYesterday} yesterday`,
          ...this.trend(stats.appointmentsToday, stats.appointmentsYesterday),
          ...KPI_ICONS.appointments,
        },
        {
          title: 'Monthly Revenue',
          value: this.formatRevenue(stats.revenueThisMonth),
          subtitle: `${this.formatRevenue(stats.revenueLastMonth)} last month`,
          ...this.trend(stats.revenueThisMonth, stats.revenueLastMonth),
          ...KPI_ICONS.revenue,
        },
      ],
      appointmentStatus: stats.appointmentsByStatus.map((item) => ({
        label: item.status,
        value: item.count,
        color: STATUS_COLORS[item.status] ?? '#94A3B8',
      })),
      departmentPerformance: stats.topSpecializations.map((s) => ({
        label: s.specialization,
        count: s.appointmentCount,
      })),
      systemHealth: stats.systemHealth.map((h) => ({
        label: h.label,
        value: h.value,
        tone: (h.tone as 'success' | 'danger' | 'default') ?? 'default',
        progress: h.progress ?? undefined,
      })),
      appointmentTrend: [],
      revenue: [],
      activity: [],
      recentAppointments: appointments.map((a) => this.toAppointmentItem(a)),
      notifications: notifications.map((n) => this.toNotification(n)),
    };
  }

  private trend(current: number, previous: number): Pick<DashboardKpi, 'trend' | 'trendValue'> {
    if (previous === 0) {
      return current > 0 ? { trend: 'up', trendValue: 'new' } : { trend: 'neutral', trendValue: '0%' };
    }
    const pct = ((current - previous) / previous) * 100;
    const rounded = Math.abs(pct).toFixed(1);
    if (Math.abs(pct) < 0.5) return { trend: 'neutral', trendValue: '0%' };
    return pct > 0
      ? { trend: 'up', trendValue: `+${rounded}%` }
      : { trend: 'down', trendValue: `-${rounded}%` };
  }

  private formatRevenue(amount: number): string {
    if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}k`;
    return `$${amount.toFixed(0)}`;
  }

  private toAppointmentItem(a: AppointmentDto) {
    return {
      id: String(a.id),
      patient: a.patientName,
      doctor: a.doctorName,
      date: a.appointmentDate,
      time: a.startTime,
      type: a.reason ?? 'Consultation',
      status: a.status,
    };
  }

  private toNotification(n: NotificationDto): DashboardNotification {
    return {
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      time: this.relativeTime(n.createdAtUtc),
      read: n.isRead,
      priority: 'normal',
    };
  }

  private personalizeAdmin(): Pick<AdminDashboardData, 'greeting' | 'subtitle'> {
    const name = this.firstName();
    return {
      greeting: 'Dashboard Overview',
      subtitle: name
        ? `Welcome back, ${name}. Here is what's happening today.`
        : 'Real-time metrics and system health for HAPM.',
    };
  }

  private personalizeDoctor(): Pick<DoctorDashboardData, 'greeting' | 'subtitle'> {
    const name = this.auth.user()?.fullName ?? 'Doctor';
    return {
      greeting: `Good morning, ${name.split(' ')[0]}`,
      subtitle: 'Your schedule and attention items for today.',
    };
  }

  private personalizePatient(): Pick<PatientDashboardData, 'greeting' | 'subtitle'> {
    const name = this.firstName() ?? 'there';
    return {
      greeting: `Welcome back, ${name}`,
      subtitle: 'Here is a summary of your patient portal for today.',
    };
  }

  private personalizeReception(): Pick<ReceptionistDashboardData, 'greeting' | 'subtitle'> {
    return {
      greeting: 'Reception Dashboard',
      subtitle: this.todayLabel(),
    };
  }

  private firstName(): string | null {
    return this.auth.user()?.fullName?.split(' ')[0] ?? null;
  }

  private todayLabel(): string {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date());
  }

  private relativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }
}
