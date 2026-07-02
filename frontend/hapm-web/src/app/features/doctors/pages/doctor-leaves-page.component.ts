import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { HasUnsavedChanges } from '../../../core/guards/has-unsaved-changes';
import { bindUnsavedChangesProtection, formsAreDirty } from '../../../shared/utils/unsaved-changes.util';
import { DatePipe } from '@angular/common';
import { ApiErrorService } from '../../../core/api/api-error.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { setPageLoadFailed } from '../../../shared/utils/page-load.util';
import { extractApiErrorMessage } from '../../../core/auth/utils/api-error.util';
import { getFormControlError, guardFormSubmit } from '../../../shared/utils/form-errors.util';
import { MobileRecordCardComponent } from '../../../shared/components/mobile-record-card/mobile-record-card.component';
import { DoctorsApiService } from '../data/doctors-api.service';
import { DoctorLeaveDto } from '../models/doctor.models';
import { FormFieldComponent } from '../../../shared/components/forms/form-field/form-field.component';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiCardComponent, UiCardContentComponent } from '../../../shared/components/ui/card/ui-card.component';
import { UiInputComponent } from '../../../shared/components/ui/input/ui-input.component';
import { UiPageHeaderComponent } from '../../../shared/components/ui/page-header/ui-page-header.component';
import { UiTextareaComponent } from '../../../shared/components/ui/textarea/ui-textarea.component';

@Component({
  selector: 'app-doctor-leaves-page',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    UiPageHeaderComponent,
    UiCardComponent,
    UiCardContentComponent,
    FormFieldComponent,
    UiInputComponent,
    UiTextareaComponent,
    UiButtonComponent,
    MobileRecordCardComponent,
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
        @if (loading()) {
          <p class="text-sm text-muted-foreground">Loading leave records…</p>
        } @else if (loadError()) {
          <p class="text-sm text-destructive">{{ loadError() }}</p>
        } @else if (!leaves().length) {
          <p class="text-sm text-muted-foreground">You have no registered leave periods.</p>
        } @else {
          <div class="space-y-3 md:hidden">
            @for (leave of leaves(); track leave.id) {
              <app-mobile-record-card
                [title]="leave.startDate + ' → ' + leave.endDate"
                [subtitle]="leave.reason"
                [fields]="[
                  { label: 'Created', value: (leave.createdAtUtc | date: 'mediumDate') ?? '—' },
                ]"
              >
                <div class="mt-3">
                  <app-ui-button size="sm" variant="outline" [loading]="deletingId() === leave.id" (pressed)="deleteLeave(leave.id)">
                    Delete
                  </app-ui-button>
                </div>
              </app-mobile-record-card>
            }
          </div>
          <div class="hidden overflow-x-auto rounded-xl border border-border md:block">
            <table class="w-full text-left text-sm">
              <thead class="border-b bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th class="px-4 py-3">Start</th>
                  <th class="px-4 py-3">End</th>
                  <th class="px-4 py-3">Reason</th>
                  <th class="px-4 py-3">Created</th>
                  <th class="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                @for (leave of leaves(); track leave.id) {
                  <tr class="border-b border-border/70">
                    <td class="px-4 py-3">{{ leave.startDate }}</td>
                    <td class="px-4 py-3">{{ leave.endDate }}</td>
                    <td class="px-4 py-3">{{ leave.reason }}</td>
                    <td class="px-4 py-3">{{ leave.createdAtUtc | date: 'mediumDate' }}</td>
                    <td class="px-4 py-3">
                      <app-ui-button size="sm" variant="outline" [loading]="deletingId() === leave.id" (pressed)="deleteLeave(leave.id)">
                        Delete
                      </app-ui-button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `,
})
export class DoctorLeavesPageComponent implements OnInit, HasUnsavedChanges {
  private readonly toasts = inject(ApiErrorService);

  private readonly api = inject(DoctorsApiService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly leaves = signal<DoctorLeaveDto[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly deletingId = signal<number | null>(null);
  doctorId = 0;

  constructor() {
    bindUnsavedChangesProtection(this.destroyRef, () => this.hasUnsavedChanges());
  }

  hasUnsavedChanges(): boolean {
    return formsAreDirty(this.form);
  }

  readonly form = this.fb.nonNullable.group({
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    reason: ['', [Validators.required, Validators.maxLength(300)]],
  });

  ngOnInit(): void {
    this.loading.set(true);
    this.api.resolveCurrentDoctorId().subscribe({
      next: (id) => {
        this.doctorId = id;
        this.loadLeaves();
      },
      error: () => setPageLoadFailed(this.loading, this.loadError),
    });
  }

  fieldError(name: 'startDate' | 'endDate' | 'reason'): string | null {
    return getFormControlError(this.form, name, { maxlength: 'Max 300 characters.' });
  }

  submit(): void {
    if (!guardFormSubmit(this.form)) return;
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

  deleteLeave(leaveId: number): void {
    if (!confirm('Delete this leave record?')) return;
    this.deletingId.set(leaveId);
    this.api.deleteLeave(this.doctorId, leaveId).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.toasts.show('Leave record deleted.', 'success');
        this.loadLeaves();
      },
      error: (err) => {
        this.deletingId.set(null);
        this.toasts.show(extractApiErrorMessage(err, 'Failed to delete leave.'), 'error');
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
      error: () => setPageLoadFailed(this.loading, this.loadError),
    });
  }
}
