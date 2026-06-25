import { Component, inject, OnInit, signal } from '@angular/core';
import { ApiErrorService } from '../../../core/api/api-error.service';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { markFormGroupTouched, guardFormSubmit } from '../../../shared/utils/form-errors.util';
import { setPageLoadFailed } from '../../../shared/utils/page-load.util';
import { Router, RouterLink } from '@angular/router';
import { extractApiErrorMessage } from '../../../core/auth/utils/api-error.util';
import { AuthService } from '../../../core/auth/auth.service';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { DataTableColumn } from '../../../shared/components/data-table/data-table.models';
import { FormFieldComponent } from '../../../shared/components/forms/form-field/form-field.component';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiCardComponent, UiCardContentComponent } from '../../../shared/components/ui/card/ui-card.component';
import { UiFilterBarComponent } from '../../../shared/components/ui/filter-bar/ui-filter-bar.component';
import { UiInputComponent } from '../../../shared/components/ui/input/ui-input.component';
import { UiPageHeaderComponent } from '../../../shared/components/ui/page-header/ui-page-header.component';
import { UiSelectComponent } from '../../../shared/components/ui/select/ui-select.component';
import { UiTextareaComponent } from '../../../shared/components/ui/textarea/ui-textarea.component';
import { DEFAULT_PAGE_SIZE } from '../../../shared/models/pagination.model';
import { debounce } from '../../../shared/utils/debounce.util';
import { AppointmentsApiService } from '../../appointments/data/appointments-api.service';
import { toAppointmentSelectOptions } from '../../appointments/utils/appointment-picker.util';
import { DoctorsApiService } from '../../doctors/data/doctors-api.service';
import { PatientsApiService } from '../../patients/data/patients-api.service';
import { StarRatingComponent } from '../components/star-rating.component';
import { ReviewsApiService } from '../data/reviews-api.service';
import { ReviewDto } from '../models/review.models';
import { roleBase, roleRoute } from '../../../shared/utils/role-prefix.util';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-review-list-page',
  standalone: true,
  imports: [
    RouterLink, FormsModule, ReactiveFormsModule, UiPageHeaderComponent, UiFilterBarComponent,
    FormFieldComponent, UiSelectComponent, UiTextareaComponent,
    UiButtonComponent, DataTableComponent, StarRatingComponent,
    UiCardComponent, UiCardContentComponent,
  ],
  template: `
    <app-ui-page-header [title]="title()" subtitle="Doctor ratings and patient feedback">
      @if (isDoctor()) {
        <a actions [routerLink]="basePath() + '/performance/analytics'"><app-ui-button size="sm" variant="outline">Analytics</app-ui-button></a>
      }
    </app-ui-page-header>

    @if (isPatient()) {
      <app-ui-card class="mb-6 max-w-xl">
        <app-ui-card-content class="space-y-4 p-5">
          <h3 class="font-semibold">Submit a review</h3>
          <form class="space-y-3" [formGroup]="createForm" (ngSubmit)="submitReview()">
            <app-form-field label="Appointment">
              @if (reviewAppointmentOptions().length > 0) {
                <app-ui-select formControlName="appointmentId" [options]="reviewAppointmentOptions()" placeholder="Select a completed visit" />
              } @else {
                <p class="text-sm text-muted-foreground">No completed visits are available for review.</p>
              }
            </app-form-field>
            <app-form-field label="Rating"><app-star-rating [value]="rating()" [interactive]="true" (valueChange)="rating.set($event)" /></app-form-field>
            <app-form-field label="Comment"><app-ui-textarea formControlName="comment" [rows]="3" /></app-form-field>
            @if (error()) { <p class="text-sm text-destructive">{{ error() }}</p> }
            <app-ui-button type="submit" [loading]="saving()" [disabled]="!reviewAppointmentOptions().length">Submit review</app-ui-button>
          </form>
        </app-ui-card-content>
      </app-ui-card>
    }

    <app-ui-filter-bar searchPlaceholder="Search doctor or patient..." (searchChange)="onSearch($event)">
      <app-form-field label="Min rating" class="min-w-36">
        <app-ui-select [options]="ratingOptions" [ngModel]="minRating()" (ngModelChange)="onMinRating($event)" />
      </app-form-field>
    </app-ui-filter-bar>

    <app-data-table [columns]="columns" [rows]="rows()" [loading]="loading()" [page]="page()"
      [pageSize]="pageSize" [totalCount]="totalCount()" [rowLink]="rowLink"
      emptyTitle="No reviews" emptyMessage="Reviews will appear after completed appointments."
      (pageChange)="onPageChange($event)" />
  `,
})
export class ReviewListPageComponent implements OnInit {
  private readonly toasts = inject(ApiErrorService);
  private readonly api = inject(ReviewsApiService);
  private readonly doctorsApi = inject(DoctorsApiService);
  private readonly patientsApi = inject(PatientsApiService);
  private readonly appointmentsApi = inject(AppointmentsApiService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly pageSize = DEFAULT_PAGE_SIZE;
  readonly page = signal(1);
  readonly totalCount = signal(0);
  readonly rows = signal<ReviewDto[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly minRating = signal('');
  readonly rating = signal(5);
  readonly reviewAppointmentOptions = signal<{ label: string; value: string }[]>([]);
  search = '';
  private doctorId: number | null = null;

  readonly ratingOptions = [
    { label: 'All ratings', value: '' }, { label: '5 stars', value: '5' },
    { label: '4+ stars', value: '4' }, { label: '3+ stars', value: '3' },
  ];

  readonly createForm = this.fb.nonNullable.group({
    appointmentId: ['', Validators.required],
    comment: ['', Validators.maxLength(1000)],
  });

  readonly columns: DataTableColumn<ReviewDto>[] = [
    { key: 'doctor', header: 'Doctor', cell: (r) => r.doctorName },
    { key: 'patient', header: 'Patient', cell: (r) => r.patientName },
    { key: 'rating', header: 'Rating', cell: (r) => '★'.repeat(r.rating) },
    { key: 'comment', header: 'Comment', cell: (r) => r.comment ?? '—' },
    { key: 'date', header: 'Date', cell: (r) => new Date(r.createdAtUtc).toLocaleDateString() },
  ];

  readonly rowLink = (r: ReviewDto) => roleRoute(this.router, this.reviewSegment(), String(r.id));
  private readonly debouncedLoad = debounce(() => this.load(), 250);

  ngOnInit(): void {
    if (this.isPatient()) this.loadReviewableAppointments();

    if (this.isDoctor()) {
      this.doctorsApi.getCurrentDoctor().subscribe({
        next: (d) => { this.doctorId = d.id; this.load(); },
        error: () => this.load(),
      });
    } else {
      this.load();
    }
  }

  title(): string { return this.isDoctor() ? 'My Reviews' : 'Reviews'; }
  isPatient(): boolean { return this.auth.role() === 'Patient'; }
  isDoctor(): boolean { return this.auth.role() === 'Doctor'; }
  reviewSegment(): string { return this.isDoctor() ? 'performance/reviews' : 'reviews'; }

  onSearch(v: string): void {
    this.search = v.trim();
    this.page.set(1);
    this.debouncedLoad();
  }

  onMinRating(v: string): void { this.minRating.set(v); this.page.set(1); this.load(); }
  onPageChange(p: number): void { this.page.set(p); this.load(); }

  submitReview(): void {
    markFormGroupTouched(this.createForm);
    if (!guardFormSubmit(this.createForm, this.toasts)) return;
    this.saving.set(true);
    const v = this.createForm.getRawValue();
    this.api.create({ appointmentId: Number(v.appointmentId), rating: this.rating(), comment: v.comment || undefined }).subscribe({
      next: () => {
        this.saving.set(false);
        this.createForm.reset();
        this.loadReviewableAppointments();
        this.load();
      },
      error: (err) => { this.error.set(extractApiErrorMessage(err, 'Failed to submit review.')); this.saving.set(false); },
    });
  }

  private load(): void {
    this.loading.set(true);
    this.api.list({
      page: this.page(),
      pageSize: this.pageSize,
      search: this.search || undefined,
      doctorId: this.doctorId ?? undefined,
      minRating: this.minRating() ? Number(this.minRating()) : undefined,
    }).subscribe({
      next: (r) => {
        this.rows.set(r.items);
        this.totalCount.set(r.totalCount);
        this.loading.set(false);
      },
      error: () => setPageLoadFailed(this.loading, this.loadError),
    });
  }

  private loadReviewableAppointments(): void {
    this.patientsApi.getMyProfile().subscribe({
      next: (patient) => {
        forkJoin({
          completed: this.appointmentsApi.list({ page: 1, pageSize: 100, patientId: patient.id, status: 'Completed' }),
          reviews: this.api.list({ page: 1, pageSize: 200 }),
        }).subscribe({
          next: ({ completed, reviews }) => {
            const reviewedIds = new Set(reviews.items.map((r) => r.appointmentId));
            const options = toAppointmentSelectOptions(completed.items, {
              patientId: patient.id,
              statuses: ['Completed'],
              excludeAppointmentIds: reviewedIds,
            });
            this.reviewAppointmentOptions.set(options);
            if (options.length === 1) this.createForm.controls.appointmentId.setValue(options[0].value);
          },
        });
      },
    });
  }

  basePath(): string {
    return roleBase(this.router);
  }
}
