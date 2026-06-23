import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { extractApiErrorMessage } from '../../../core/auth/utils/api-error.util';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiCardComponent, UiCardContentComponent } from '../../../shared/components/ui/card/ui-card.component';
import { UiSkeletonComponent } from '../../../shared/components/ui/skeleton/ui-skeleton.component';
import { WaitlistStatusBadgeComponent } from '../components/waitlist-status-badge.component';
import { WaitlistApiService } from '../data/waitlist-api.service';
import { WaitlistEntryDto } from '../models/waitlist.models';
@Component({
  selector: 'app-waitlist-detail-page',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    UiCardComponent,
    UiCardContentComponent,
    UiButtonComponent,
    UiSkeletonComponent,
    WaitlistStatusBadgeComponent,
  ],
  template: `
    <a [routerLink]="basePath() + '/waitlist/list'" class="text-xs text-primary hover:underline">← Back to waitlist</a>

    @if (loading()) {
      <app-ui-skeleton class="mt-4 h-48" />
    } @else {
      @if (entry(); as e) {
      <div class="mt-2 mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 class="text-xl font-bold">Waitlist entry #{{ e.id }}</h1>
          <p class="text-sm text-muted-foreground">{{ e.doctorName }} · {{ e.preferredDate }}</p>
        </div>
        <app-waitlist-status-badge [status]="e.status" />
      </div>

      <app-ui-card class="mb-4">
        <app-ui-card-content class="grid gap-4 p-5 sm:grid-cols-2">
          <div>
            <p class="text-xs text-muted-foreground">Patient</p>
            <p class="font-medium">{{ e.patientName }}</p>
          </div>
          <div>
            <p class="text-xs text-muted-foreground">Doctor</p>
            <p class="font-medium">{{ e.doctorName }}</p>
            <p class="text-sm text-muted-foreground">{{ e.specialization }}</p>
          </div>
          <div>
            <p class="text-xs text-muted-foreground">Preferred date</p>
            <p class="font-medium">{{ e.preferredDate }}</p>
          </div>
          <div>
            <p class="text-xs text-muted-foreground">Joined</p>
            <p class="font-medium">{{ e.createdAtUtc | date: 'medium' }}</p>
          </div>
          @if (e.notifiedAtUtc) {
            <div>
              <p class="text-xs text-muted-foreground">Notified</p>
              <p class="font-medium">{{ e.notifiedAtUtc | date: 'medium' }}</p>
            </div>
          }
          @if (e.notes) {
            <div class="sm:col-span-2">
              <p class="text-xs text-muted-foreground">Notes</p>
              <p>{{ e.notes }}</p>
            </div>
          }
        </app-ui-card-content>
      </app-ui-card>

      <div class="flex flex-wrap gap-2">
        @if (e.status === 'Notified') {
          <a [routerLink]="promotionLink(e.id)">
            <app-ui-button>Start promotion workflow</app-ui-button>
          </a>
        }
        @if (e.status !== 'Cancelled') {
          <app-ui-button variant="outline" [loading]="cancelling()" (pressed)="cancel()">Cancel entry</app-ui-button>
        }
      </div>

      @if (error()) {
        <p class="mt-3 text-sm text-destructive">{{ error() }}</p>
      }
      }
    }
  `,
})
export class WaitlistDetailPageComponent implements OnInit {
  private readonly api = inject(WaitlistApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly cancelling = signal(false);
  readonly error = signal<string | null>(null);
  readonly entry = signal<WaitlistEntryDto | null>(null);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getById(id).subscribe({
      next: (entry) => {
        this.entry.set(entry);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Waitlist entry not found.');
        this.loading.set(false);
      },
    });
  }

  cancel(): void {
    const e = this.entry();
    if (!e) return;
    this.cancelling.set(true);
    this.error.set(null);
    this.api.cancel(e.id).subscribe({
      next: () => {
        this.entry.set({ ...e, status: 'Cancelled' });
        this.cancelling.set(false);
      },
      error: (err) => {
        this.error.set(extractApiErrorMessage(err, 'Failed to cancel waitlist entry.'));
        this.cancelling.set(false);
      },
    });
  }

  basePath(): string {
    return `/${this.router.url.split('/').filter(Boolean)[0]}`;
  }

  promotionLink(id: number): string {
    return `${this.basePath()}/waitlist/${id}/promotion`;
  }
}
