import { Component, inject, signal } from '@angular/core';
import { ApiErrorService } from '../../../core/api/api-error.service';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { getFormControlError, markFormGroupTouched, guardFormSubmit } from '../../../shared/utils/form-errors.util';
import { Router, RouterLink } from '@angular/router';
import { extractApiErrorMessage } from '../../../core/auth/utils/api-error.util';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiCardComponent, UiCardContentComponent } from '../../../shared/components/ui/card/ui-card.component';
import { UiPageHeaderComponent } from '../../../shared/components/ui/page-header/ui-page-header.component';
import { createMedicationGroup, medicationItemsToRequest } from '../../prescriptions/components/medication-form.util';
import { TemplateFormComponent } from '../components/template-form.component';
import { PrescriptionTemplatesApiService } from '../data/prescription-templates-api.service';
import { getRolePrefix, roleBase, roleRoute } from '../../../shared/utils/role-prefix.util';

@Component({
  selector: 'app-template-create-page',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    UiPageHeaderComponent,
    UiCardComponent,
    UiCardContentComponent,
    UiButtonComponent,
    TemplateFormComponent,
  ],
  template: `
    <app-ui-page-header title="Create Template" subtitle="Save a reusable prescription pattern" />

    <app-ui-card class="max-w-4xl">
      <app-ui-card-content class="p-5">
        <form [formGroup]="form" (ngSubmit)="submit()">
          <app-template-form [form]="form" />

          @if (error()) {
            <p class="mt-4 text-sm text-destructive">{{ error() }}</p>
          }

          <div class="mt-6 flex gap-2">
            <app-ui-button type="submit" [loading]="saving()">Create template</app-ui-button>
            <a [routerLink]="basePath() + '/templates'"><app-ui-button type="button" variant="outline">Cancel</app-ui-button></a>
          </div>
        </form>
      </app-ui-card-content>
    </app-ui-card>
  `,
})
export class TemplateCreatePageComponent {
  private readonly toasts = inject(ApiErrorService);

  private readonly api = inject(PrescriptionTemplatesApiService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    diagnosis: ['', [Validators.required, Validators.maxLength(1000)]],
    notes: ['', Validators.maxLength(2000)],
    items: this.fb.array([createMedicationGroup(this.fb)]),
  });

  submit(): void {
    markFormGroupTouched(this.form);
    if (!guardFormSubmit(this.form, this.toasts)) return;

    this.saving.set(true);
    this.error.set(null);
    const v = this.form.getRawValue();
    const items = this.form.get('items') as FormArray;

    this.api
      .create({
        name: v.name,
        diagnosis: v.diagnosis,
        notes: v.notes || undefined,
        items: medicationItemsToRequest(items.controls as FormGroup[]),
      })
      .subscribe({
        next: (template) => {
          this.saving.set(false);
          void this.router.navigate([roleRoute(this.router, 'templates', String(template.id))]);
        },
        error: (err) => {
          this.error.set(extractApiErrorMessage(err, 'Failed to create template.'));
          this.saving.set(false);
        },
      });
  }
  basePath(): string {
    return roleBase(this.router);
  }

}
