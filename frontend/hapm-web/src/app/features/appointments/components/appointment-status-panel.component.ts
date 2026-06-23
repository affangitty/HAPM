import { Component, inject, input, output, signal } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';
import { extractApiErrorMessage } from '../../../core/auth/utils/api-error.util';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiStatusBadgeComponent } from '../../../shared/components/ui/status-badge/ui-status-badge.component';
import { APPOINTMENT_STATUS_TONE } from '../../../shared/models/enums';
import { AppointmentsApiService } from '../data/appointments-api.service';
import { AppointmentDto } from '../models/appointment.models';

@Component({
  selector: 'app-appointment-status-panel',
  standalone: true,
  imports: [UiButtonComponent, UiStatusBadgeComponent],
  template: `
    <div class="rounded-xl border bg-card p-4">
      <div class="mb-3 flex items-center justify-between">
        <h3 class="text-sm font-semibold text-foreground">Status Tracking</h3>
        <app-ui-status-badge [label]="appointment().status" [tone]="statusTone()" />
      </div>

      <div class="flex flex-wrap gap-2">
        @if (canConfirm()) {
          <app-ui-button size="sm" variant="outline" [loading]="loading()" (pressed)="act('confirm')">Confirm</app-ui-button>
        }
        @if (canCheckIn()) {
          <app-ui-button size="sm" variant="outline" [loading]="loading()" (pressed)="act('check-in')">Check in</app-ui-button>
        }
        @if (canComplete()) {
          <app-ui-button size="sm" [loading]="loading()" (pressed)="act('complete')">Complete</app-ui-button>
        }
        @if (canNoShow()) {
          <app-ui-button size="sm" variant="secondary" [loading]="loading()" (pressed)="act('no-show')">No show</app-ui-button>
        }
        @if (canCancel()) {
          <app-ui-button size="sm" variant="destructive" [loading]="loading()" (pressed)="act('cancel')">Cancel</app-ui-button>
        }
      </div>

      @if (error()) {
        <p class="mt-2 text-sm text-destructive">{{ error() }}</p>
      }
    </div>
  `,
})
export class AppointmentStatusPanelComponent {
  private readonly api = inject(AppointmentsApiService);
  private readonly auth = inject(AuthService);

  readonly appointment = input.required<AppointmentDto>();
  readonly updated = output<AppointmentDto>();

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  statusTone() {
    return APPOINTMENT_STATUS_TONE[this.appointment().status];
  }

  canConfirm(): boolean {
    return this.isClinical() && this.appointment().status === 'Pending';
  }

  canCheckIn(): boolean {
    return this.isClinical() && ['Pending', 'Confirmed'].includes(this.appointment().status);
  }

  canComplete(): boolean {
    return this.isClinical() && ['Confirmed', 'CheckedIn'].includes(this.appointment().status);
  }

  canNoShow(): boolean {
    return this.isClinical() && !['Completed', 'Cancelled', 'NoShow'].includes(this.appointment().status);
  }

  canCancel(): boolean {
    const status = this.appointment().status;
    if (['Completed', 'Cancelled', 'NoShow'].includes(status)) return false;
    return this.isClinical() || this.auth.role() === 'Patient';
  }

  act(action: 'confirm' | 'check-in' | 'complete' | 'cancel' | 'no-show'): void {
    const id = this.appointment().id;
    this.loading.set(true);
    this.error.set(null);

    const request$ =
      action === 'confirm'
        ? this.api.confirm(id)
        : action === 'check-in'
          ? this.api.checkIn(id)
          : action === 'complete'
            ? this.api.complete(id, {})
            : action === 'no-show'
              ? this.api.markNoShow(id)
              : this.api.cancel(id, { reason: 'Cancelled from portal' });

    request$.subscribe({
      next: (apt) => {
        this.loading.set(false);
        this.updated.emit(apt);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(extractApiErrorMessage(err, 'Action failed.'));
      },
    });
  }

  private isClinical(): boolean {
    const role = this.auth.role();
    return role === 'Admin' || role === 'Doctor' || role === 'Receptionist';
  }
}
