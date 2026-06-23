import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiErrorService } from '../../../core/api/api-error.service';
import { ExportsApiService } from '../../../core/api/exports-api.service';
import { extractApiErrorMessage } from '../../../core/auth/utils/api-error.util';
import { FormFieldComponent } from '../../../shared/components/forms/form-field/form-field.component';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiCardComponent, UiCardContentComponent, UiCardDescriptionComponent, UiCardHeaderComponent, UiCardTitleComponent } from '../../../shared/components/ui/card/ui-card.component';
import { UiInputComponent } from '../../../shared/components/ui/input/ui-input.component';
import { UiPageHeaderComponent } from '../../../shared/components/ui/page-header/ui-page-header.component';

@Component({
  selector: 'app-exports-page',
  standalone: true,
  imports: [
    FormsModule, UiPageHeaderComponent, UiCardComponent, UiCardHeaderComponent, UiCardTitleComponent, UiCardDescriptionComponent, UiCardContentComponent,
    FormFieldComponent, UiInputComponent, UiButtonComponent,
  ],
  template: `
    <app-ui-page-header title="CSV Exports" subtitle="Download operational data for reporting" />

    <div class="grid gap-4 lg:grid-cols-3">
      <app-ui-card>
        <app-ui-card-header>
          <app-ui-card-title>Appointments</app-ui-card-title>
          <app-ui-card-description>Optional date range</app-ui-card-description>
        </app-ui-card-header>
        <app-ui-card-content class="space-y-3">
          <app-form-field label="From"><app-ui-input type="date" [(ngModel)]="appointmentsFrom" /></app-form-field>
          <app-form-field label="To"><app-ui-input type="date" [(ngModel)]="appointmentsTo" /></app-form-field>
          <app-ui-button [loading]="exporting() === 'appointments'" (pressed)="exportAppointments()">Download CSV</app-ui-button>
        </app-ui-card-content>
      </app-ui-card>

      <app-ui-card>
        <app-ui-card-header>
          <app-ui-card-title>Patients</app-ui-card-title>
          <app-ui-card-description>Full patient register</app-ui-card-description>
        </app-ui-card-header>
        <app-ui-card-content>
          <app-ui-button [loading]="exporting() === 'patients'" (pressed)="exportPatients()">Download CSV</app-ui-button>
        </app-ui-card-content>
      </app-ui-card>

      <app-ui-card>
        <app-ui-card-header>
          <app-ui-card-title>Invoices</app-ui-card-title>
          <app-ui-card-description>Optional date range</app-ui-card-description>
        </app-ui-card-header>
        <app-ui-card-content class="space-y-3">
          <app-form-field label="From"><app-ui-input type="date" [(ngModel)]="invoicesFrom" /></app-form-field>
          <app-form-field label="To"><app-ui-input type="date" [(ngModel)]="invoicesTo" /></app-form-field>
          <app-ui-button [loading]="exporting() === 'invoices'" (pressed)="exportInvoices()">Download CSV</app-ui-button>
        </app-ui-card-content>
      </app-ui-card>
    </div>
  `,
})
export class ExportsPageComponent {
  private readonly api = inject(ExportsApiService);
  private readonly toasts = inject(ApiErrorService);

  readonly exporting = signal<'appointments' | 'patients' | 'invoices' | null>(null);

  appointmentsFrom = '';
  appointmentsTo = '';
  invoicesFrom = '';
  invoicesTo = '';

  exportAppointments(): void {
    this.runExport('appointments', () =>
      this.api.exportAppointments({
        fromDate: this.appointmentsFrom || undefined,
        toDate: this.appointmentsTo || undefined,
      }),
    );
  }

  exportPatients(): void {
    this.runExport('patients', () => this.api.exportPatients());
  }

  exportInvoices(): void {
    this.runExport('invoices', () =>
      this.api.exportInvoices({
        fromDate: this.invoicesFrom || undefined,
        toDate: this.invoicesTo || undefined,
      }),
    );
  }

  private runExport(key: 'appointments' | 'patients' | 'invoices', action: () => import('rxjs').Observable<void>): void {
    this.exporting.set(key);
    action().subscribe({
      next: () => {
        this.exporting.set(null);
        this.toasts.show('Export downloaded successfully.', 'success');
      },
      error: (err) => {
        this.exporting.set(null);
        this.toasts.show(extractApiErrorMessage(err, 'Export failed.'), 'error');
      },
    });
  }
}
