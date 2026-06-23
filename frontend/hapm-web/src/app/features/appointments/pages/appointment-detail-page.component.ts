import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UiCardComponent, UiCardContentComponent } from '../../../shared/components/ui/card/ui-card.component';
import { UiStatusBadgeComponent } from '../../../shared/components/ui/status-badge/ui-status-badge.component';
import { APPOINTMENT_STATUS_TONE } from '../../../shared/models/enums';
import { AppointmentStatusPanelComponent } from '../components/appointment-status-panel.component';
import { AppointmentsApiService } from '../data/appointments-api.service';
import { AppointmentDto } from '../models/appointment.models';

@Component({
  selector: 'app-appointment-detail-page',
  standalone: true,
  imports: [
    RouterLink,
    UiCardComponent,
    UiCardContentComponent,
    UiStatusBadgeComponent,
    AppointmentStatusPanelComponent,
  ],
  template: `
    @if (appointment(); as apt) {
      <a [routerLink]="listLink()" class="text-xs text-primary hover:underline">← Back to appointments</a>
      <div class="mt-2 mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 class="text-xl font-bold">Appointment #{{ apt.id }}</h1>
          <p class="text-sm text-muted-foreground">{{ apt.appointmentDate }} · {{ apt.startTime }} – {{ apt.endTime }}</p>
        </div>
        <app-ui-status-badge [label]="apt.status" [tone]="statusTone(apt.status)" />
      </div>

      <div class="grid gap-4 lg:grid-cols-3">
        <app-ui-card class="lg:col-span-2">
          <app-ui-card-content class="grid gap-4 p-5 sm:grid-cols-2">
            <div><p class="text-xs text-muted-foreground">Patient</p><p class="text-sm font-medium">{{ apt.patientName }}</p><p class="text-xs text-muted-foreground">MRN {{ apt.medicalRecordNumber }}</p></div>
            <div><p class="text-xs text-muted-foreground">Doctor</p><p class="text-sm font-medium">{{ apt.doctorName }}</p><p class="text-xs text-muted-foreground">{{ apt.specialization }}</p></div>
            <div class="sm:col-span-2"><p class="text-xs text-muted-foreground">Reason</p><p class="text-sm">{{ apt.reason }}</p></div>
            @if (apt.notes) {
              <div class="sm:col-span-2"><p class="text-xs text-muted-foreground">Notes</p><p class="text-sm">{{ apt.notes }}</p></div>
            }
            @if (apt.cancellationReason) {
              <div class="sm:col-span-2"><p class="text-xs text-muted-foreground">Cancellation reason</p><p class="text-sm">{{ apt.cancellationReason }}</p></div>
            }
          </app-ui-card-content>
        </app-ui-card>

        <app-appointment-status-panel [appointment]="apt" (updated)="appointment.set($event)" />
      </div>
    }
  `,
})
export class AppointmentDetailPageComponent implements OnInit {
  private readonly api = inject(AppointmentsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly appointment = signal<AppointmentDto | null>(null);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getById(id).subscribe({ next: (apt) => this.appointment.set(apt) });
  }

  statusTone(status: AppointmentDto['status']) {
    return APPOINTMENT_STATUS_TONE[status];
  }

  listLink(): string {
    return `${this.basePath()}/appointments`;
  }

  private basePath(): string {
    return `/${this.router.url.split('/').filter(Boolean)[0]}`;
  }
}
