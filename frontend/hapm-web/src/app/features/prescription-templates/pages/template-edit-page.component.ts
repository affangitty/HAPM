import { Component, inject, OnInit, signal } from '@angular/core';
import { ApiErrorService } from '../../../core/api/api-error.service';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { getFormControlError, markFormGroupTouched, guardFormSubmit } from '../../../shared/utils/form-errors.util';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { extractApiErrorMessage } from '../../../core/auth/utils/api-error.util';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiCardComponent, UiCardContentComponent } from '../../../shared/components/ui/card/ui-card.component';
import { UiPageHeaderComponent } from '../../../shared/components/ui/page-header/ui-page-header.component';
import { createMedicationGroup, medicationItemsToRequest } from '../../prescriptions/components/medication-form.util';
import { TemplateFormComponent } from '../components/template-form.component';
import { PrescriptionTemplatesApiService } from '../data/prescription-templates-api.service';
import { getRolePrefix, roleBase, roleRoute } from '../../../shared/utils/role-prefix.util';

@Component({
  selector: 'app-template-edit-page',
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
    <app-ui-page-header title="Edit Template" subtitle="Update saved diagnosis and medications" />

    <app-ui-card class="max-w-4xl">
      <app-ui-card-content class="p-5">
        <form [formGroup]="form" (ngSubmit)="submit()">
          <app-template-form [form]="form" />

          @if (error()) {
            <p class="mt-4 text-sm text-destructive">{{ error() }}</p>
          }

          <div class="mt-6 flex gap-2">
            <app-ui-button type="submit" [loading]="saving()">Save template</app-ui-button>
            <a [routerLink]="detailLink()"><app-ui-button type="button" variant="outline">Cancel</app-ui-button></a>
          </div>
        </form>
      </app-ui-card-content>
    </app-ui-card>
  `,
})
export class TemplateEditPageComponent implements OnInit {
  private readonly toasts = inject(ApiErrorService);

  private readonly api = inject(PrescriptionTemplatesApiService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  private templateId = 0;

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    diagnosis: ['', [Validators.required, Validators.maxLength(1000)]],
    notes: ['', Validators.maxLength(2000)],
    items: this.fb.array([createMedicationGroup(this.fb)]),
  });

  ngOnInit(): void {
    this.templateId = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getById(this.templateId).subscribe({
      next: (template) => {
        this.form.patchValue({
          name: template.name,
          diagnosis: template.diagnosis,
          notes: template.notes ?? '',
        });
        const items = this.form.get('items') as FormArray;
        items.clear();
        for (const item of template.items) {
          items.push(createMedicationGroup(this.fb, item));
        }
        if (!template.items.length) {
          items.push(createMedicationGroup(this.fb));
        }
      },
    });
  }

  submit(): void {
    markFormGroupTouched(this.form);
    if (!guardFormSubmit(this.form, this.toasts)) return;

    this.saving.set(true);
    this.error.set(null);
    const v = this.form.getRawValue();
    const items = this.form.get('items') as FormArray;

    this.api
      .update(this.templateId, {
        name: v.name,
        diagnosis: v.diagnosis,
        notes: v.notes || undefined,
        items: medicationItemsToRequest(items.controls as FormGroup[]),
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          void this.router.navigate([this.detailLink()]);
        },
        error: (err) => {
          this.error.set(extractApiErrorMessage(err, 'Failed to update template.'));
          this.saving.set(false);
        },
      });
  }

  detailLink(): string {
    return roleRoute(this.router, 'templates', String(this.templateId));
  }
}
