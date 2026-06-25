import { Component, inject, input, OnChanges, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiErrorService } from '../../../core/api/api-error.service';
import { extractApiErrorMessage } from '../../../core/auth/utils/api-error.util';
import { FormFieldComponent } from '../../../shared/components/forms/form-field/form-field.component';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiInputComponent } from '../../../shared/components/ui/input/ui-input.component';
import { UiSelectComponent } from '../../../shared/components/ui/select/ui-select.component';
import { DoctorsApiService } from '../data/doctors-api.service';
import { DayOfWeek, DoctorScheduleDto, ScheduleSlotRequest } from '../models/doctor.models';

@Component({
  selector: 'app-doctor-schedule-editor',
  standalone: true,
  imports: [FormsModule, FormFieldComponent, UiInputComponent, UiSelectComponent, UiButtonComponent],
  template: `
    <div class="space-y-4">
      @for (row of slotRows(); track $index) {
        <div class="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-5">
          <app-form-field label="Day">
            <app-ui-select [options]="dayOptions" [ngModel]="row.dayOfWeek" (ngModelChange)="patchRow($index, 'dayOfWeek', $event)" />
          </app-form-field>
          <app-form-field label="Start">
            <app-ui-input type="time" [ngModel]="row.startTime" (ngModelChange)="patchRow($index, 'startTime', $event)" />
          </app-form-field>
          <app-form-field label="End">
            <app-ui-input type="time" [ngModel]="row.endTime" (ngModelChange)="patchRow($index, 'endTime', $event)" />
          </app-form-field>
          <app-form-field label="Slot (min)">
            <app-ui-input type="number" [ngModel]="row.slotDurationMinutes" (ngModelChange)="patchRow($index, 'slotDurationMinutes', +$event)" />
          </app-form-field>
          <div class="flex items-end">
            <app-ui-button type="button" variant="outline" size="sm" (pressed)="removeRow($index)">Remove</app-ui-button>
          </div>
        </div>
      }

      <div class="flex flex-wrap gap-2">
        <app-ui-button type="button" variant="outline" size="sm" (pressed)="addRow()">Add slot</app-ui-button>
        <app-ui-button size="sm" [loading]="saving()" (pressed)="save()">Save schedule</app-ui-button>
      </div>

      @if (error()) {
        <p class="text-sm text-destructive" role="alert">{{ error() }}</p>
      }
    </div>
  `,
})
export class DoctorScheduleEditorComponent implements OnChanges {
  private readonly api = inject(DoctorsApiService);
  private readonly toasts = inject(ApiErrorService);

  readonly doctorId = input.required<number>();
  readonly schedules = input<DoctorScheduleDto[]>([]);
  readonly saved = output<DoctorScheduleDto[]>();

  readonly slotRows = signal<ScheduleSlotRequest[]>([]);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly dayOptions = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
  ].map((d) => ({ label: d, value: d }));

  ngOnChanges(): void {
    const rows = this.schedules().map((s) => ({
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime.slice(0, 5),
      endTime: s.endTime.slice(0, 5),
      slotDurationMinutes: s.slotDurationMinutes,
    }));
    this.slotRows.set(rows.length ? rows : [this.emptyRow()]);
  }

  addRow(): void {
    this.slotRows.update((rows) => [...rows, this.emptyRow()]);
  }

  removeRow(index: number): void {
    this.slotRows.update((rows) => rows.filter((_, i) => i !== index));
  }

  patchRow(index: number, key: keyof ScheduleSlotRequest, value: string | number): void {
    this.slotRows.update((rows) =>
      rows.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    );
  }

  save(): void {
    const rows = this.slotRows().filter((r) => r.startTime && r.endTime);
    if (!rows.length) {
      this.error.set('Add at least one schedule slot.');
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.api.setSchedules(this.doctorId(), rows).subscribe({
      next: (updated) => {
        this.saving.set(false);
        this.toasts.show('Schedule updated.', 'success');
        this.saved.emit(updated);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(extractApiErrorMessage(err, 'Failed to save schedule.'));
      },
    });
  }

  private emptyRow(): ScheduleSlotRequest {
    return {
      dayOfWeek: 'Monday' as DayOfWeek,
      startTime: '09:00',
      endTime: '17:00',
      slotDurationMinutes: 30,
    };
  }
}
