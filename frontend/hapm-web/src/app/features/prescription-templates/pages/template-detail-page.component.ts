import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { extractApiErrorMessage } from '../../../core/auth/utils/api-error.util';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiCardComponent, UiCardContentComponent } from '../../../shared/components/ui/card/ui-card.component';
import { UiSkeletonComponent } from '../../../shared/components/ui/skeleton/ui-skeleton.component';
import { MedicationTableComponent } from '../../prescriptions/components/medication-table.component';
import { PrescriptionTemplatesApiService } from '../data/prescription-templates-api.service';
import { PrescriptionTemplateDto } from '../models/prescription-template.models';

@Component({
  selector: 'app-template-detail-page',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    UiCardComponent,
    UiCardContentComponent,
    UiButtonComponent,
    UiSkeletonComponent,
    MedicationTableComponent,
  ],
  template: `
    <a [routerLink]="basePath() + '/templates'" class="text-xs text-primary hover:underline">← Back to templates</a>

    @if (loading()) {
      <app-ui-skeleton class="mt-4 h-48" />
    } @else {
      @if (template(); as t) {
      <div class="mt-2 mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 class="text-xl font-bold">{{ t.name }}</h1>
          <p class="text-sm text-muted-foreground">Updated {{ (t.updatedAtUtc || t.createdAtUtc) | date: 'medium' }}</p>
        </div>
        <div class="flex gap-2">
          <a [routerLink]="editLink()"><app-ui-button size="sm" variant="outline">Edit</app-ui-button></a>
          <app-ui-button size="sm" variant="destructive" [loading]="deleting()" (pressed)="remove()">Delete</app-ui-button>
        </div>
      </div>

      <app-ui-card class="mb-6">
        <app-ui-card-content class="grid gap-4 p-5">
          <div>
            <p class="text-xs text-muted-foreground">Diagnosis</p>
            <p>{{ t.diagnosis }}</p>
          </div>
          @if (t.notes) {
            <div>
              <p class="text-xs text-muted-foreground">Notes</p>
              <p>{{ t.notes }}</p>
            </div>
          }
        </app-ui-card-content>
      </app-ui-card>

      <h2 class="mb-3 font-semibold">Medications</h2>
      <app-medication-table [items]="t.items" />

      @if (error()) {
        <p class="mt-3 text-sm text-destructive">{{ error() }}</p>
      }
      }
    }
  `,
})
export class TemplateDetailPageComponent implements OnInit {
  private readonly api = inject(PrescriptionTemplatesApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly deleting = signal(false);
  readonly error = signal<string | null>(null);
  readonly template = signal<PrescriptionTemplateDto | null>(null);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getById(id).subscribe({
      next: (template) => {
        this.template.set(template);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  remove(): void {
    const t = this.template();
    if (!t || !confirm('Delete this template?')) return;

    this.deleting.set(true);
    this.error.set(null);
    this.api.delete(t.id).subscribe({
      next: () => void this.router.navigate([`${this.basePath()}/templates`]),
      error: (err) => {
        this.error.set(extractApiErrorMessage(err, 'Failed to delete template.'));
        this.deleting.set(false);
      },
    });
  }

  editLink(): string {
    const id = this.route.snapshot.paramMap.get('id');
    return `${this.basePath()}/templates/${id}/edit`;
  }

  basePath(): string {
    return `/${this.router.url.split('/').filter(Boolean)[0]}`;
  }
}
