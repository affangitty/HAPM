import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiCardComponent, UiCardContentComponent } from '../../../shared/components/ui/card/ui-card.component';
import { UiSkeletonComponent } from '../../../shared/components/ui/skeleton/ui-skeleton.component';
import { WaitlistStatusBadgeComponent } from '../components/waitlist-status-badge.component';
import { WaitlistApiService } from '../data/waitlist-api.service';
import { WaitlistEntryDto } from '../models/waitlist.models';

@Component({
  selector: 'app-waitlist-promotion-page',
  standalone: true,
  imports: [
    RouterLink,
    UiCardComponent,
    UiCardContentComponent,
    UiButtonComponent,
    UiSkeletonComponent,
    WaitlistStatusBadgeComponent,
  ],
  template: `
    <a [routerLink]="detailLink()" class="text-xs text-primary hover:underline">← Back to entry</a>

    @if (loading()) {
      <app-ui-skeleton class="mt-4 h-64" />
    } @else {
      @if (entry(); as e) {
      <div class="mt-2 mb-4">
        <h1 class="text-xl font-bold">Promotion Workflow</h1>
        <p class="text-sm text-muted-foreground">A slot opened for {{ e.doctorName }} on {{ e.preferredDate }}</p>
      </div>

      <div class="mb-6 grid gap-3 sm:grid-cols-4">
        @for (step of steps; track step.id; let i = $index) {
          <div class="rounded-xl border p-4" [class]="stepClass(step.id)">
            <p class="text-xs font-medium text-muted-foreground">Step {{ i + 1 }}</p>
            <p class="mt-1 font-semibold">{{ step.label }}</p>
            <p class="mt-1 text-xs text-muted-foreground">{{ step.description }}</p>
          </div>
        }
      </div>

      <app-ui-card>
        <app-ui-card-content class="space-y-4 p-5">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="font-medium">{{ e.patientName }}</p>
              <p class="text-sm text-muted-foreground">{{ e.doctorName }} · {{ e.specialization }}</p>
            </div>
            <app-waitlist-status-badge [status]="e.status" />
          </div>

          @if (e.status === 'Notified') {
            <p class="text-sm">
              A cancellation freed a slot. Book an appointment now before it is taken by another patient.
            </p>
            <a [routerLink]="bookLink(e)">
              <app-ui-button>Book appointment</app-ui-button>
            </a>
          } @else if (e.status === 'Active') {
            <p class="text-sm text-muted-foreground">
              You are on the waitlist. You will be notified automatically when a matching slot becomes available.
            </p>
          } @else {
            <p class="text-sm text-muted-foreground">This waitlist entry has been cancelled.</p>
          }
        </app-ui-card-content>
      </app-ui-card>
      }
    }
  `,
})
export class WaitlistPromotionPageComponent implements OnInit {
  private readonly api = inject(WaitlistApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly entry = signal<WaitlistEntryDto | null>(null);

  readonly steps = [
    { id: 'joined', label: 'Joined waitlist', description: 'Patient added to queue' },
    { id: 'notified', label: 'Slot opened', description: 'Notification sent' },
    { id: 'book', label: 'Book appointment', description: 'Reserve the open slot' },
    { id: 'done', label: 'Complete', description: 'Appointment confirmed' },
  ];

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getById(id).subscribe({
      next: (entry) => {
        this.entry.set(entry);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  stepClass(stepId: string): string {
    const e = this.entry();
    if (!e) return '';
    const active =
      (stepId === 'joined' && e.status !== 'Cancelled') ||
      (stepId === 'notified' && (e.status === 'Notified' || e.notifiedAtUtc)) ||
      (stepId === 'book' && e.status === 'Notified');
  return active ? 'border-primary bg-primary/5' : 'bg-card';
  }

  bookLink(e: WaitlistEntryDto): string {
    return `${this.basePath()}/appointments/book?doctorId=${e.doctorId}&date=${e.preferredDate}`;
  }

  detailLink(): string {
    const id = this.route.snapshot.paramMap.get('id');
    return `${this.basePath()}/waitlist/${id}`;
  }

  basePath(): string {
    return `/${this.router.url.split('/').filter(Boolean)[0]}`;
  }
}
