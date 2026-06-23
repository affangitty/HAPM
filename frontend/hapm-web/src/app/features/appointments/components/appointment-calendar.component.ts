import { Component, computed, input, output } from '@angular/core';
import { AppointmentDto } from '../models/appointment.models';

interface CalendarDay {
  date: string;
  label: number;
  inMonth: boolean;
  isToday: boolean;
  appointments: AppointmentDto[];
}

@Component({
  selector: 'app-appointment-calendar',
  standalone: true,
  template: `
    <div class="rounded-xl border bg-card">
      <div class="flex items-center justify-between border-b px-4 py-3">
        <button type="button" class="rounded-lg px-2 py-1 text-sm hover:bg-muted" (click)="shiftMonth(-1)">‹</button>
        <h3 class="text-sm font-semibold text-foreground">{{ monthLabel() }}</h3>
        <button type="button" class="rounded-lg px-2 py-1 text-sm hover:bg-muted" (click)="shiftMonth(1)">›</button>
      </div>

      <div class="grid grid-cols-7 gap-px bg-border p-px">
        @for (day of weekDays; track day) {
          <div class="bg-muted/40 px-1 py-2 text-center text-[11px] font-medium text-muted-foreground">{{ day }}</div>
        }
        @for (day of calendarDays(); track day.date) {
          <button
            type="button"
            class="min-h-20 bg-card p-1 text-left transition-colors hover:bg-muted/40"
            [class.opacity-40]="!day.inMonth"
            [class.ring-1]="day.isToday"
            [class.ring-primary]="day.isToday"
            (click)="daySelected.emit(day.date)"
          >
            <span class="text-xs font-medium text-foreground">{{ day.label }}</span>
            <div class="mt-1 space-y-0.5">
              @for (apt of day.appointments.slice(0, 2); track apt.id) {
                <div class="truncate rounded bg-blue-50 px-1 text-[10px] text-blue-700">
                  {{ apt.startTime }} {{ apt.patientName }}
                </div>
              }
              @if (day.appointments.length > 2) {
                <div class="text-[10px] text-muted-foreground">+{{ day.appointments.length - 2 }} more</div>
              }
            </div>
          </button>
        }
      </div>
    </div>
  `,
})
export class AppointmentCalendarComponent {
  readonly appointments = input<AppointmentDto[]>([]);
  readonly month = input(new Date());
  readonly daySelected = output<string>();
  readonly monthChange = output<Date>();

  readonly weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  readonly monthLabel = computed(() =>
    this.month().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
  );

  readonly calendarDays = computed(() => this.buildMonth(this.month(), this.appointments()));

  shiftMonth(delta: number): void {
    const next = new Date(this.month());
    next.setMonth(next.getMonth() + delta);
    this.monthChange.emit(next);
  }

  private buildMonth(viewDate: Date, appointments: AppointmentDto[]): CalendarDay[] {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const first = new Date(year, month, 1);
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay());

    const today = new Date();
    const days: CalendarDay[] = [];

    for (let i = 0; i < 42; i++) {
      const current = new Date(start);
      current.setDate(start.getDate() + i);
      const iso = this.toIsoDate(current);
      days.push({
        date: iso,
        label: current.getDate(),
        inMonth: current.getMonth() === month,
        isToday: current.toDateString() === today.toDateString(),
        appointments: appointments.filter((a) => a.appointmentDate === iso),
      });
    }

    return days;
  }

  private toIsoDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
