import { Component, input } from '@angular/core';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormFieldComponent } from '../../../shared/components/forms/form-field/form-field.component';
import { UiInputComponent } from '../../../shared/components/ui/input/ui-input.component';
import { UiTextareaComponent } from '../../../shared/components/ui/textarea/ui-textarea.component';
import { getControlError } from '../../../shared/utils/form-errors.util';
import { MedicationFormRowsComponent } from '../../prescriptions/components/medication-form-rows.component';

@Component({
  selector: 'app-template-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormFieldComponent,
    UiInputComponent,
    UiTextareaComponent,
    MedicationFormRowsComponent,
  ],
  template: `
    <div class="space-y-5" [formGroup]="form()">
      <app-form-field label="Template name" [error]="err('name')">
        <app-ui-input formControlName="name" placeholder="e.g. Upper respiratory infection" />
      </app-form-field>

      <app-form-field label="Diagnosis" [error]="err('diagnosis')">
        <app-ui-textarea formControlName="diagnosis" [rows]="3" />
      </app-form-field>

      <app-form-field label="Notes">
        <app-ui-textarea formControlName="notes" [rows]="2" />
      </app-form-field>

      <div>
        <h3 class="mb-3 text-sm font-semibold">Medications</h3>
        <app-medication-form-rows [items]="itemsArray()" />
      </div>
    </div>
  `,
})
export class TemplateFormComponent {
  readonly form = input.required<FormGroup>();

  itemsArray(): FormArray<FormGroup> {
    return this.form().get('items') as FormArray<FormGroup>;
  }

  err(field: string): string | null {
    return getControlError(this.form().get(field));
  }
}
