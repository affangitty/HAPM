import { Component, DestroyRef, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { UiCardComponent, UiCardContentComponent } from '../../../shared/components/ui/card/ui-card.component';
import { UiEmptyStateComponent } from '../../../shared/components/ui/empty-state/ui-empty-state.component';
import { UiSkeletonComponent } from '../../../shared/components/ui/skeleton/ui-skeleton.component';
import { UiStatusBadgeComponent } from '../../../shared/components/ui/status-badge/ui-status-badge.component';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { APPOINTMENT_STATUS_TONE } from '../../../shared/models/enums';
import { initDetailRouteLoader } from '../../../shared/utils/detail-route.util';
import { roleRoute } from '../../../shared/utils/role-prefix.util';
import { AuthService } from '../../../core/auth/auth.service';
import { AppointmentStatusPanelComponent } from '../components/appointment-status-panel.component';
import { AppointmentReschedulePanelComponent } from '../components/appointment-reschedule-panel.component';
import { AppointmentRelatedRecordsComponent } from '../components/appointment-related-records.component';
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
    UiSkeletonComponent,
    UiEmptyStateComponent,
    AppointmentStatusPanelComponent,
    AppointmentReschedulePanelComponent,
    AppointmentRelatedRecordsComponent,
    UiButtonComponent,
  ],
  template: `
    <a [routerLink]="listLink()" class="text-xs text-primary hover:underline">← Back to appointments</a>

    @if (loading()) {
      <app-ui-skeleton class="mt-4 h-64" />
    } @else if (notFound()) {
      <app-ui-empty-state class="mt-6 block" title="Appointment not found" message="This appointment may have been removed or you may not have access." />
    } @else {
      @if (appointment(); as apt) {
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

      <app-appointment-related-records [appointment]="apt" />
      <app-appointment-reschedule-panel [appointment]="apt" (updated)="appointment.set($event)" />

      @if (canCreatePrescription(apt)) {
        <app-ui-card class="mt-4">
          <app-ui-card-content class="flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <h3 class="font-semibold">Prescription</h3>
              <p class="text-sm text-muted-foreground">No prescription has been issued for this visit yet.</p>
            </div>
            <a [routerLink]="prescriptionCreateLink(apt.id)">
              <app-ui-button>Create prescription</app-ui-button>
            </a>
          </app-ui-card-content>
        </app-ui-card>
      }

      @if (canRecordVitals(apt)) {
        <app-ui-card class="mt-4">
          <app-ui-card-content class="flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <h3 class="font-semibold">Vital signs</h3>
              <p class="text-sm text-muted-foreground">Record vitals for this visit.</p>
            </div>
            <a [routerLink]="vitalsRecordLink(apt.id)">
              <app-ui-button variant="outline">Record vitals</app-ui-button>
            </a>
          </app-ui-card-content>
        </app-ui-card>
      }
      }
    }
  `,
})
export class AppointmentDetailPageComponent {
  private readonly api = inject(AppointmentsApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly routeState = initDetailRouteLoader('id', (id) => this.api.getById(id), this.destroyRef);

  readonly loading = this.routeState.loading;
  readonly notFound = this.routeState.notFound;
  readonly appointment = this.routeState.data;

  statusTone(status: AppointmentDto['status']) {
    return APPOINTMENT_STATUS_TONE[status];
  }

  canCreatePrescription(apt: AppointmentDto): boolean {
    if (this.auth.role() !== 'Doctor') return false;
    if (apt.hasPrescription) return false;
    return apt.status === 'Completed' || apt.status === 'CheckedIn';
  }

  canRecordVitals(apt: AppointmentDto): boolean {
    if (this.auth.role() !== 'Doctor') return false;
    return apt.status === 'CheckedIn' || apt.status === 'Completed';
  }

  vitalsRecordLink(appointmentId: number): string {
    return roleRoute(this.router, 'vitals', 'record') + `?appointmentId=${appointmentId}`;
  }

  prescriptionCreateLink(appointmentId: number): string {
    return roleRoute(this.router, 'prescriptions', 'create') + `?appointmentId=${appointmentId}`;
  }

  listLink(): string {
    return roleRoute(this.router, 'appointments');
  }
}
