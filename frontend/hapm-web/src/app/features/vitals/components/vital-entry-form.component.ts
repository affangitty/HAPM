import { Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormFieldComponent } from '../../../shared/components/forms/form-field/form-field.component';
import { UiInputComponent } from '../../../shared/components/ui/input/ui-input.component';
import { UiTextareaComponent } from '../../../shared/components/ui/textarea/ui-textarea.component';

@Component({
  selector: 'app-vital-entry-form',
  standalone: true,
  imports: [ReactiveFormsModule, FormFieldComponent, UiInputComponent, UiTextareaComponent],
  template: `
    <div class="grid gap-4 sm:grid-cols-2" [formGroup]="form()">
      <app-form-field label="Appointment ID" class="sm:col-span-2" [error]="err('appointmentId')">
        <app-ui-input type="number" formControlName="appointmentId" />
      </app-form-field>
      <app-form-field label="Temperature (°C)"><app-ui-input type="number" step="0.1" formControlName="temperatureCelsius" /></app-form-field>
      <app-form-field label="Pulse (bpm)"><app-ui-input type="number" formControlName="pulseBpm" /></app-form-field>
      <app-form-field label="Respiratory rate (/min)"><app-ui-input type="number" formControlName="respiratoryRatePerMin" /></app-form-field>
      <app-form-field label="SpO₂ (%)"><app-ui-input type="number" step="0.1" formControlName="oxygenSaturationPercent" /></app-form-field>
      <app-form-field label="Systolic BP"><app-ui-input type="number" formControlName="systolicBpMmHg" /></app-form-field>
      <app-form-field label="Diastolic BP"><app-ui-input type="number" formControlName="diastolicBpMmHg" /></app-form-field>
      <app-form-field label="Height (cm)"><app-ui-input type="number" step="0.1" formControlName="heightCm" /></app-form-field>
      <app-form-field label="Weight (kg)"><app-ui-input type="number" step="0.1" formControlName="weightKg" /></app-form-field>
      <app-form-field label="Notes" class="sm:col-span-2"><app-ui-textarea formControlName="notes" [rows]="3" /></app-form-field>
    </div>
  `,
})
export class VitalEntryFormComponent {
  readonly form = input.required<FormGroup>();

  err(field: string): string | null {
    const c = this.form().get(field);
    return c?.touched && c.invalid ? 'Required' : null;
  }
}
