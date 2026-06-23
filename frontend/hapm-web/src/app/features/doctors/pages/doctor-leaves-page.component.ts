import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { extractApiErrorMessage } from '../../../core/auth/utils/api-error.util';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { DataTableColumn } from '../../../shared/components/data-table/data-table.models';
import { FormFieldComponent } from '../../../shared/components/forms/form-field/form-field.component';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiCardComponent, UiCardContentComponent } from '../../../shared/components/ui/card/ui-card.component';
import { UiInputComponent } from '../../../shared/components/ui/input/ui-input.component';
import { UiPageHeaderComponent } from '../../../shared/components/ui/page-header/ui-page-header.component';
import { UiTextareaComponent } from '../../../shared/components/ui/textarea/ui-textarea.component';
import { DoctorsApiService } from '../data/doctors-api.service';
import { DoctorLeaveDto } from '../models/doctor.models';

@Component({
  selector: 'app-doctor-leaves-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    UiPageHeaderComponent,
    UiCardComponent,
    UiCardContentComponent,
    FormFieldComponent,
    UiInputComponent,
    UiTextareaComponent,
    UiButtonComponent,
    DataTableComponent,
  ],
  template: `
    <app-ui-page-header title="Leave Management" subtitle="Register and manage your leave periods" />

    <div class="grid gap-4 lg:grid-cols-3">
      <app-ui-card class="lg:col-span-1">
        <app-ui-card-content class="space-y-4 p-5">
          <h2 class="text-sm font-semibold">Request leave</h2>
          <form class="space-y-3" [formGroup]="form" (ngSubmit)="submit()">
            <app-form-field label="Start date" [error]="fieldError('startDate')">
              <app-ui-input type="date" formControlName="startDate" />
            </app-form-field>
            <app-form-field label="End date" [error]="fieldError('endDate')">
              <app-ui-input type="date" formControlName="endDate" />
            </app-form-field>
            <app-form-field label="Reason" [error]="fieldError('reason')">
              <app-ui-textarea formControlName="reason" [rows]="3" />
            </app-form-field>
            @if (error()) {
              <p class="text-sm text-destructive">{{ error() }}</p>
            }
            <app-ui-button type="submit" class="w-full" [loading]="saving()">Submit leave</app-ui-button>
          </form>
        </app-ui-card-content>
      </app-ui-card>

      <div class="lg:col-span-2">
        <app-data-table
          [columns]="columns"
          [rows]="leaves()"
          [loading]="loading()"
          [showPagination]="false"
          emptyTitle="No leave records"
          emptyMessage="You have no registered leave periods."
        />
      </div>
    </div>
  `,
})
export class DoctorLeavesPageComponent implements OnInit {
  private readonly api = inject(DoctorsApiService);
  private readonly fb = inject(FormBuilder);

  readonly leaves = signal<DoctorLeaveDto[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  doctorId = 0;

  readonly form = this.fb.nonNullable.group({
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    reason: ['', [Validators.required, Validators.maxLength(300)]],
  });

  readonly columns: DataTableColumn<DoctorLeaveDto>[] = [
    { key: 'start', header: 'Start', cell: (r) => r.startDate },
    { key: 'end', header: 'End', cell: (r) => r.endDate },
    { key: 'reason', header: 'Reason', cell: (r) => r.reason },
    { key: 'created', header: 'Created', cell: (r) => new Date(r.createdAtUtc).toLocaleDateString() },
  ];

  ngOnInit(): void {
    this.loading.set(true);
    this.api.resolveCurrentDoctorId().subscribe({
      next: (id) => {
        this.doctorId = id;
        this.loadLeaves();
      },
      error: () => this.loading.set(false),
    });
  }

  fieldError(name: 'startDate' | 'endDate' | 'reason'): string | null {
    const c = this.form.controls[name];
    if (!c.touched || !c.errors) return null;
    if (c.errors['required']) return 'Required.';
    if (c.errors['maxlength']) return 'Max 300 characters.';
    return null;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.api.createLeave(this.doctorId, this.form.getRawValue()).subscribe({
      next: () => {
        this.form.reset();
        this.saving.set(false);
        this.loadLeaves();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(extractApiErrorMessage(err, 'Unable to create leave.'));
      },
    });
  }

  private loadLeaves(): void {
    this.loading.set(true);
    this.api.getLeaves(this.doctorId).subscribe({
      next: (items) => {
        this.leaves.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
