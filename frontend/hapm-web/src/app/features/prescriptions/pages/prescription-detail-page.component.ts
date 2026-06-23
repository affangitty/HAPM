import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { extractApiErrorMessage } from '../../../core/auth/utils/api-error.util';
import { AuthService } from '../../../core/auth/auth.service';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiCardComponent, UiCardContentComponent } from '../../../shared/components/ui/card/ui-card.component';
import { UiSkeletonComponent } from '../../../shared/components/ui/skeleton/ui-skeleton.component';
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
    MedicationTableComponent,
    PrescriptionFormComponent,
    PrescriptionPdfPanelComponent,
  ],
  template: `
    <a [routerLink]="basePath() + '/prescriptions'" class="text-xs text-primary hover:underline">← Back to prescriptions</a>

    @if (loading()) {
      <app-ui-skeleton class="mt-4 h-64" />
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
export class PrescriptionDetailPageComponent implements OnInit {
  private readonly api = inject(PrescriptionsApiService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly editing = signal(false);
  readonly error = signal<string | null>(null);
  readonly prescription = signal<PrescriptionDto | null>(null);

  readonly form = this.fb.nonNullable.group({
    diagnosis: ['', [Validators.required, Validators.maxLength(1000)]],
    notes: ['', Validators.maxLength(2000)],
    followUpDate: [''],
    items: this.fb.array([createMedicationGroup(this.fb)]),
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getById(id).subscribe({
      next: (rx) => {
        this.prescription.set(rx);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
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
    this.editing.set(true);
  }

  cancelEdit(): void {
    this.editing.set(false);
    this.error.set(null);
  }

  save(): void {
    const rx = this.prescription();
    if (!rx) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

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
        },
        error: (err) => {
          this.error.set(extractApiErrorMessage(err, 'Failed to save prescription.'));
          this.saving.set(false);
        },
      });
  }

  basePath(): string {
    return `/${this.router.url.split('/').filter(Boolean)[0]}`;
  }
}
