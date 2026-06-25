import { Component, inject, input } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormFieldComponent } from '../../../shared/components/forms/form-field/form-field.component';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiInputComponent } from '../../../shared/components/ui/input/ui-input.component';
import { UiTextareaComponent } from '../../../shared/components/ui/textarea/ui-textarea.component';
import { getControlError } from '../../../shared/utils/form-errors.util';
import { createMedicationGroup } from './medication-form.util';

@Component({
  selector: 'app-medication-form-rows',
  standalone: true,
  imports: [ReactiveFormsModule, FormFieldComponent, UiInputComponent, UiTextareaComponent, UiButtonComponent],
  template: `
    <div class="space-y-4">
      @for (group of items().controls; track $index; let i = $index) {
        <div class="rounded-xl border bg-card p-4" [formGroup]="asGroup(group)">
          <div class="mb-3 flex items-center justify-between gap-2">
            <p class="text-sm font-semibold">Medication {{ i + 1 }}</p>
            @if (items().length > 1) {
              <app-ui-button type="button" size="sm" variant="outline" (pressed)="remove(i)">Remove</app-ui-button>
            }
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <app-form-field label="Medicine name" class="sm:col-span-2" [error]="err(group, 'medicineName')">
              <app-ui-input formControlName="medicineName" placeholder="e.g. Amoxicillin" />
            </app-form-field>
            <app-form-field label="Dosage" [error]="err(group, 'dosage')">
              <app-ui-input formControlName="dosage" placeholder="e.g. 500mg" />
            </app-form-field>
            <app-form-field label="Frequency" [error]="err(group, 'frequency')">
              <app-ui-input formControlName="frequency" placeholder="e.g. Twice daily" />
            </app-form-field>
            <app-form-field label="Duration (days)" [error]="err(group, 'durationDays')">
              <app-ui-input type="number" formControlName="durationDays" min="1" max="365" />
            </app-form-field>
            <app-form-field label="Instructions" class="sm:col-span-2">
              <app-ui-textarea formControlName="instructions" [rows]="2" placeholder="Take after meals" />
            </app-form-field>
          </div>
        </div>
      }

      <app-ui-button type="button" variant="outline" size="sm" (pressed)="add()">Add medication</app-ui-button>
    </div>
  `,
})
export class MedicationFormRowsComponent {
  private readonly fb = inject(FormBuilder);

  readonly items = input.required<FormArray<FormGroup>>();

  add(): void {
    this.items().push(createMedicationGroup(this.fb));
  }

  remove(index: number): void {
    this.items().removeAt(index);
  }

  asGroup(control: unknown): FormGroup {
    return control as FormGroup;
  }

  err(group: unknown, field: string): string | null {
    return getControlError((group as FormGroup).get(field), {
      min: 'Must be 1–365 days.',
      max: 'Must be 1–365 days.',
    });
  }
}
