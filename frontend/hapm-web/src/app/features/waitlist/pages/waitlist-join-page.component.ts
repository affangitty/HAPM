import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { extractApiErrorMessage } from '../../../core/auth/utils/api-error.util';
import { AuthService } from '../../../core/auth/auth.service';
import { FormFieldComponent } from '../../../shared/components/forms/form-field/form-field.component';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiCardComponent, UiCardContentComponent } from '../../../shared/components/ui/card/ui-card.component';
import { UiInputComponent } from '../../../shared/components/ui/input/ui-input.component';
import { UiPageHeaderComponent } from '../../../shared/components/ui/page-header/ui-page-header.component';
import { UiSelectComponent } from '../../../shared/components/ui/select/ui-select.component';
import { UiTextareaComponent } from '../../../shared/components/ui/textarea/ui-textarea.component';
import { DoctorsApiService } from '../../doctors/data/doctors-api.service';
import { PatientsApiService } from '../../patients/data/patients-api.service';
import { WaitlistApiService } from '../data/waitlist-api.service';

@Component({
  selector: 'app-waitlist-join-page',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    UiPageHeaderComponent,
    UiCardComponent,
    UiCardContentComponent,
    FormFieldComponent,
    UiSelectComponent,
    UiInputComponent,
    UiTextareaComponent,
    UiButtonComponent,
  ],
  template: `
    <app-ui-page-header title="Join Waitlist" subtitle="Get notified when a slot opens for your preferred date" />

    <app-ui-card class="max-w-2xl">
      <app-ui-card-content class="p-5">
        <form class="space-y-4" [formGroup]="form" (ngSubmit)="submit()">
          <app-form-field label="Doctor" [error]="err('doctorId')">
            <app-ui-select formControlName="doctorId" [options]="doctorOptions()" placeholder="Select doctor" />
          </app-form-field>

          @if (isStaff()) {
            <app-form-field label="Patient" [error]="err('patientId')">
              <app-ui-select formControlName="patientId" [options]="patientOptions()" placeholder="Select patient" />
            </app-form-field>
          }

          <app-form-field label="Preferred date" [error]="err('preferredDate')">
            <app-ui-input type="date" formControlName="preferredDate" />
          </app-form-field>

          <app-form-field label="Notes">
            <app-ui-textarea formControlName="notes" [rows]="3" />
          </app-form-field>

          @if (error()) {
            <p class="text-sm text-destructive">{{ error() }}</p>
          }

          <div class="flex gap-2">
            <app-ui-button type="submit" [loading]="saving()">Join waitlist</app-ui-button>
            <a [routerLink]="basePath() + '/waitlist'"><app-ui-button type="button" variant="outline">Cancel</app-ui-button></a>
          </div>
        </form>
      </app-ui-card-content>
    </app-ui-card>
  `,
})
export class WaitlistJoinPageComponent implements OnInit {
  private readonly api = inject(WaitlistApiService);
  private readonly doctorsApi = inject(DoctorsApiService);
  private readonly patientsApi = inject(PatientsApiService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly doctorOptions = signal<{ label: string; value: string }[]>([]);
  readonly patientOptions = signal<{ label: string; value: string }[]>([]);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    doctorId: ['', Validators.required],
    patientId: [''],
    preferredDate: [new Date().toISOString().slice(0, 10), Validators.required],
    notes: ['', Validators.maxLength(500)],
  });

  ngOnInit(): void {
    this.doctorsApi.list({ page: 1, pageSize: 100, isAvailable: true, sortBy: 'name' }).subscribe({
      next: (result) =>
        this.doctorOptions.set(result.items.map((d) => ({ label: `${d.fullName} · ${d.specialization}`, value: String(d.id) }))),
    });

    if (this.isStaff()) {
      this.form.controls.patientId.addValidators(Validators.required);
      this.patientsApi.list({ page: 1, pageSize: 100, sortBy: 'name' }).subscribe({
        next: (result) =>
          this.patientOptions.set(result.items.map((p) => ({ label: `${p.fullName} (${p.medicalRecordNumber})`, value: String(p.id) }))),
      });
    }
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.saving.set(true);
    this.error.set(null);
    const v = this.form.getRawValue();

    this.api
      .join({
        doctorId: Number(v.doctorId),
        patientId: v.patientId ? Number(v.patientId) : undefined,
        preferredDate: v.preferredDate,
        notes: v.notes || undefined,
      })
      .subscribe({
        next: (entry) => {
          this.saving.set(false);
          void this.router.navigate([`${this.basePath()}/waitlist/${entry.id}`]);
        },
        error: (err) => {
          this.error.set(extractApiErrorMessage(err, 'Failed to join waitlist.'));
          this.saving.set(false);
        },
      });
  }

  isStaff(): boolean {
    const role = this.auth.role();
    return role === 'Admin' || role === 'Receptionist';
  }

  err(field: string): string | null {
    const ctrl = this.form.get(field);
    if (!ctrl || !ctrl.touched || !ctrl.invalid) return null;
    return 'Required';
  }

  basePath(): string {
    return `/${this.router.url.split('/').filter(Boolean)[0]}`;
  }
}
