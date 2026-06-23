import { Injectable, inject, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { APP_CONFIG } from '../config/app-config';
import { AuthService } from '../auth/auth.service';
import { AppointmentDto } from '../../features/appointments/models/appointment.models';
import { DoctorsApiService } from '../../features/doctors/data/doctors-api.service';
import { SignalRBaseService } from './signalr-base.service';

@Injectable({ providedIn: 'root' })
export class AppointmentsHubService extends SignalRBaseService {
  private readonly authService = inject(AuthService);
  private readonly doctorsApi = inject(DoctorsApiService);

  protected hubUrl = APP_CONFIG.hubAppointments;

  readonly latest = signal<AppointmentDto | null>(null);
  readonly received$ = new Subject<AppointmentDto>();

  private handlersBound = false;

  constructor() {
    super(inject(AuthService));
  }

  async connect(): Promise<void> {
    const role = this.authService.role();
    if (!role || role === 'Patient') return;

    await this.start();
    if (!this.handlersBound) {
      this.on<AppointmentDto>('AppointmentStatusChanged', (appointment) => {
        this.latest.set(appointment);
        this.received$.next(appointment);
      });
      this.handlersBound = true;
    }

    if (role === 'Doctor') {
      this.doctorsApi.resolveCurrentDoctorId().subscribe({
        next: (doctorId) => void this.invoke('JoinDoctorQueue', doctorId),
        error: () => undefined,
      });
    }
  }

  override async stop(): Promise<void> {
    this.handlersBound = false;
    this.off('AppointmentStatusChanged');
    await super.stop();
  }
}
