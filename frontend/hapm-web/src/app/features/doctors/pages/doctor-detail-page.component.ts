import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { DataTableColumn } from '../../../shared/components/data-table/data-table.models';
import { FormFieldComponent } from '../../../shared/components/forms/form-field/form-field.component';
import { UiCardComponent, UiCardContentComponent } from '../../../shared/components/ui/card/ui-card.component';
import { UiInputComponent } from '../../../shared/components/ui/input/ui-input.component';
import { DEFAULT_PAGE_SIZE } from '../../../shared/models/pagination.model';
import { SlotPickerComponent } from '../../appointments/components/slot-picker.component';
import { DoctorsApiService } from '../data/doctors-api.service';
import {
  AvailableSlotDto,
  DoctorDetailTab,
  DoctorDto,
  DoctorScheduleDto,
  ReviewDto,
} from '../models/doctor.models';

@Component({
  selector: 'app-doctor-detail-page',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    UiCardComponent,
    UiCardContentComponent,
    UiInputComponent,
    FormFieldComponent,
    DataTableComponent,
    SlotPickerComponent,
  ],
  template: `
    @if (doctor(); as d) {
      <div class="mb-4">
        <a [routerLink]="listLink()" class="text-xs text-primary hover:underline">← Back to doctors</a>
        <h1 class="mt-2 text-xl font-bold text-foreground">{{ d.fullName }}</h1>
        <p class="text-sm text-muted-foreground">{{ d.specialization }} · {{ d.qualification }}</p>
      </div>

      <div class="mb-4 flex flex-wrap gap-2">
        @for (tab of tabs; track tab.id) {
          <button
            type="button"
            class="rounded-xl px-3 py-2 text-sm font-medium"
            [class]="activeTab() === tab.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'"
            (click)="setTab(tab.id)"
          >
            {{ tab.label }}
          </button>
        }
      </div>

      @if (activeTab() === 'overview') {
        <app-ui-card>
          <app-ui-card-content class="grid gap-4 p-5 sm:grid-cols-2">
            <div><p class="text-xs text-muted-foreground">Email</p><p class="text-sm">{{ d.email }}</p></div>
            <div><p class="text-xs text-muted-foreground">Phone</p><p class="text-sm">{{ d.phoneNumber ?? '—' }}</p></div>
            <div><p class="text-xs text-muted-foreground">License</p><p class="text-sm">{{ d.licenseNumber }}</p></div>
            <div><p class="text-xs text-muted-foreground">Experience</p><p class="text-sm">{{ d.experienceYears }} years</p></div>
            <div><p class="text-xs text-muted-foreground">Consultation fee</p><p class="text-sm">{{ '$' + d.consultationFee }}</p></div>
            <div><p class="text-xs text-muted-foreground">Room</p><p class="text-sm">{{ d.roomNumber ?? '—' }}</p></div>
            <div class="sm:col-span-2"><p class="text-xs text-muted-foreground">Biography</p><p class="text-sm">{{ d.biography ?? '—' }}</p></div>
          </app-ui-card-content>
        </app-ui-card>
      }

      @if (activeTab() === 'schedule') {
        <app-data-table
          [columns]="scheduleColumns"
          [rows]="schedules()"
          [showPagination]="false"
          emptyTitle="No schedule"
          emptyMessage="Weekly schedule has not been configured."
        />
      }

      @if (activeTab() === 'availability') {
        <app-ui-card>
          <app-ui-card-content class="space-y-4 p-5">
            <app-form-field label="Select date">
              <app-ui-input type="date" [ngModel]="slotDate()" (ngModelChange)="onSlotDate($event)" />
            </app-form-field>
            <app-slot-picker
              [date]="slotDate()"
              [slots]="slots()"
              [loading]="slotsLoading()"
              [selectedTime]="selectedSlot()"
              (slotSelected)="selectedSlot.set($event)"
            />
          </app-ui-card-content>
        </app-ui-card>
      }

      @if (activeTab() === 'reviews') {
        <app-data-table
          [columns]="reviewColumns"
          [rows]="reviews()"
          [loading]="reviewsLoading()"
          [page]="reviewPage()"
          [pageSize]="pageSize"
          [totalCount]="reviewTotal()"
          (pageChange)="onReviewPage($event)"
        />
      }
    }
  `,
})
export class DoctorDetailPageComponent implements OnInit {
  private readonly api = inject(DoctorsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly pageSize = DEFAULT_PAGE_SIZE;
  readonly doctor = signal<DoctorDto | null>(null);
  readonly schedules = signal<DoctorScheduleDto[]>([]);
  readonly slots = signal<AvailableSlotDto[]>([]);
  readonly slotsLoading = signal(false);
  readonly slotDate = signal(this.todayIso());
  readonly selectedSlot = signal<string | null>(null);
  readonly reviews = signal<ReviewDto[]>([]);
  readonly reviewsLoading = signal(false);
  readonly reviewPage = signal(1);
  readonly reviewTotal = signal(0);
  readonly activeTab = signal<DoctorDetailTab>('overview');

  readonly tabs = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'schedule' as const, label: 'Schedule' },
    { id: 'availability' as const, label: 'Availability' },
    { id: 'reviews' as const, label: 'Reviews' },
  ];

  readonly scheduleColumns: DataTableColumn<DoctorScheduleDto>[] = [
    { key: 'day', header: 'Day', cell: (r) => r.dayOfWeek },
    { key: 'start', header: 'Start', cell: (r) => r.startTime },
    { key: 'end', header: 'End', cell: (r) => r.endTime },
    { key: 'slot', header: 'Slot (min)', cell: (r) => r.slotDurationMinutes },
  ];

  readonly reviewColumns: DataTableColumn<ReviewDto>[] = [
    { key: 'patient', header: 'Patient', cell: (r) => r.patientName },
    { key: 'rating', header: 'Rating', cell: (r) => `${r.rating}/5` },
    { key: 'comment', header: 'Comment', cell: (r) => r.comment ?? '—' },
    { key: 'date', header: 'Date', cell: (r) => new Date(r.createdAtUtc).toLocaleDateString() },
  ];

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    const tab = this.route.snapshot.queryParamMap.get('tab') as DoctorDetailTab | null;
    if (tab) this.activeTab.set(tab);

    this.api.getById(id).subscribe({ next: (d) => this.doctor.set(d) });
    this.api.getSchedules(id).subscribe({ next: (s) => this.schedules.set(s) });
    this.loadReviews(id);
    this.loadSlots(id, this.slotDate());
  }

  setTab(tab: DoctorDetailTab): void {
    this.activeTab.set(tab);
    void this.router.navigate([], { queryParams: { tab }, queryParamsHandling: 'merge' });
  }

  onSlotDate(date: string): void {
    this.slotDate.set(date);
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadSlots(id, date);
  }

  onReviewPage(page: number): void {
    this.reviewPage.set(page);
    this.loadReviews(Number(this.route.snapshot.paramMap.get('id')));
  }

  listLink(): string {
    return `${this.basePath()}/doctors`;
  }

  private loadSlots(doctorId: number, date: string): void {
    this.slotsLoading.set(true);
    this.api.getAvailableSlots(doctorId, date).subscribe({
      next: (slots) => {
        this.slots.set(slots);
        this.slotsLoading.set(false);
      },
      error: () => this.slotsLoading.set(false),
    });
  }

  private loadReviews(doctorId: number): void {
    this.reviewsLoading.set(true);
    this.api
      .getReviews({ doctorId, page: this.reviewPage(), pageSize: this.pageSize, sortDescending: true })
      .subscribe({
        next: (result) => {
          this.reviews.set(result.items);
          this.reviewTotal.set(result.totalCount);
          this.reviewsLoading.set(false);
        },
        error: () => this.reviewsLoading.set(false),
      });
  }

  private basePath(): string {
    return `/${this.router.url.split('/').filter(Boolean)[0]}`;
  }

  private todayIso(): string {
    return new Date().toISOString().slice(0, 10);
  }
}