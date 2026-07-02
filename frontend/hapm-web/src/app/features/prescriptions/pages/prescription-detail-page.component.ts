import { DatePipe } from '@angular/common';
import { ApiErrorService } from '../../../core/api/api-error.service';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { extractApiErrorMessage } from '../../../core/auth/utils/api-error.util';
import { AuthService } from '../../../core/auth/auth.service';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiCardComponent, UiCardContentComponent } from '../../../shared/components/ui/card/ui-card.component';
import { UiEmptyStateComponent } from '../../../shared/components/ui/empty-state/ui-empty-state.component';
import { UiSkeletonComponent } from '../../../shared/components/ui/skeleton/ui-skeleton.component';
import { HasUnsavedChanges } from '../../../core/guards/has-unsaved-changes';
import { initDetailRouteLoader } from '../../../shared/utils/detail-route.util';
import { bindUnsavedChangesProtection, formsAreDirty, markFormsPristine } from '../../../shared/utils/unsaved-changes.util';
import { roleRoute } from '../../../shared/utils/role-prefix.util';
import { getFormControlError, markFormGroupTouched, guardFormSubmit } from '../../../shared/utils/form-errors.util';
import { MedicationTableComponent } from '../components/medication-table.component';
import { PrescriptionFormComponent } from '../components/prescription-form.component';
import { PrescriptionPdfPanelComponent } from '../components/prescription-pdf-panel.component';
import { createMedicationGroup, medicationItemsToRequest } from '../components/medication-form.util';
import { PrescriptionsApiService } from '../data/prescriptions-api.service';
import { PrescriptionDto } from '../models/prescription.models';

@Component({
  selector: 'app-prescription-detail-page',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    ReactiveFormsModule,
    UiCardComponent,
    UiCardContentComponent,
    UiButtonComponent,
    UiSkeletonComponent,
    UiEmptyStateComponent,
    MedicationTableComponent,
    PrescriptionFormComponent,
    PrescriptionPdfPanelComponent,
  ],
  template: `
    <a [routerLink]="listLink()" class="text-xs text-primary hover:underline">← Back to prescriptions</a>

    @if (loading()) {
      <app-ui-skeleton class="mt-4 h-64" />
    } @else if (notFound()) {
      <app-ui-empty-state class="mt-6 block" title="Prescription not found" message="This prescription may have been removed or you may not have access." />
    } @else {
      @if (prescription(); as rx) {
      <div class="mt-2 mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 class="text-xl font-bold">Prescription #{{ rx.id }}</h1>
          <p class="text-sm text-muted-foreground">{{ rx.patientName }} · {{ rx.appointmentDate }}</p>
        </div>
        @if (!editing()) {
          <div class="flex gap-2">
            @if (isDoctor()) {
              <app-ui-button size="sm" variant="outline" (pressed)="startEdit()">Edit</app-ui-button>
            }
          </div>
        }
      </div>

      @if (editing() && isDoctor()) {
        <app-ui-card class="mb-6 max-w-4xl">
          <app-ui-card-content class="p-5">
            <form [formGroup]="form" (ngSubmit)="save()">
              <app-prescription-form [form]="form" />
              @if (error()) {
                <p class="mt-4 text-sm text-destructive">{{ error() }}</p>
              }
              <div class="mt-6 flex gap-2">
                <app-ui-button type="submit" [loading]="saving()">Save changes</app-ui-button>
                <app-ui-button type="button" variant="outline" (pressed)="cancelEdit()">Cancel</app-ui-button>
              </div>
            </form>
          </app-ui-card-content>
        </app-ui-card>
      } @else {
        <div class="mb-6 grid gap-4 lg:grid-cols-2">
          <app-ui-card>
            <app-ui-card-content class="grid gap-4 p-5 sm:grid-cols-2">
              <div>
                <p class="text-xs text-muted-foreground">Patient</p>
                <p class="font-medium">{{ rx.patientName }}</p>
                <p class="text-sm text-muted-foreground">MRN {{ rx.medicalRecordNumber }}</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground">Doctor</p>
                <p class="font-medium">{{ rx.doctorName }}</p>
                <p class="text-sm text-muted-foreground">{{ rx.specialization }}</p>
              </div>
              <div class="sm:col-span-2">
                <p class="text-xs text-muted-foreground">Diagnosis</p>
                <p>{{ rx.diagnosis }}</p>
              </div>
              @if (rx.notes) {
                <div class="sm:col-span-2">
                  <p class="text-xs text-muted-foreground">Notes</p>
                  <p>{{ rx.notes }}</p>
                </div>
              }
              <div>
                <p class="text-xs text-muted-foreground">Follow-up</p>
                <p>{{ rx.followUpDate || 'Not scheduled' }}</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground">Issued</p>
                <p>{{ rx.createdAtUtc | date: 'medium' }}</p>
              </div>
            </app-ui-card-content>
          </app-ui-card>

          <app-prescription-pdf-panel [prescription]="rx" />
        </div>

        <div>
          <h2 class="mb-3 font-semibold">Medications</h2>
          <app-medication-table [items]="rx.items" />
        </div>
      }
      }
    }
  `,
})
export class PrescriptionDetailPageComponent implements HasUnsavedChanges {
  private readonly toasts = inject(ApiErrorService);

  private readonly api = inject(PrescriptionsApiService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly routeState = initDetailRouteLoader('id', (id) => this.api.getById(id), this.destroyRef);

  readonly loading = this.routeState.loading;
  readonly notFound = this.routeState.notFound;
  readonly prescription = this.routeState.data;
  readonly saving = signal(false);
  readonly editing = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    diagnosis: ['', [Validators.required, Validators.maxLength(1000)]],
    notes: ['', Validators.maxLength(2000)],
    followUpDate: [''],
    items: this.fb.array([createMedicationGroup(this.fb)]),
  });

  constructor() {
    bindUnsavedChangesProtection(this.destroyRef, () => this.hasUnsavedChanges());
  }

  hasUnsavedChanges(): boolean {
    return this.editing() && formsAreDirty(this.form);
  }

  isDoctor(): boolean {
    return this.auth.role() === 'Doctor';
  }

  startEdit(): void {
    const rx = this.prescription();
    if (!rx) return;
    this.form.patchValue({
      diagnosis: rx.diagnosis,
      notes: rx.notes ?? '',
      followUpDate: rx.followUpDate ?? '',
    });
    const items = this.form.get('items') as FormArray;
    items.clear();
    for (const item of rx.items) {
      items.push(createMedicationGroup(this.fb, item));
    }
    markFormsPristine(this.form);
    this.editing.set(true);
  }

  cancelEdit(): void {
    this.editing.set(false);
    this.error.set(null);
    markFormsPristine(this.form);
  }

  save(): void {
    const rx = this.prescription();
    if (!rx) return;
    if (!guardFormSubmit(this.form)) return;

    this.saving.set(true);
    this.error.set(null);
    const v = this.form.getRawValue();
    const items = this.form.get('items') as FormArray;

    this.api
      .update(rx.id, {
        diagnosis: v.diagnosis,
        notes: v.notes || undefined,
        followUpDate: v.followUpDate || undefined,
        items: medicationItemsToRequest(items.controls as FormGroup[]),
      })
      .subscribe({
        next: (updated) => {
          this.prescription.set(updated);
          this.editing.set(false);
          this.saving.set(false);
          markFormsPristine(this.form);
        },
        error: (err) => {
          this.error.set(extractApiErrorMessage(err, 'Failed to save prescription.'));
          this.saving.set(false);
        },
      });
  }

  listLink(): string {
    return roleRoute(this.router, 'prescriptions');
  }
}
