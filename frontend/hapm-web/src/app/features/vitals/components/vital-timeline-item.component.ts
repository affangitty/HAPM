import { Component, input, output } from '@angular/core';
import { VitalSignDto } from '../models/vital.models';

@Component({
  selector: 'app-vital-timeline-item',
  standalone: true,
  template: `
    <button type="button" class="flex w-full gap-4 rounded-xl border bg-card p-4 text-left transition-colors hover:bg-muted/40" (click)="selected.emit(reading())">
      <div class="flex flex-col items-center">
        <div class="size-3 rounded-full bg-primary"></div>
        <div class="mt-1 w-px flex-1 bg-border"></div>
      </div>
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <p class="font-medium">{{ reading().patientName }}</p>
          <p class="text-xs text-muted-foreground">{{ formatDate(reading().recordedAtUtc) }}</p>
        </div>
        <p class="mt-1 text-sm text-muted-foreground">
          @if (reading().systolicBpMmHg) { BP {{ reading().systolicBpMmHg }}/{{ reading().diastolicBpMmHg }} · }
          @if (reading().pulseBpm) { Pulse {{ reading().pulseBpm }} · }
          @if (reading().oxygenSaturationPercent) { SpO₂ {{ reading().oxygenSaturationPercent }}% }
        </p>
        @if (reading().notes) {
          <p class="mt-1 line-clamp-2 text-xs text-muted-foreground">{{ reading().notes }}</p>
        }
      </div>
    </button>
  `,
})
export class VitalTimelineItemComponent {
  readonly reading = input.required<VitalSignDto>();
  readonly selected = output<VitalSignDto>();

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString();
  }
}
