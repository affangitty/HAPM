import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { extractApiErrorMessage } from '../../../core/auth/utils/api-error.util';
import { AuthService } from '../../../core/auth/auth.service';
import { FormFieldComponent } from '../../../shared/components/forms/form-field/form-field.component';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiCardComponent, UiCardContentComponent } from '../../../shared/components/ui/card/ui-card.component';
import { UiSkeletonComponent } from '../../../shared/components/ui/skeleton/ui-skeleton.component';
import { UiTextareaComponent } from '../../../shared/components/ui/textarea/ui-textarea.component';
import { LabReportStatusBadgeComponent } from '../components/lab-report-status-badge.component';
import { ReportPreviewModalComponent } from '../components/report-preview-modal.component';
import { LabReportsApiService } from '../data/lab-reports-api.service';
import { LabReportDto } from '../models/lab-report.models';

@Component({
  selector: 'app-lab-report-detail-page',
  standalone: true,
  imports: [
    DatePipe, RouterLink, ReactiveFormsModule, UiCardComponent, UiCardContentComponent,
    UiButtonComponent, UiSkeletonComponent, LabReportStatusBadgeComponent,
    ReportPreviewModalComponent, FormFieldComponent, UiTextareaComponent,
  ],
  template: `
    <a [routerLink]="basePath() + '/lab-reports'" class="text-xs text-primary hover:underline">← Back to lab reports</a>

    @if (loading()) {
      <app-ui-skeleton class="mt-4 h-48" />
    } @else {
      @if (report(); as r) {
        <div class="mt-2 mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 class="text-xl font-bold">{{ r.title }}</h1>
            <p class="text-sm text-muted-foreground">{{ r.patientName }} · {{ r.reportType }}</p>
          </div>
          <app-lab-report-status-badge [status]="r.status" />
        </div>

        <app-ui-card class="mb-4">
          <app-ui-card-content class="grid gap-4 p-5 sm:grid-cols-2">
            <div><p class="text-xs text-muted-foreground">Patient</p><p class="font-medium">{{ r.patientName }}</p><p class="text-sm text-muted-foreground">MRN {{ r.medicalRecordNumber }}</p></div>
            <div><p class="text-xs text-muted-foreground">Doctor</p><p>{{ r.doctorName ?? '—' }}</p></div>
            <div><p class="text-xs text-muted-foreground">File</p><p>{{ r.fileName }}</p></div>
            <div><p class="text-xs text-muted-foreground">Uploaded</p><p>{{ r.uploadedAtUtc | date: 'medium' }}</p></div>
            @if (r.reviewRemarks) {
              <div class="sm:col-span-2"><p class="text-xs text-muted-foreground">Review remarks</p><p>{{ r.reviewRemarks }}</p></div>
            }
          </app-ui-card-content>
        </app-ui-card>

        <div class="flex flex-wrap gap-2">
          <app-ui-button (pressed)="openPreview()">Preview</app-ui-button>
          <a [routerLink]="viewerLink(r.id)"><app-ui-button variant="outline">Open viewer</app-ui-button></a>
          <app-ui-button variant="outline" [loading]="downloading()" (pressed)="download()">Download</app-ui-button>
        </div>

        @if (isDoctor() && r.status === 'Uploaded') {
          <app-ui-card class="mt-6 max-w-xl">
            <app-ui-card-content class="p-5">
              <h3 class="mb-3 font-semibold">Doctor review</h3>
              <form [formGroup]="reviewForm" (ngSubmit)="submitReview()">
                <app-form-field label="Remarks"><app-ui-textarea formControlName="remarks" [rows]="3" /></app-form-field>
                <app-ui-button type="submit" [loading]="reviewing()">Mark reviewed</app-ui-button>
              </form>
            </app-ui-card-content>
          </app-ui-card>
        }

        <app-report-preview-modal [open]="previewOpen()" [report]="r" [previewUrl]="previewUrl()"
          [loading]="previewLoading()" (close)="previewOpen.set(false)" (download)="download()" />
      }
    }
  `,
})
export class LabReportDetailPageComponent implements OnInit {
  private readonly api = inject(LabReportsApiService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly downloading = signal(false);
  readonly reviewing = signal(false);
  readonly previewOpen = signal(false);
  readonly previewLoading = signal(false);
  readonly previewUrl = signal<string | null>(null);
  readonly report = signal<LabReportDto | null>(null);
  readonly reviewForm = this.fb.nonNullable.group({ remarks: ['', [Validators.required, Validators.maxLength(2000)]] });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getById(id).subscribe({
      next: (r) => { this.report.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  isDoctor(): boolean { return this.auth.role() === 'Doctor'; }

  openPreview(): void {
    const r = this.report();
    if (!r) return;
    this.previewOpen.set(true);
    this.previewLoading.set(true);
    this.api.download(r.id).subscribe({
      next: (blob) => {
        this.previewUrl.set(URL.createObjectURL(blob));
        this.previewLoading.set(false);
      },
      error: () => this.previewLoading.set(false),
    });
  }

  download(): void {
    const r = this.report();
    if (!r) return;
    this.downloading.set(true);
    this.api.download(r.id).subscribe({
      next: (blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = r.fileName;
        a.click();
        this.downloading.set(false);
      },
      error: () => this.downloading.set(false),
    });
  }

  submitReview(): void {
    const r = this.report();
    if (!r || this.reviewForm.invalid) return;
    this.reviewing.set(true);
    this.api.review(r.id, { remarks: this.reviewForm.getRawValue().remarks }).subscribe({
      next: (updated) => { this.report.set(updated); this.reviewing.set(false); },
      error: () => this.reviewing.set(false),
    });
  }

  viewerLink(id: number): string { return `${this.basePath()}/lab-reports/${id}/view`; }
  basePath(): string { return `/${this.router.url.split('/').filter(Boolean)[0]}`; }
}
