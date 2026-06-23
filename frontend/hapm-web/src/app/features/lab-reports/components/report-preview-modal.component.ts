import { Component, input, output } from '@angular/core';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiDialogComponent } from '../../../shared/components/ui/dialog/ui-dialog.component';
import { LabReportDto } from '../models/lab-report.models';

@Component({
  selector: 'app-report-preview-modal',
  standalone: true,
  imports: [UiDialogComponent, UiButtonComponent],
  template: `
    <app-ui-dialog [open]="open()" [title]="report()?.title ?? 'Report preview'" size="xl" (close)="close.emit()">
      @if (report(); as r) {
        <div class="space-y-4">
          <div class="grid gap-3 text-sm sm:grid-cols-2">
            <div><span class="text-muted-foreground">Patient:</span> {{ r.patientName }}</div>
            <div><span class="text-muted-foreground">Type:</span> {{ r.reportType }}</div>
            <div><span class="text-muted-foreground">File:</span> {{ r.fileName }}</div>
            <div><span class="text-muted-foreground">Size:</span> {{ formatSize(r.fileSizeBytes) }}</div>
          </div>

          @if (previewUrl()) {
            @if (isImage(r.contentType)) {
              <img [src]="previewUrl()" [alt]="r.title" class="max-h-[60vh] w-full rounded-lg border object-contain" />
            } @else if (isPdf(r.contentType)) {
              <iframe [src]="previewUrl()" class="h-[60vh] w-full rounded-lg border" title="PDF preview"></iframe>
            } @else {
              <p class="rounded-lg border bg-muted p-6 text-center text-sm text-muted-foreground">
                Preview not available for this file type. Download to view.
              </p>
            }
          } @else if (loading()) {
            <div class="flex h-48 items-center justify-center rounded-lg border bg-muted">
              <span class="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></span>
            </div>
          }

          <div class="flex gap-2">
            <app-ui-button (pressed)="download.emit()">Download</app-ui-button>
            <app-ui-button variant="outline" (pressed)="close.emit()">Close</app-ui-button>
          </div>
        </div>
      }
    </app-ui-dialog>
  `,
})
export class ReportPreviewModalComponent {
  readonly open = input(false);
  readonly report = input<LabReportDto | null>(null);
  readonly previewUrl = input<string | null>(null);
  readonly loading = input(false);
  readonly close = output<void>();
  readonly download = output<void>();

  isImage(type: string): boolean {
    return type.startsWith('image/');
  }

  isPdf(type: string): boolean {
    return type === 'application/pdf';
  }

  formatSize(bytes: number): string {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
}
