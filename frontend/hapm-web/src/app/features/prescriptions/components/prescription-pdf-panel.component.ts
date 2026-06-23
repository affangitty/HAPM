import { Component, input } from '@angular/core';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiCardComponent, UiCardContentComponent } from '../../../shared/components/ui/card/ui-card.component';
import { MedicationTableComponent } from './medication-table.component';
import { PrescriptionDto } from '../models/prescription.models';

@Component({
  selector: 'app-prescription-pdf-panel',
  standalone: true,
  imports: [UiCardComponent, UiCardContentComponent, UiButtonComponent, MedicationTableComponent],
  template: `
    <app-ui-card id="prescription-print-panel">
      <app-ui-card-content class="space-y-5 p-5 sm:p-8">
        <div class="flex flex-wrap items-start justify-between gap-4 border-b pb-4 print:border-black">
          <div>
            <p class="text-xs uppercase tracking-wide text-muted-foreground print:text-gray-600">HAPM Prescription</p>
            <h2 class="mt-1 text-xl font-bold">{{ prescription().patientName }}</h2>
            <p class="text-sm text-muted-foreground">MRN {{ prescription().medicalRecordNumber }}</p>
          </div>
          <div class="text-right text-sm">
            <p><span class="text-muted-foreground">Date:</span> {{ prescription().appointmentDate }}</p>
            <p><span class="text-muted-foreground">Rx #:</span> {{ prescription().id }}</p>
          </div>
        </div>

        <div class="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <p class="text-muted-foreground">Prescribing doctor</p>
            <p class="font-medium">{{ prescription().doctorName }}</p>
            <p class="text-muted-foreground">{{ prescription().specialization }}</p>
          </div>
          <div>
            <p class="text-muted-foreground">Follow-up</p>
            <p class="font-medium">{{ prescription().followUpDate || 'Not scheduled' }}</p>
          </div>
        </div>

        <div>
          <p class="mb-1 text-sm font-semibold">Diagnosis</p>
          <p class="text-sm">{{ prescription().diagnosis }}</p>
          @if (prescription().notes) {
            <p class="mt-2 text-sm text-muted-foreground">{{ prescription().notes }}</p>
          }
        </div>

        <div>
          <p class="mb-3 text-sm font-semibold">Medications</p>
          <app-medication-table [items]="prescription().items" />
        </div>
      </app-ui-card-content>
    </app-ui-card>

    <div class="mt-4 flex flex-wrap gap-2 print:hidden">
      <app-ui-button (pressed)="print()">Download / Print PDF</app-ui-button>
    </div>
  `,
  styles: `
    @media print {
      :host {
        display: block;
      }
      app-ui-card {
        border: none !important;
        box-shadow: none !important;
      }
    }
  `,
})
export class PrescriptionPdfPanelComponent {
  readonly prescription = input.required<PrescriptionDto>();

  print(): void {
    window.print();
  }
}
