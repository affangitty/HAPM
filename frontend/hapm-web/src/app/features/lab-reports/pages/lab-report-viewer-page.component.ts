import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiSkeletonComponent } from '../../../shared/components/ui/skeleton/ui-skeleton.component';
import { LabReportsApiService } from '../data/lab-reports-api.service';
import { LabReportDto } from '../models/lab-report.models';

@Component({
  selector: 'app-lab-report-viewer-page',
  standalone: true,
  imports: [RouterLink, UiButtonComponent, UiSkeletonComponent],
  template: `
    <a [routerLink]="detailLink()" class="text-xs text-primary hover:underline">← Back to report</a>

    @if (loading()) {
      <app-ui-skeleton class="mt-4 h-[70vh]" />
    } @else {
      @if (report(); as r) {
        <div class="mt-2 mb-4 flex items-center justify-between gap-3">
          <h1 class="text-lg font-bold">{{ r.title }}</h1>
          <app-ui-button size="sm" variant="outline" [loading]="downloading()" (pressed)="download()">Download</app-ui-button>
        </div>

        @if (previewUrl()) {
          @if (isImage(r.contentType)) {
            <img [src]="previewUrl()" [alt]="r.title" class="max-h-[75vh] w-full rounded-xl border object-contain" />
          } @else if (isPdf(r.contentType)) {
            <iframe [src]="previewUrl()" class="h-[75vh] w-full rounded-xl border" [title]="r.title"></iframe>
          } @else {
            <div class="flex h-64 items-center justify-center rounded-xl border bg-muted text-sm text-muted-foreground">
              Preview unavailable — download the file to view.
            </div>
          }
        }
      }
    }
  `,
})
export class LabReportViewerPageComponent implements OnInit {
  private readonly api = inject(LabReportsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly downloading = signal(false);
  readonly previewUrl = signal<string | null>(null);
  readonly report = signal<LabReportDto | null>(null);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getById(id).subscribe({
      next: (r) => {
        this.report.set(r);
        this.api.download(id).subscribe({
          next: (blob) => { this.previewUrl.set(URL.createObjectURL(blob)); this.loading.set(false); },
          error: () => this.loading.set(false),
        });
      },
      error: () => this.loading.set(false),
    });
  }

  isImage(t: string): boolean { return t.startsWith('image/'); }
  isPdf(t: string): boolean { return t === 'application/pdf'; }

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

  detailLink(): string {
    const id = this.route.snapshot.paramMap.get('id');
    return `${this.basePath()}/lab-reports/${id}`;
  }

  basePath(): string { return `/${this.router.url.split('/').filter(Boolean)[0]}`; }
}
