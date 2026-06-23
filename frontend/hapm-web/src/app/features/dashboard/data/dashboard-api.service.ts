import { Injectable, inject } from '@angular/core';
import { catchError, delay, forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { ApiClientService } from '../../../core/api/api-client.service';
import { DashboardStatsDto, PeakHourCellDto, SpecializationRevenueDto } from '../../../core/api/models';
import { AuthService } from '../../../core/auth/auth.service';
import { BillingApiService } from '../../billing/data/billing-api.service';
import { LabReportsApiService } from '../../lab-reports/data/lab-reports-api.service';
import { AppointmentsApiService } from '../../appointments/data/appointments-api.service';
import { AppointmentDto } from '../../appointments/models/appointment.models';
import { DoctorsApiService } from '../../doctors/data/doctors-api.service';
import { DoctorDto, DoctorPerformanceDto } from '../../doctors/models/doctor.models';
import { NotificationsApiService } from '../../notifications/data/notifications-api.service';
import { NotificationDto } from '../../notifications/models/notification.models';
import { PrescriptionsApiService } from '../../prescriptions/data/prescriptions-api.service';
import { PrescriptionDto } from '../../prescriptions/models/prescription.models';
import { VitalsApiService } from '../../vitals/data/vitals-api.service';
import { VitalSignDto } from '../../vitals/models/vital.models';
import { WaitlistApiService } from '../../waitlist/data/waitlist-api.service';
import { WaitlistEntryDto } from '../../waitlist/models/waitlist.models';
import {
  AdminDashboardData,
  DashboardNotification,
  DashboardPrescriptionItem,
  DashboardQueueItem,
  DashboardScheduleItem,
  DoctorDashboardData,
  PatientDashboardData,
  ReceptionistDashboardData,
} from '../models/dashboard.models';
import {
  MOCK_ADMIN_DASHBOARD,
  MOCK_DOCTOR_DASHBOARD,
  MOCK_PATIENT_DASHBOARD,
  MOCK_RECEPTIONIST_DASHBOARD,
} from './dashboard-mock.data';

/** Backend shape — GET /api/dashboard/stats */
export type DashboardStatsApiDto = DashboardStatsDto;

@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  private readonly api = inject(ApiClientService);
  private readonly auth = inject(AuthService);
  private readonly appointmentsApi = inject(AppointmentsApiService);
  private readonly doctorsApi = inject(DoctorsApiService);
  private readonly prescriptionsApi = inject(PrescriptionsApiService);
  private readonly notificationsApi = inject(NotificationsApiService);
  private readonly vitalsApi = inject(VitalsApiService);
  private readonly waitlistApi = inject(WaitlistApiService);
  private readonly billingApi = inject(BillingApiService);
  private readonly labReportsApi = inject(LabReportsApiService);

  readonly useLiveApi = true;

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
    if (!this.useLiveApi) {
      return of(this.personalizeAdmin(MOCK_ADMIN_DASHBOARD)).pipe(delay(250));
    }

    const today = this.todayIso();
    return forkJoin({
      stats: this.getStats(),
      appointments: this.appointmentsApi.list({ page: 1, pageSize: 6, sortBy: 'date', sortDescending: true }).pipe(catchError(() => of({ items: [] }))),
      notifications: this.notificationsApi.list({ page: 1, pageSize: 5 }).pipe(catchError(() => of({ items: [] }))),
    }).pipe(
      map(({ stats, appointments, notifications }) => this.mapAdminFromApi(stats, appointments.items, notifications.items)),
      catchError(() => of(this.personalizeAdmin(MOCK_ADMIN_DASHBOARD)).pipe(delay(250))),
    );
  }

  getDoctorDashboard(): Observable<DoctorDashboardData> {
    if (!this.useLiveApi) {
      return of(this.personalizeDoctor(MOCK_DOCTOR_DASHBOARD)).pipe(delay(250));
    }

    const today = this.todayIso();
    return this.doctorsApi.getCurrentDoctor().pipe(
      switchMap((doctor) =>
        forkJoin({
          performance: this.doctorsApi.getPerformance(doctor.id),
          appointments: this.appointmentsApi.list({ page: 1, pageSize: 8, fromDate: today, sortBy: 'date' }).pipe(catchError(() => of({ items: [] }))),
          prescriptions: this.prescriptionsApi.list({ page: 1, pageSize: 3, sortDescending: true }).pipe(catchError(() => of({ items: [] }))),
          labReports: this.labReportsApi.list({ page: 1, pageSize: 3, status: 'PendingReview' as never }).pipe(catchError(() => of({ items: [] }))),
          notifications: this.notificationsApi.list({ page: 1, pageSize: 5 }).pipe(catchError(() => of({ items: [] }))),
        }).pipe(
          map(({ performance, appointments, prescriptions, labReports, notifications }) =>
            this.mapDoctorFromApi(doctor, performance, appointments.items, prescriptions.items, labReports.items, notifications.items),
          ),
        ),
      ),
      catchError(() => of(this.personalizeDoctor(MOCK_DOCTOR_DASHBOARD)).pipe(delay(250))),
    );
  }

  getPatientDashboard(): Observable<PatientDashboardData> {
    if (!this.useLiveApi) {
      return of(this.personalizePatient(MOCK_PATIENT_DASHBOARD)).pipe(delay(250));
    }

    const today = this.todayIso();
    return forkJoin({
      appointments: this.appointmentsApi.list({ page: 1, pageSize: 10, fromDate: today, sortBy: 'date' }).pipe(catchError(() => of({ items: [] }))),
      vitals: this.vitalsApi.list({ page: 1, pageSize: 1, sortDescending: true }).pipe(catchError(() => of({ items: [] }))),
      prescriptions: this.prescriptionsApi.list({ page: 1, pageSize: 3, sortDescending: true }).pipe(catchError(() => of({ items: [] }))),
      invoices: this.billingApi.list({ page: 1, pageSize: 5 }).pipe(catchError(() => of({ items: [] }))),
      notifications: this.notificationsApi.list({ page: 1, pageSize: 5 }).pipe(catchError(() => of({ items: [] }))),
    }).pipe(
      map(({ appointments, vitals, prescriptions, invoices, notifications }) =>
        this.mapPatientFromApi(appointments.items, vitals.items[0] ?? null, prescriptions.items, invoices.items, notifications.items),
      ),
      catchError(() => of(this.personalizePatient(MOCK_PATIENT_DASHBOARD)).pipe(delay(250))),
    );
  }

  getReceptionistDashboard(): Observable<ReceptionistDashboardData> {
    if (!this.useLiveApi) {
      return of(this.personalizeReception(MOCK_RECEPTIONIST_DASHBOARD)).pipe(delay(250));
    }

    const today = this.todayIso();
    return forkJoin({
      appointments: this.appointmentsApi.list({ page: 1, pageSize: 15, fromDate: today, toDate: today, sortBy: 'date' }).pipe(catchError(() => of({ items: [] }))),
      waitlist: this.waitlistApi.list({ page: 1, pageSize: 10 }).pipe(catchError(() => of({ items: [] }))),
      doctors: this.doctorsApi.list({ page: 1, pageSize: 12 }).pipe(catchError(() => of({ items: [] }))),
      invoices: this.billingApi.list({ page: 1, pageSize: 20 }).pipe(catchError(() => of({ items: [] }))),
      notifications: this.notificationsApi.list({ page: 1, pageSize: 5 }).pipe(catchError(() => of({ items: [] }))),
    }).pipe(
      map(({ appointments, waitlist, doctors, invoices, notifications }) =>
        this.mapReceptionFromApi(appointments.items, waitlist.items, doctors.items, invoices.items, notifications.items),
      ),
      catchError(() => of(this.personalizeReception(MOCK_RECEPTIONIST_DASHBOARD)).pipe(delay(250))),
    );
  }

  private mapAdminFromApi(
    stats: DashboardStatsApiDto,
    appointments: AppointmentDto[],
    notifications: NotificationDto[],
  ): AdminDashboardData {
    const base = MOCK_ADMIN_DASHBOARD;
    return {
      ...this.personalizeAdmin(base),
      kpis: [
        { ...base.kpis[0], title: 'Total Patients', value: stats.totalPatients.toLocaleString(), trendValue: '+4.2%', trend: 'up' as const },
        { ...base.kpis[3], title: 'Monthly Revenue', value: `$${(stats.revenueThisMonth / 1000000).toFixed(1)}M`, trendValue: '+1.8%', trend: 'up' as const },
        { ...base.kpis[1], title: 'Active Doctors', value: String(stats.totalDoctors), trendValue: '0%', trend: 'neutral' as const },
        { ...base.kpis[2], title: 'Appointments Today', value: String(stats.appointmentsToday), trendValue: '+12%', trend: 'up' as const },
      ],
      appointmentStatus: stats.appointmentsByStatus.map((item, index) => ({
        label: item.status,
        value: item.count,
        color: base.appointmentStatus[index]?.color ?? '#94A3B8',
      })),
      departmentPerformance: stats.topSpecializations.map((s) => ({
        label: s.specialization,
        count: s.appointmentCount,
      })),
      systemHealth: [
        { label: 'EHR Database', value: '99.9% Uptime', tone: 'success' as const },
        { label: 'API Gateway', value: '124ms latency', tone: 'default' as const },
        { label: 'Pending Invoices', value: String(stats.pendingInvoices), tone: stats.pendingInvoices > 10 ? 'danger' as const : 'default' as const, progress: Math.min(stats.pendingInvoices, 100) },
      ],
      recentAppointments: appointments.map((a) => this.toAppointmentItem(a)),
      notifications: notifications.map((n) => this.toNotification(n)),
    };
  }

  private mapDoctorFromApi(
    doctor: DoctorDto,
    performance: DoctorPerformanceDto,
    appointments: AppointmentDto[],
    prescriptions: PrescriptionDto[],
    labReports: import('../../lab-reports/models/lab-report.models').LabReportDto[],
    notifications: NotificationDto[],
  ): DoctorDashboardData {
    const base = MOCK_DOCTOR_DASHBOARD;
    const seen = appointments.filter((a) => a.status === 'Completed').length;
    const waiting = appointments.filter((a) => a.status === 'CheckedIn').length;
    const cancelled = appointments.filter((a) => a.status === 'Cancelled').length;
    return {
      ...this.personalizeDoctor(base),
      kpis: [
        { ...base.kpis[0], title: 'Total Appts', value: String(appointments.length) },
        { ...base.kpis[1], title: 'Seen', value: String(seen) },
        { ...base.kpis[2], title: 'Waiting', value: String(waiting) },
        { ...base.kpis[3], title: 'Cancellations', value: String(cancelled) },
      ],
      schedule: appointments.map((a) => this.toScheduleItem(a)),
      weeklyPatients: [{ label: 'This week', patients: performance.distinctPatients }],
      prescriptions: prescriptions.map((p) => this.toPrescriptionItem(p)),
      notifications: notifications.map((n) => this.toNotification(n)),
      attentionItems: labReports.length
        ? labReports.map((r) => ({
            id: String(r.id),
            title: r.title,
            subtitle: `${r.patientName} · ${this.relativeTime(r.uploadedAtUtc)}`,
            status: r.status === 'Reviewed' ? 'NORMAL' : 'REVIEW NEEDED',
            tone: r.status === 'Reviewed' ? 'success' as const : 'danger' as const,
          }))
        : base.attentionItems,
    };
  }

  private mapPatientFromApi(
    appointments: AppointmentDto[],
    latestVital: VitalSignDto | null,
    prescriptions: PrescriptionDto[],
    invoices: import('../../billing/models/billing.models').InvoiceDto[],
    notifications: NotificationDto[],
  ): PatientDashboardData {
    const base = MOCK_PATIENT_DASHBOARD;
    const upcoming = appointments.filter((a) => !['Cancelled', 'Completed', 'NoShow'].includes(a.status));
    const balanceDue = invoices.reduce((sum, inv) => sum + inv.balanceDue, 0);
    return {
      ...this.personalizePatient(base),
      kpis: base.kpis,
      upcomingAppointments: upcoming.map((a) => this.toAppointmentItem(a)),
      prescriptions: prescriptions.map((p) => this.toPrescriptionItem(p)),
      balanceDue,
      balanceDueDate: balanceDue > 0 ? 'Soon' : null,
      nextAppointment: upcoming[0] ? this.toAppointmentItem(upcoming[0]) : null,
      vitals: latestVital ? this.toVitals(latestVital) : base.vitals,
      notifications: notifications.map((n) => this.toNotification(n)),
    };
  }

  private mapReceptionFromApi(
    appointments: AppointmentDto[],
    waitlist: WaitlistEntryDto[],
    doctors: DoctorDto[],
    invoices: import('../../billing/models/billing.models').InvoiceDto[],
    notifications: NotificationDto[],
  ): ReceptionistDashboardData {
    const base = MOCK_RECEPTIONIST_DASHBOARD;
    const checkedIn = appointments.filter((a) => a.status === 'CheckedIn').length;
    return {
      ...this.personalizeReception(base),
      kpis: [
        { ...base.kpis[0], value: String(appointments.length) },
        { ...base.kpis[1], value: String(checkedIn) },
        { ...base.kpis[2], value: String(waitlist.length) },
        { ...base.kpis[3], value: String(doctors.filter((d) => d.isAvailable).length) },
      ],
      queue: appointments.slice(0, 8).map((a, i) => this.toQueueItem(a, i)),
      doctors: doctors.slice(0, 6).map((d) => ({
        id: String(d.id),
        name: d.fullName,
        specialty: d.specialization,
        status: d.isAvailable ? 'available' as const : 'busy' as const,
      })),
      rooms: doctors.slice(0, 4).map((d, i) => ({
        id: String(i + 1),
        name: `Consultation ${i + 1}`,
        occupied: !d.isAvailable,
        detail: !d.isAvailable ? `Occupied - ${d.fullName}` : undefined,
      })),
      billingMetrics: [
        {
          label: "Today's Revenue",
          value: `$${invoices.reduce((s, i) => s + i.amountPaid, 0).toLocaleString()}`,
          subtitle: `${invoices.length} invoices processed`,
          tone: 'success' as const,
        },
        {
          label: 'Pending Copays',
          value: String(invoices.filter((i) => i.balanceDue > 0).length),
          subtitle: 'Action required before close',
          tone: 'danger' as const,
        },
        {
          label: 'Insurance Claims',
          value: String(invoices.filter((i) => i.status === 'Pending').length),
          subtitle: 'Ready to batch submit',
          tone: 'default' as const,
        },
      ],
      notifications: notifications.map((n) => this.toNotification(n)),
    };
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

  private toScheduleItem(a: AppointmentDto): DashboardScheduleItem {
    return {
      id: String(a.id),
      time: a.startTime,
      duration: '30 min',
      patient: a.patientName,
      type: a.reason ?? 'Consultation',
      status: a.status,
      highlight: a.status === 'CheckedIn',
    };
  }

  private toQueueItem(a: AppointmentDto, index: number): DashboardQueueItem {
    return {
      id: a.id,
      name: a.patientName,
      time: a.startTime,
      doctor: a.doctorName,
      status: a.status,
      waitTime: `${index * 5} min`,
    };
  }

  private toPrescriptionItem(p: PrescriptionDto): DashboardPrescriptionItem {
    return {
      id: String(p.id),
      patient: p.patientName,
      date: p.appointmentDate,
      status: 'Active',
      medications: p.items.map((item) => ({
        name: item.medicineName,
        dose: item.dosage,
        freq: item.frequency,
      })),
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

  private toVitals(v: VitalSignDto) {
    return [
      { label: 'Pulse', value: String(v.pulseBpm ?? '—'), unit: 'bpm', status: 'Normal', statusColor: 'text-emerald-600' },
      { label: 'BP', value: `${v.systolicBpMmHg ?? '—'}/${v.diastolicBpMmHg ?? '—'}`, unit: 'mmHg', status: 'Normal', statusColor: 'text-emerald-600' },
      { label: 'SpO₂', value: String(v.oxygenSaturationPercent ?? '—'), unit: '%', status: 'Normal', statusColor: 'text-emerald-600' },
      { label: 'BMI', value: v.bmi?.toFixed(1) ?? '—', unit: '', status: 'Normal', statusColor: 'text-emerald-600' },
    ];
  }

  private personalizeAdmin(data: AdminDashboardData): AdminDashboardData {
    const name = this.firstName();
    return {
      ...data,
      greeting: 'Dashboard Overview',
      subtitle: name
        ? `Welcome back, ${name}. Here is what's happening today.`
        : 'Real-time metrics and system health for HAPM.',
    };
  }

  private personalizeDoctor(data: DoctorDashboardData): DoctorDashboardData {
    const name = this.auth.user()?.fullName ?? 'Doctor';
    const count = data.schedule.filter((s) => s.type !== 'internal').length;
    return {
      ...data,
      greeting: `Good morning, ${name.split(' ')[0]}`,
      subtitle: `You have ${count} patients scheduled for today.`,
    };
  }

  private personalizePatient(data: PatientDashboardData): PatientDashboardData {
    const name = this.firstName() ?? 'there';
    return {
      ...data,
      greeting: `Welcome back, ${name}`,
      subtitle: 'Here is a summary of your patient portal for today.',
    };
  }

  private personalizeReception(data: ReceptionistDashboardData): ReceptionistDashboardData {
    const name = this.firstName();
    return {
      ...data,
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

  private todayIso(): string {
    return new Date().toISOString().slice(0, 10);
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
