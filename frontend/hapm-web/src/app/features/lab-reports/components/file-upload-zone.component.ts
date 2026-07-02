import { Component, input, output, signal } from '@angular/core';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { LAB_REPORT_ACCEPT, LAB_REPORT_MAX_BYTES } from '../models/lab-report.models';

@Component({
  selector: 'app-file-upload-zone',
  standalone: true,
  imports: [UiButtonComponent],
  template: `
    <div
      class="rounded-xl border-2 border-dashed p-8 text-center transition-colors"
      [class]="dragOver() ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-blue-50/50'"
      (dragover)="onDragOver($event)"
      (dragleave)="dragOver.set(false)"
      (drop)="onDrop($event)"
    >
      <svg class="mx-auto mb-2 size-8 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" />
      </svg>
      <p class="text-sm font-medium">Drop report file here</p>
      <p class="mt-1 text-xs text-muted-foreground">PDF, DICOM, PNG, JPG — up to 10 MB</p>
      <input #fileInput id="lab-report-file" name="labReportFile" type="file" class="hidden" [accept]="accept" (change)="onFileSelect($event)" />
      <app-ui-button type="button" variant="outline" size="sm" class="mt-3" (pressed)="fileInput.click()">Browse files</app-ui-button>

      @if (selectedFile()) {
        <div class="mt-4 rounded-lg bg-muted px-3 py-2 text-left text-sm">
          <p class="font-medium">{{ selectedFile()!.name }}</p>
          <p class="text-xs text-muted-foreground">{{ formatSize(selectedFile()!.size) }}</p>
        </div>
      }

      @if (error()) {
        <p class="mt-2 text-sm text-destructive">{{ error() }}</p>
      }

      @if (uploading()) {
        <div class="mt-4">
          <div class="h-2 overflow-hidden rounded-full bg-muted">
            <div class="h-full bg-primary transition-all" [style.width.%]="progress()"></div>
          </div>
          <p class="mt-1 text-xs text-muted-foreground">Uploading to secure storage… {{ progress() }}%</p>
        </div>
      }
    </div>

    <div class="mt-3 flex items-start gap-2 rounded-xl bg-blue-50 p-3">
      <svg class="mt-0.5 size-4 shrink-0 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
      </svg>
      <p class="text-xs text-blue-700">Files are securely stored in Azure Blob Storage and encrypted at rest.</p>
    </div>
  `,
})
export class FileUploadZoneComponent {
  readonly accept = LAB_REPORT_ACCEPT;
  readonly uploading = input(false);
  readonly progress = input(0);
  readonly fileSelected = output<File>();
  readonly selectedFile = signal<File | null>(null);
  readonly dragOver = signal(false);
  readonly error = signal<string | null>(null);

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(true);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.pick(file);
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.pick(file);
  }

  private pick(file: File): void {
    this.error.set(null);
    if (file.size > LAB_REPORT_MAX_BYTES) {
      this.error.set('File exceeds 10 MB limit.');
      return;
    }
    this.selectedFile.set(file);
    this.fileSelected.emit(file);
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
