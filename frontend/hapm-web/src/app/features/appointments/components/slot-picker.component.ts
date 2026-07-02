import { Component, input, output } from '@angular/core';
import { AvailableSlotDto } from '../../doctors/models/doctor.models';

@Component({
  selector: 'app-slot-picker',
  standalone: true,
  template: `
    <div class="space-y-2">
      <p class="text-xs text-muted-foreground">Available slots for {{ date() }}</p>
      @if (error()) {
        <p class="text-sm text-destructive">{{ error() }}</p>
      } @else if (loading()) {
        <p class="text-sm text-muted-foreground">Loading slots...</p>
      } @else if (!slots().length) {
        <p class="text-sm text-muted-foreground">No slots available on this date.</p>
      } @else {
        <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          @for (slot of slots(); track slot.startTime) {
            <button
              type="button"
              class="rounded-lg border px-3 py-2 text-xs font-medium transition-colors"
              [class]="
                timesMatch(selectedTime(), slot.startTime)
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/40'
              "
              (click)="slotSelected.emit(slot.startTime)"
            >
              {{ formatTime(slot.startTime) }}
            </button>
          }
        </div>
      }
    </div>
  `,
})
export class SlotPickerComponent {
  readonly date = input('');
  readonly slots = input<AvailableSlotDto[]>([]);
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly selectedTime = input<string | null>(null);
  readonly slotSelected = output<string>();

  formatTime(time: string): string {
    const [h, m] = time.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, '0')} ${period}`;
  }

  timesMatch(selected: string | null, slotTime: string): boolean {
    if (!selected) return false;
    return this.normalizeTime(selected) === this.normalizeTime(slotTime);
  }

  private normalizeTime(time: string): string {
    const [h = '0', m = '0'] = time.split(':');
    return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
  }
}
