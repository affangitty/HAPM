import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { DataTableColumn } from '../../../shared/components/data-table/data-table.models';
import { FormFieldComponent } from '../../../shared/components/forms/form-field/form-field.component';
import { UiCardComponent, UiCardContentComponent } from '../../../shared/components/ui/card/ui-card.component';
import { UiEmptyStateComponent } from '../../../shared/components/ui/empty-state/ui-empty-state.component';
import { UiInputComponent } from '../../../shared/components/ui/input/ui-input.component';
import { UiSkeletonComponent } from '../../../shared/components/ui/skeleton/ui-skeleton.component';
import { UiTabsComponent } from '../../../shared/components/ui/tabs/ui-tabs.component';
import { DEFAULT_PAGE_SIZE } from '../../../shared/models/pagination.model';
import { initDetailRouteLoader } from '../../../shared/utils/detail-route.util';
import { roleRoute } from '../../../shared/utils/role-prefix.util';
import { AuthService } from '../../../core/auth/auth.service';
import { ApiErrorService } from '../../../core/api/api-error.service';
import { extractApiErrorMessage } from '../../../core/auth/utils/api-error.util';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { DoctorScheduleEditorComponent } from '../components/doctor-schedule-editor.component';
import { SlotPickerComponent } from '../../appointments/components/slot-picker.component';
import { DoctorsApiService } from '../data/doctors-api.service';
import { UiKpiCardComponent } from '../../../shared/components/ui/kpi-card/ui-kpi-card.component';
import { StarRatingComponent } from '../../reviews/components/star-rating.component';
import {
  AvailableSlotDto,
  DoctorDetailTab,
  DoctorPerformanceDto,
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
    UiSkeletonComponent,
    UiEmptyStateComponent,
    UiTabsComponent,
    FormFieldComponent,
    DataTableComponent,
    SlotPickerComponent,
    UiButtonComponent,
    DoctorScheduleEditorComponent,
    UiKpiCardComponent,
    StarRatingComponent,
  ],
  template: `
    <a [routerLink]="listLink()" class="text-xs text-primary hover:underline">← Back to doctors</a>

    @if (loading()) {
      <app-ui-skeleton class="mt-4 h-64" />
    } @else if (notFound()) {
      <app-ui-empty-state class="mt-6 block" title="Doctor not found" message="This doctor profile may have been removed." />
    } @else {
      @if (doctor(); as d) {
        <div class="mt-2 mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 class="text-xl font-bold text-foreground">{{ d.fullName }}</h1>
            <p class="text-sm text-muted-foreground">{{ d.specialization }} · {{ d.qualification }}</p>
          </div>
          @if (isAdmin() && d.isActive) {
            <a [routerLink]="editLink(d.id)"><app-ui-button variant="outline" size="sm">Edit profile</app-ui-button></a>
            <app-ui-button variant="destructive" size="sm" [loading]="deactivating()" (pressed)="deactivateDoctor()">
              Deactivate doctor
            </app-ui-button>
          }
        </div>

        <app-ui-tabs class="mb-4 block" [tabs]="tabs" [active]="activeTab()" ariaLabel="Doctor sections" (tabChange)="setTab($event)" />

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
          @if (isAdmin()) {
            <app-ui-card class="mb-4">
              <app-ui-card-content class="p-5">
                <h3 class="mb-4 font-semibold">Edit weekly schedule</h3>
                <app-doctor-schedule-editor
                  [doctorId]="d.id"
                  [schedules]="schedules()"
                  (saved)="schedules.set($event)"
                />
              </app-ui-card-content>
            </app-ui-card>
          }
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

        @if (activeTab() === 'performance') {
          @if (performanceLoading()) {
            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <app-ui-skeleton class="h-28" /><app-ui-skeleton class="h-28" />
              <app-ui-skeleton class="h-28" /><app-ui-skeleton class="h-28" />
            </div>
          } @else if (performance()) {
            <div class="space-y-4">
            <div class="mb-4 flex flex-wrap items-center gap-4">
              <app-star-rating [value]="performance()!.averageRating" [showValue]="true" />
              <p class="text-sm text-muted-foreground">
                {{ performance()!.reviewCount }} reviews · {{ performance()!.completedAppointments }} completed · {{ performance()!.prescriptionCount }} prescriptions
              </p>
            </div>
            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <app-ui-kpi-card title="Average rating" [value]="performance()!.averageRating.toFixed(1)" subtitle="out of 5" iconBg="bg-amber-50" iconColor="text-amber-500" iconPath="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              <app-ui-kpi-card title="Total revenue" [value]="'$' + performance()!.totalRevenue.toFixed(0)" iconBg="bg-emerald-50" iconColor="text-emerald-600" iconPath="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              <app-ui-kpi-card title="Distinct patients" [value]="formatCount(performance()!.distinctPatients)" iconBg="bg-blue-50" iconColor="text-blue-600" iconPath="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <app-ui-kpi-card title="No-show rate" [value]="performance()!.noShowRatePercent.toFixed(1) + '%'" iconBg="bg-red-50" iconColor="text-red-600" iconPath="M18 6 6 18M6 6l12 12" />
            </div>
            <app-ui-card class="mt-4">
              <app-ui-card-content class="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
                <div><p class="text-xs text-muted-foreground">Total appointments</p><p class="text-lg font-semibold">{{ performance()!.totalAppointments }}</p></div>
                <div><p class="text-xs text-muted-foreground">Completed</p><p class="text-lg font-semibold">{{ performance()!.completedAppointments }}</p></div>
                <div><p class="text-xs text-muted-foreground">Cancelled</p><p class="text-lg font-semibold">{{ performance()!.cancelledAppointments }}</p></div>
                <div><p class="text-xs text-muted-foreground">No-shows</p><p class="text-lg font-semibold">{{ performance()!.noShowAppointments }}</p></div>
              </app-ui-card-content>
            </app-ui-card>
            </div>
          }
        }
      }
    }
  `,
})
export class DoctorDetailPageComponent implements OnInit {
  private readonly api = inject(DoctorsApiService);
  private readonly auth = inject(AuthService);
  private readonly toasts = inject(ApiErrorService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly routeState = initDetailRouteLoader(
    'id',
    (id) => this.api.getById(id),
    this.destroyRef,
    {
      onLoaded: (doctor) => {
        this.api.getSchedules(doctor.id).subscribe({ next: (s) => this.schedules.set(s) });
        this.loadReviews(doctor.id);
        this.loadSlots(doctor.id, this.slotDate());
        if (this.activeTab() === 'performance') this.loadPerformance(doctor.id);
      },
    },
  );

  readonly pageSize = DEFAULT_PAGE_SIZE;
  readonly loading = this.routeState.loading;
  readonly notFound = this.routeState.notFound;
  readonly doctor = this.routeState.data;
  readonly schedules = signal<DoctorScheduleDto[]>([]);
  readonly slots = signal<AvailableSlotDto[]>([]);
  readonly slotsLoading = signal(false);
  readonly slotDate = signal(this.todayIso());
  readonly selectedSlot = signal<string | null>(null);
  readonly reviews = signal<ReviewDto[]>([]);
  readonly reviewsLoading = signal(false);
  readonly reviewPage = signal(1);
  readonly reviewTotal = signal(0);
  readonly performance = signal<DoctorPerformanceDto | null>(null);
  readonly performanceLoading = signal(false);
  readonly activeTab = signal<DoctorDetailTab>('overview');
  readonly deactivating = signal(false);

  readonly tabs = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'schedule' as const, label: 'Schedule' },
    { id: 'availability' as const, label: 'Availability' },
    { id: 'reviews' as const, label: 'Reviews' },
    { id: 'performance' as const, label: 'Performance' },
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
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const tab = params.get('tab') as DoctorDetailTab | null;
      if (tab) {
        this.activeTab.set(tab);
        const doc = this.doctor();
        if (doc && tab === 'performance' && !this.performance() && !this.performanceLoading())
          this.loadPerformance(doc.id);
      }
    });
  }

  setTab(tab: DoctorDetailTab): void {
    this.activeTab.set(tab);
    void this.router.navigate([], { queryParams: { tab }, queryParamsHandling: 'merge' });
    const doc = this.doctor();
    if (doc && tab === 'performance' && !this.performance() && !this.performanceLoading())
      this.loadPerformance(doc.id);
  }

  onSlotDate(date: string): void {
    this.slotDate.set(date);
    const doc = this.doctor();
    if (doc) this.loadSlots(doc.id, date);
  }

  onReviewPage(page: number): void {
    this.reviewPage.set(page);
    const doc = this.doctor();
    if (doc) this.loadReviews(doc.id);
  }

  listLink(): string {
    return roleRoute(this.router, 'doctors');
  }

  editLink(id: number): string {
    return roleRoute(this.router, 'doctors', String(id), 'edit');
  }

  isAdmin(): boolean {
    return this.auth.role() === 'Admin';
  }

  formatCount(v: number): string {
    return String(v);
  }

  deactivateDoctor(): void {
    const doc = this.doctor();
    if (!doc || !confirm(`Deactivate ${doc.fullName}? They will no longer appear in active directories.`)) return;
    this.deactivating.set(true);
    this.api.deactivate(doc.id).subscribe({
      next: () => {
        this.deactivating.set(false);
        this.toasts.show('Doctor deactivated.', 'success');
        void this.router.navigate([this.listLink()]);
      },
      error: (err) => {
        this.deactivating.set(false);
        this.toasts.show(extractApiErrorMessage(err, 'Failed to deactivate doctor.'), 'error');
      },
    });
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

  private loadPerformance(doctorId: number): void {
    this.performanceLoading.set(true);
    this.api.getPerformance(doctorId).subscribe({
      next: (p) => {
        this.performance.set(p);
        this.performanceLoading.set(false);
      },
      error: () => this.performanceLoading.set(false),
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

  private todayIso(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
