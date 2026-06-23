import { Component, input } from '@angular/core';
import { UiCardComponent, UiCardContentComponent } from '../../../shared/components/ui/card/ui-card.component';
import { VitalSignDto } from '../models/vital.models';

@Component({
  selector: 'app-vital-reading-card',
  standalone: true,
  imports: [UiCardComponent, UiCardContentComponent],
  template: `
    <app-ui-card>
      <app-ui-card-content class="p-4">
        <div class="mb-3 flex items-center justify-between gap-2">
          <div>
            <p class="text-sm font-semibold">{{ reading().patientName }}</p>
            <p class="text-xs text-muted-foreground">{{ formatDate(reading().recordedAtUtc) }}</p>
          </div>
          @if (reading().bmi) {
            <span class="rounded-lg bg-muted px-2 py-1 text-xs font-medium">BMI {{ reading().bmi!.toFixed(1) }}</span>
          }
        </div>
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
          @if (reading().systolicBpMmHg && reading().diastolicBpMmHg) {
            <div><p class="text-xs text-muted-foreground">Blood pressure</p><p class="font-medium">{{ reading().systolicBpMmHg }}/{{ reading().diastolicBpMmHg }}</p></div>
          }
          @if (reading().pulseBpm) {
            <div><p class="text-xs text-muted-foreground">Pulse</p><p class="font-medium">{{ reading().pulseBpm }} bpm</p></div>
          }
          @if (reading().oxygenSaturationPercent) {
            <div><p class="text-xs text-muted-foreground">SpO₂</p><p class="font-medium">{{ reading().oxygenSaturationPercent }}%</p></div>
          }
          @if (reading().temperatureCelsius) {
            <div><p class="text-xs text-muted-foreground">Temperature</p><p class="font-medium">{{ reading().temperatureCelsius }}°C</p></div>
          }
          @if (reading().respiratoryRatePerMin) {
            <div><p class="text-xs text-muted-foreground">Resp. rate</p><p class="font-medium">{{ reading().respiratoryRatePerMin }}/min</p></div>
          }
          @if (reading().weightKg) {
            <div><p class="text-xs text-muted-foreground">Weight</p><p class="font-medium">{{ reading().weightKg }} kg</p></div>
          }
        </div>
      </app-ui-card-content>
    </app-ui-card>
  `,
})
export class VitalReadingCardComponent {
  readonly reading = input.required<VitalSignDto>();

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString();
  }
}
