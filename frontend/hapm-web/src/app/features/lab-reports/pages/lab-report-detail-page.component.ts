import { DatePipe } from '@angular/common';
import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiErrorService } from '../../../core/api/api-error.service';
import { extractApiErrorMessage } from '../../../core/auth/utils/api-error.util';
import { AuthService } from '../../../core/auth/auth.service';
import { FormFieldComponent } from '../../../shared/components/forms/form-field/form-field.component';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiCardComponent, UiCardContentComponent } from '../../../shared/components/ui/card/ui-card.component';
import { UiEmptyStateComponent } from '../../../shared/components/ui/empty-state/ui-empty-state.component';
import { UiInputComponent } from '../../../shared/components/ui/input/ui-input.component';
import { UiSelectComponent } from '../../../shared/components/ui/select/ui-select.component';
import { UiSkeletonComponent } from '../../../shared/components/ui/skeleton/ui-skeleton.component';
import { UiTextareaComponent } from '../../../shared/components/ui/textarea/ui-textarea.component';
import { HasUnsavedChanges } from '../../../core/guards/has-unsaved-changes';
import { initDetailRouteLoader } from '../../../shared/utils/detail-route.util';
import { bindUnsavedChangesProtection, formsAreDirty, markFormsPristine } from '../../../shared/utils/unsaved-changes.util';
import { roleRoute } from '../../../shared/utils/role-prefix.util';
import { LabReportStatusBadgeComponent } from '../components/lab-report-status-badge.component';
import { ReportPreviewModalComponent } from '../components/report-preview-modal.component';
import { FileUploadZoneComponent } from '../components/file-upload-zone.component';
import { LabReportsApiService } from '../data/lab-reports-api.service';
import { LabReportDto } from '../models/lab-report.models';

@Component({
  selector: 'app-lab-report-detail-page',
  standalone: true,
  imports: [
    DatePipe, RouterLink, ReactiveFormsModule, UiCardComponent, UiCardContentComponent,
    UiButtonComponent, UiSkeletonComponent, UiEmptyStateComponent, LabReportStatusBadgeComponent,
    ReportPreviewModalComponent, FormFieldComponent, UiTextareaComponent, UiInputComponent, UiSelectComponent,
    FileUploadZoneComponent,
  ],
  template: `
    <a [routerLink]="listLink()" class="text-xs text-primary hover:underline">← Back to lab reports</a>

    @if (loading()) {
      <app-ui-skeleton class="mt-4 h-48" />
    } @else if (notFound()) {
      <app-ui-empty-state class="mt-6 block" title="Lab report not found" message="This report may have been removed or you may not have access." />
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
          @if (canEditMetadata()) {
            <app-ui-button variant="outline" (pressed)="editing.set(!editing())">{{ editing() ? 'Cancel edit' : 'Edit metadata' }}</app-ui-button>
          }
          @if (isAdmin()) {
            <app-ui-button variant="destructive" [loading]="deleting()" (pressed)="deleteReport()">Delete</app-ui-button>
          }
        </div>

        @if (editing() && canEditMetadata()) {
          <app-ui-card class="mt-6 max-w-xl">
            <app-ui-card-content class="space-y-4 p-5">
              <h3 class="font-semibold">Edit report metadata</h3>
              <form [formGroup]="editForm" (ngSubmit)="saveMetadata()">
                <app-form-field label="Test name"><app-ui-input formControlName="title" /></app-form-field>
                <app-form-field label="Category"><app-ui-select formControlName="reportType" [options]="categoryOptions" /></app-form-field>
                <app-file-upload-zone [uploading]="updating()" (fileSelected)="replacementFile = $event" />
                <p class="text-xs text-muted-foreground">Leave file empty to keep the current attachment.</p>
                @if (editError()) { <p class="text-sm text-destructive">{{ editError() }}</p> }
                <app-ui-button type="submit" class="mt-2" [loading]="updating()">Save changes</app-ui-button>
              </form>
            </app-ui-card-content>
          </app-ui-card>
        }

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
export class LabReportDetailPageComponent implements HasUnsavedChanges {
  private readonly api = inject(LabReportsApiService);
  private readonly auth = inject(AuthService);
  private readonly toasts = inject(ApiErrorService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly routeState = initDetailRouteLoader('id', (id) => this.api.getById(id), this.destroyRef, {
    onLoaded: (report) => {
      this.editForm.patchValue({ title: report.title, reportType: report.reportType });
      markFormsPristine(this.editForm);
    },
  });

  readonly loading = this.routeState.loading;
  readonly notFound = this.routeState.notFound;
  readonly report = this.routeState.data;
  readonly downloading = signal(false);
  readonly reviewing = signal(false);
  readonly updating = signal(false);
  readonly deleting = signal(false);
  readonly editing = signal(false);
  readonly editError = signal<string | null>(null);
  readonly previewOpen = signal(false);
  readonly previewLoading = signal(false);
  readonly previewUrl = signal<string | null>(null);
  replacementFile: File | null = null;

  readonly categoryOptions = [
    'Hematology', 'Biochemistry', 'Endocrine', 'Cardiovascular', 'Respiratory', 'Microbiology', 'Radiology',
  ].map((c) => ({ label: c, value: c }));

  readonly reviewForm = this.fb.nonNullable.group({ remarks: ['', [Validators.required, Validators.maxLength(2000)]] });
  readonly editForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    reportType: ['Hematology', Validators.required],
  });

  constructor() {
    bindUnsavedChangesProtection(this.destroyRef, () => this.hasUnsavedChanges());
    let wasEditing = false;
    effect(() => {
      const isEditing = this.editing();
      if (wasEditing && !isEditing) {
        markFormsPristine(this.editForm);
      }
      wasEditing = isEditing;
    });
  }

  hasUnsavedChanges(): boolean {
    return (this.editing() && formsAreDirty(this.editForm)) || formsAreDirty(this.reviewForm);
  }

  isDoctor(): boolean { return this.auth.role() === 'Doctor'; }
  isAdmin(): boolean { return this.auth.role() === 'Admin'; }
  canEditMetadata(): boolean {
    const role = this.auth.role();
    return role === 'Admin' || role === 'Doctor' || role === 'Receptionist';
  }

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
      next: (updated) => {
        this.report.set(updated);
        this.reviewing.set(false);
        markFormsPristine(this.reviewForm);
      },
      error: () => this.reviewing.set(false),
    });
  }

  saveMetadata(): void {
    const r = this.report();
    if (!r || this.editForm.invalid) return;
    this.updating.set(true);
    this.editError.set(null);
    const v = this.editForm.getRawValue();
    this.api.update(r.id, {
      title: v.title,
      reportType: v.reportType,
      doctorId: r.doctorId,
      appointmentId: r.appointmentId,
      file: this.replacementFile ?? undefined,
    }).subscribe({
      next: (updated) => {
        this.report.set(updated);
        this.updating.set(false);
        this.editing.set(false);
        this.replacementFile = null;
        markFormsPristine(this.editForm);
        this.toasts.show('Report updated.', 'success');
      },
      error: (err) => {
        this.updating.set(false);
        this.editError.set(extractApiErrorMessage(err, 'Update failed.'));
      },
    });
  }

  deleteReport(): void {
    const r = this.report();
    if (!r || !confirm(`Delete lab report "${r.title}"? This cannot be undone.`)) return;
    this.deleting.set(true);
    this.api.delete(r.id).subscribe({
      next: () => {
        this.toasts.show('Lab report deleted.', 'success');
        void this.router.navigate([this.listLink()]);
      },
      error: (err) => {
        this.deleting.set(false);
        this.toasts.show(extractApiErrorMessage(err, 'Delete failed.'), 'error');
      },
    });
  }

  viewerLink(id: number): string { return `${roleRoute(this.router, 'lab-reports', String(id), 'view')}`; }
  listLink(): string { return roleRoute(this.router, 'lab-reports'); }
}
