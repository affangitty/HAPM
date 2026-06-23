import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { AppointmentsHubService } from '../../../core/realtime/appointments-hub.service';
import { extractApiErrorMessage } from '../../../core/auth/utils/api-error.util';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { DataTableColumn } from '../../../shared/components/data-table/data-table.models';
import { FormFieldComponent } from '../../../shared/components/forms/form-field/form-field.component';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiCardComponent, UiCardContentComponent } from '../../../shared/components/ui/card/ui-card.component';
import { UiFilterBarComponent } from '../../../shared/components/ui/filter-bar/ui-filter-bar.component';
import { UiInputComponent } from '../../../shared/components/ui/input/ui-input.component';
import { UiPageHeaderComponent } from '../../../shared/components/ui/page-header/ui-page-header.component';
import { UiSelectComponent } from '../../../shared/components/ui/select/ui-select.component';
import { AppointmentStatus } from '../../../shared/models/enums';
import { DEFAULT_PAGE_SIZE } from '../../../shared/models/pagination.model';
import { debounce } from '../../../shared/utils/debounce.util';
import { AppointmentCalendarComponent } from '../components/appointment-calendar.component';
import { AppointmentsApiService } from '../data/appointments-api.service';
import { AppointmentDto, AppointmentViewMode } from '../models/appointment.models';

@Component({
  selector: 'app-appointment-list-page',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    UiPageHeaderComponent,
    UiFilterBarComponent,
    UiSelectComponent,
    UiInputComponent,
    FormFieldComponent,
    UiButtonComponent, UiCardComponent, UiCardContentComponent, DataTableComponent,
    AppointmentCalendarComponent,
  ],
  template: `
    <app-ui-page-header [title]="title()" subtitle="Search, filter, and manage appointments">
      <div actions class="flex items-center gap-2">
        <div class="flex items-center rounded-lg bg-muted p-0.5">
          <button type="button" class="rounded-md p-1.5 transition-all" [class]="view() === 'list' ? 'bg-card shadow-sm' : 'text-muted-foreground'" (click)="view.set('list')" aria-label="List view">
            <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
          </button>
          <button type="button" class="rounded-md p-1.5 transition-all" [class]="view() === 'calendar' ? 'bg-card shadow-sm' : 'text-muted-foreground'" (click)="view.set('calendar')" aria-label="Calendar view">
            <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
          </button>
        </div>
        <a actions [routerLink]="bookLink()">
          <app-ui-button size="sm">Book appointment</app-ui-button>
        </a>
      </div>
    </app-ui-page-header>

    <div class="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
      @for (stat of todayStats(); track stat.label) {
        <app-ui-card>
          <app-ui-card-content class="p-3 text-center">
            <p class="text-xl font-bold tabular-nums" [class]="stat.color">{{ stat.value }}</p>
            <p class="mt-0.5 text-xs text-muted-foreground">{{ stat.label }}</p>
          </app-ui-card-content>
        </app-ui-card>
      }
    </div>

    <app-ui-filter-bar searchPlaceholder="Search patient, doctor, MRN..." (searchChange)="onSearch($event)">
      <app-form-field label="Status" class="min-w-36">
        <app-ui-select [options]="statusOptions" [ngModel]="status()" (ngModelChange)="onStatus($event)" />
      </app-form-field>
      <app-form-field label="From" class="min-w-36">
        <app-ui-input type="date" [ngModel]="fromDate()" (ngModelChange)="onFromDate($event)" />
      </app-form-field>
      <app-form-field label="To" class="min-w-36">
        <app-ui-input type="date" [ngModel]="toDate()" (ngModelChange)="onToDate($event)" />
      </app-form-field>
    </app-ui-filter-bar>

    @if (view() === 'calendar') {
      <app-appointment-calendar
        [appointments]="calendarRows()"
        [month]="calendarMonth()"
        (monthChange)="calendarMonth.set($event)"
        (daySelected)="onDaySelected($event)"
      />
    } @else {
      @if (error()) {
        <p class="mb-4 text-sm text-destructive" role="alert">{{ error() }}</p>
      }
      <app-data-table
        [columns]="columns"
        [rows]="rows()"
        [loading]="loading()"
        [page]="page()"
        [pageSize]="pageSize"
        [totalCount]="totalCount()"
        [rowLink]="rowLink"
        (pageChange)="onPageChange($event)"
      />
    }
  `,
})
export class AppointmentListPageComponent implements OnInit {
  private readonly api = inject(AppointmentsApiService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly appointmentsHub = inject(AppointmentsHubService);
  private readonly destroyRef = inject(DestroyRef);

  readonly pageSize = DEFAULT_PAGE_SIZE;
  readonly page = signal(1);
  readonly totalCount = signal(0);
  readonly rows = signal<AppointmentDto[]>([]);
  readonly calendarRows = signal<AppointmentDto[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly view = signal<AppointmentViewMode>('list');
  readonly status = signal('');
  readonly fromDate = signal('');
  readonly toDate = signal('');
  readonly calendarMonth = signal(new Date());
  readonly todayStats = signal<{ label: string; value: number; color: string }[]>([]);
  search = '';

  readonly statusOptions = [
    { label: 'All', value: '' },
    { label: 'Pending', value: 'Pending' },
    { label: 'Confirmed', value: 'Confirmed' },
    { label: 'CheckedIn', value: 'CheckedIn' },
    { label: 'Completed', value: 'Completed' },
    { label: 'Cancelled', value: 'Cancelled' },
    { label: 'NoShow', value: 'NoShow' },
  ];

  readonly columns: DataTableColumn<AppointmentDto>[] = [
    { key: 'date', header: 'Date', cell: (r) => r.appointmentDate },
    { key: 'time', header: 'Time', cell: (r) => r.startTime },
    { key: 'patient', header: 'Patient', cell: (r) => r.patientName },
    { key: 'doctor', header: 'Doctor', cell: (r) => r.doctorName },
    { key: 'status', header: 'Status', cell: (r) => r.status },
  ];

  readonly rowLink = (row: AppointmentDto) => `${this.basePath()}/appointments/${row.id}`;

  private readonly debouncedLoad = debounce(() => this.load(), 300);

  ngOnInit(): void {
    this.load();
    this.loadCalendarMonth();
    this.loadTodayStats();
    this.wireRealtime();
  }

  private wireRealtime(): void {
    const role = this.auth.role();
    if (!role || role === 'Patient') return;

    this.appointmentsHub.received$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((updated) => {
      this.rows.update((list) => {
        const index = list.findIndex((a) => a.id === updated.id);
        if (index === -1) return list;
        const next = [...list];
        next[index] = updated;
        return next;
      });
      this.calendarRows.update((list) => {
        const index = list.findIndex((a) => a.id === updated.id);
        if (index === -1) return list;
        const next = [...list];
        next[index] = updated;
        return next;
      });
    });
  }

  title(): string {
    const base = this.basePath();
    if (base === '/doctor') return 'My Schedule';
    if (base === '/patient') return 'Appointments';
    return 'Appointment Management';
  }

  bookLink(): string {
    return `${this.basePath()}/appointments/book`;
  }

  onSearch(value: string): void {
    this.search = value;
    this.page.set(1);
    this.debouncedLoad();
  }

  onStatus(value: string): void {
    this.status.set(value);
    this.page.set(1);
    this.load();
    this.loadCalendarMonth();
  }

  onFromDate(value: string): void {
    this.fromDate.set(value);
    this.page.set(1);
    this.load();
    this.loadCalendarMonth();
  }

  onToDate(value: string): void {
    this.toDate.set(value);
    this.page.set(1);
    this.load();
    this.loadCalendarMonth();
  }

  onPageChange(page: number): void {
    this.page.set(page);
    this.load();
  }

  onDaySelected(date: string): void {
    this.fromDate.set(date);
    this.toDate.set(date);
    this.view.set('list');
    this.page.set(1);
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .list({
        page: this.page(),
        pageSize: this.pageSize,
        search: this.search || undefined,
        status: (this.status() || undefined) as AppointmentStatus | undefined,
        fromDate: this.fromDate() || undefined,
        toDate: this.toDate() || undefined,
        sortBy: 'date',
        sortDescending: true,
      })
      .subscribe({
        next: (result) => {
          this.rows.set(result.items);
          this.totalCount.set(result.totalCount);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(extractApiErrorMessage(err, 'Failed to load appointments.'));
          this.loading.set(false);
        },
      });
  }

  private loadCalendarMonth(): void {
    const month = this.calendarMonth();
    const from = new Date(month.getFullYear(), month.getMonth(), 1);
    const to = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    this.api
      .list({
        page: 1,
        pageSize: 100,
        status: (this.status() || undefined) as AppointmentStatus | undefined,
        fromDate: this.formatDate(from),
        toDate: this.formatDate(to),
        sortBy: 'date',
      })
      .subscribe({ next: (result) => this.calendarRows.set(result.items) });
  }

  private loadTodayStats(): void {
    const today = this.formatDate(new Date());
    this.api.list({ page: 1, pageSize: 200, fromDate: today, toDate: today }).subscribe({
      next: (result) => {
        const items = result.items;
        this.todayStats.set([
          { label: 'Total Today', value: items.length, color: 'text-blue-700' },
          { label: 'Confirmed', value: items.filter((a) => a.status === 'Confirmed').length, color: 'text-blue-700' },
          { label: 'In Progress', value: items.filter((a) => a.status === 'CheckedIn').length, color: 'text-teal-700' },
          { label: 'Pending', value: items.filter((a) => a.status === 'Pending').length, color: 'text-amber-700' },
          { label: 'Cancelled', value: items.filter((a) => a.status === 'Cancelled').length, color: 'text-red-700' },
        ]);
      },
    });
  }

  private formatDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private basePath(): string {
    return `/${this.router.url.split('/').filter(Boolean)[0]}`;
  }
}
