import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiErrorService } from '../../../core/api/api-error.service';
import { extractApiErrorMessage } from '../../../core/auth/utils/api-error.util';
import { FormFieldComponent } from '../../../shared/components/forms/form-field/form-field.component';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiCardComponent, UiCardContentComponent } from '../../../shared/components/ui/card/ui-card.component';
import { UiInputComponent } from '../../../shared/components/ui/input/ui-input.component';
import { UiPageHeaderComponent } from '../../../shared/components/ui/page-header/ui-page-header.component';
import { UiSelectComponent } from '../../../shared/components/ui/select/ui-select.component';
import { UiTextareaComponent } from '../../../shared/components/ui/textarea/ui-textarea.component';
import { getFormControlError, guardFormSubmit } from '../../../shared/utils/form-errors.util';
import { roleRoute } from '../../../shared/utils/role-prefix.util';
import { PatientsApiService } from '../../patients/data/patients-api.service';
import { AppointmentsApiService } from '../../appointments/data/appointments-api.service';
import { toAppointmentSelectOptions } from '../../appointments/utils/appointment-picker.util';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BillingApiService } from '../data/billing-api.service';

@Component({
  selector: 'app-invoice-create-page',
  standalone: true,
  imports: [
    RouterLink, ReactiveFormsModule, UiPageHeaderComponent, UiCardComponent, UiCardContentComponent,
    FormFieldComponent, UiInputComponent, UiSelectComponent, UiTextareaComponent, UiButtonComponent,
  ],
  template: `
    <app-ui-page-header title="Create Invoice" subtitle="Issue a new invoice for a patient" />

    <app-ui-card class="max-w-3xl">
      <app-ui-card-content class="space-y-5 p-5">
        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="grid gap-4 sm:grid-cols-2">
            <app-form-field label="Patient" [error]="err('patientId')" class="sm:col-span-2">
              <app-ui-select formControlName="patientId" [options]="patientOptions()" placeholder="Select patient" />
            </app-form-field>
            <app-form-field label="Linked appointment (optional)" [error]="err('appointmentId')" class="sm:col-span-2">
              @if (appointmentOptions().length > 0) {
                <app-ui-select formControlName="appointmentId" [options]="appointmentOptions()" placeholder="Adds consultation fee automatically" />
              } @else {
                <p class="text-sm text-muted-foreground">Select a patient to load their appointments, or leave blank.</p>
              }
            </app-form-field>
            <app-form-field label="Tax %" [error]="err('taxPercent')">
              <app-ui-input type="number" formControlName="taxPercent" step="0.01" />
            </app-form-field>
            <app-form-field label="Discount amount" [error]="err('discountAmount')">
              <app-ui-input type="number" formControlName="discountAmount" step="0.01" />
            </app-form-field>
            <app-form-field label="Notes" class="sm:col-span-2">
              <app-ui-textarea formControlName="notes" [rows]="2" />
            </app-form-field>
          </div>

          <div class="mt-6">
            <div class="mb-3 flex items-center justify-between">
              <h3 class="font-semibold">Line items</h3>
              <app-ui-button type="button" size="sm" variant="outline" (pressed)="addItem()">Add item</app-ui-button>
            </div>
            <div class="space-y-3" formArrayName="items">
              @for (group of itemControls; track $index; let i = $index) {
                <div class="grid gap-3 rounded-lg border p-3 sm:grid-cols-4" [formGroupName]="i">
                  <app-form-field label="Description" class="sm:col-span-2">
                    <app-ui-input formControlName="description" />
                  </app-form-field>
                  <app-form-field label="Qty">
                    <app-ui-input type="number" formControlName="quantity" min="1" />
                  </app-form-field>
                  <app-form-field label="Unit price">
                    <app-ui-input type="number" formControlName="unitPrice" step="0.01" />
                  </app-form-field>
                  @if (itemControls.length > 1) {
                    <div class="sm:col-span-4">
                      <app-ui-button type="button" size="sm" variant="destructive" (pressed)="removeItem(i)">Remove</app-ui-button>
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          @if (error()) {
            <p class="mt-4 text-sm text-destructive">{{ error() }}</p>
          }

          <div class="mt-6 flex gap-2">
            <app-ui-button type="submit" [loading]="saving()">Create invoice</app-ui-button>
            <a [routerLink]="listLink()"><app-ui-button type="button" variant="outline">Cancel</app-ui-button></a>
          </div>
        </form>
      </app-ui-card-content>
    </app-ui-card>
  `,
})
export class InvoiceCreatePageComponent implements OnInit {
  private readonly api = inject(BillingApiService);
  private readonly patientsApi = inject(PatientsApiService);
  private readonly appointmentsApi = inject(AppointmentsApiService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly toasts = inject(ApiErrorService);
  private readonly destroyRef = inject(DestroyRef);

  readonly patientOptions = signal<{ label: string; value: string }[]>([]);
  readonly appointmentOptions = signal<{ label: string; value: string }[]>([{ label: 'None', value: '' }]);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    patientId: ['', Validators.required],
    appointmentId: [''],
    taxPercent: [5, [Validators.required, Validators.min(0)]],
    discountAmount: [0, [Validators.required, Validators.min(0)]],
    notes: [''],
    items: this.fb.nonNullable.array([this.itemGroup()]),
  });

  get itemControls() {
    return this.form.controls.items.controls;
  }

  ngOnInit(): void {
    this.patientsApi.list({ page: 1, pageSize: 100, sortBy: 'name' }).subscribe({
      next: (r) => this.patientOptions.set(r.items.map((p) => ({ label: `${p.fullName} (${p.medicalRecordNumber})`, value: String(p.id) }))),
    });

    this.form.controls.patientId.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((patientId) => {
      this.form.controls.appointmentId.setValue('');
      this.loadAppointmentsForPatient(patientId);
    });
  }

  private loadAppointmentsForPatient(patientId: string): void {
    if (!patientId) {
      this.appointmentOptions.set([{ label: 'None', value: '' }]);
      return;
    }

    this.appointmentsApi.list({ page: 1, pageSize: 100, patientId: Number(patientId) }).subscribe({
      next: (r) => {
        this.appointmentOptions.set(
          toAppointmentSelectOptions(r.items, {
            patientId: Number(patientId),
            excludeWithInvoice: true,
            statuses: ['Completed', 'CheckedIn', 'Confirmed'],
          }, true),
        );
      },
    });
  }

  addItem(): void {
    this.form.controls.items.push(this.itemGroup());
  }

  removeItem(index: number): void {
    this.form.controls.items.removeAt(index);
  }

  submit(): void {
    if (!guardFormSubmit(this.form)) return;
    this.saving.set(true);
    this.error.set(null);
    const v = this.form.getRawValue();
    this.api.create({
      patientId: Number(v.patientId),
      appointmentId: v.appointmentId ? Number(v.appointmentId) : undefined,
      taxPercent: v.taxPercent,
      discountAmount: v.discountAmount,
      notes: v.notes || undefined,
      items: v.items.map((i) => ({
        description: i.description,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
    }).subscribe({
      next: (inv) => {
        this.saving.set(false);
        this.toasts.show('Invoice created.', 'success');
        void this.router.navigate([roleRoute(this.router, 'billing', 'invoices', String(inv.id))]);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(extractApiErrorMessage(err, 'Failed to create invoice.'));
      },
    });
  }

  err(field: 'patientId' | 'appointmentId' | 'taxPercent' | 'discountAmount'): string | null {
    return getFormControlError(this.form, field);
  }

  listLink(): string {
    return roleRoute(this.router, 'billing');
  }

  private itemGroup() {
    return this.fb.nonNullable.group({
      description: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
    });
  }
}
