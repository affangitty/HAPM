import { Component, inject, input, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { UiCardComponent, UiCardContentComponent } from '../../../shared/components/ui/card/ui-card.component';
import { UiSkeletonComponent } from '../../../shared/components/ui/skeleton/ui-skeleton.component';
import { roleRoute } from '../../../shared/utils/role-prefix.util';
import { LabReportsApiService } from '../../lab-reports/data/lab-reports-api.service';
import { LabReportDto } from '../../lab-reports/models/lab-report.models';
import { PrescriptionsApiService } from '../../prescriptions/data/prescriptions-api.service';
import { PrescriptionDto } from '../../prescriptions/models/prescription.models';
import { VitalsApiService } from '../../vitals/data/vitals-api.service';
import { VitalSignDto } from '../../vitals/models/vital.models';
import { BillingApiService } from '../../billing/data/billing-api.service';
import { InvoiceDto } from '../../billing/models/billing.models';
import { AppointmentDto } from '../models/appointment.models';

@Component({
  selector: 'app-appointment-related-records',
  standalone: true,
  imports: [RouterLink, UiCardComponent, UiCardContentComponent, UiSkeletonComponent],
  template: `
    <app-ui-card class="mt-4">
      <app-ui-card-content class="space-y-4 p-5">
        <h3 class="font-semibold">Related records</h3>
        @if (loading()) {
          <app-ui-skeleton class="h-20" />
        } @else {
          <ul class="space-y-2 text-sm">
            <li class="flex items-center justify-between gap-2">
              <span class="text-muted-foreground">Prescription</span>
              @if (prescription(); as rx) {
                <a [routerLink]="prescriptionLink(rx.id)" class="font-medium text-primary hover:underline">#{{ rx.id }} — {{ rx.diagnosis }}</a>
              } @else if (appointment().hasPrescription) {
                <span>Loading…</span>
              } @else {
                <span class="text-muted-foreground">None</span>
              }
            </li>
            <li class="flex items-center justify-between gap-2">
              <span class="text-muted-foreground">Vitals</span>
              @if (vitals().length) {
                <a [routerLink]="vitalsLink(vitals()[0].id)" class="font-medium text-primary hover:underline">
                  {{ vitals().length }} reading{{ vitals().length > 1 ? 's' : '' }}
                </a>
              } @else {
                <span class="text-muted-foreground">None</span>
              }
            </li>
            <li class="flex items-center justify-between gap-2">
              <span class="text-muted-foreground">Lab reports</span>
              @if (labReports().length) {
                <a [routerLink]="labLink(labReports()[0].id)" class="font-medium text-primary hover:underline">
                  {{ labReports().length }} report{{ labReports().length > 1 ? 's' : '' }}
                </a>
              } @else {
                <span class="text-muted-foreground">None</span>
              }
            </li>
            <li class="flex items-center justify-between gap-2">
              <span class="text-muted-foreground">Invoice</span>
              @if (invoice(); as inv) {
                <a [routerLink]="invoiceLink(inv.id)" class="font-medium text-primary hover:underline">{{ inv.invoiceNumber }}</a>
              } @else if (appointment().hasInvoice) {
                <span>Loading…</span>
              } @else {
                <span class="text-muted-foreground">None</span>
              }
            </li>
          </ul>
        }
      </app-ui-card-content>
    </app-ui-card>
  `,
})
export class AppointmentRelatedRecordsComponent implements OnInit {
  private readonly prescriptionsApi = inject(PrescriptionsApiService);
  private readonly vitalsApi = inject(VitalsApiService);
  private readonly labApi = inject(LabReportsApiService);
  private readonly billingApi = inject(BillingApiService);
  private readonly router = inject(Router);

  readonly appointment = input.required<AppointmentDto>();

  readonly loading = signal(true);
  readonly prescription = signal<PrescriptionDto | null>(null);
  readonly vitals = signal<VitalSignDto[]>([]);
  readonly labReports = signal<LabReportDto[]>([]);
  readonly invoice = signal<InvoiceDto | null>(null);

  ngOnInit(): void {
    this.load();
  }

  prescriptionLink(id: number): string {
    return roleRoute(this.router, 'prescriptions', String(id));
  }

  vitalsLink(id: number): string {
    return roleRoute(this.router, 'vitals', String(id));
  }

  labLink(id: number): string {
    return roleRoute(this.router, 'lab-reports', String(id));
  }

  invoiceLink(id: number): string {
    return roleRoute(this.router, 'billing', 'invoices', String(id));
  }

  private load(): void {
    const apt = this.appointment();
    forkJoin({
      prescription: apt.hasPrescription
        ? this.prescriptionsApi.getByAppointment(apt.id).pipe(catchError(() => of(null)))
        : of(null),
      vitals: this.vitalsApi.list({ appointmentId: apt.id, page: 1, pageSize: 10 }).pipe(
        catchError(() => of({ items: [] as VitalSignDto[] })),
      ),
      labs: this.labApi.list({ patientId: apt.patientId, page: 1, pageSize: 20 }).pipe(
        catchError(() => of({ items: [] as LabReportDto[] })),
      ),
      invoices: apt.hasInvoice
        ? this.billingApi.list({ patientId: apt.patientId, page: 1, pageSize: 50 }).pipe(
            catchError(() => of({ items: [] as InvoiceDto[] })),
          )
        : of({ items: [] as InvoiceDto[] }),
    }).subscribe({
      next: ({ prescription, vitals, labs, invoices }) => {
        this.prescription.set(prescription);
        this.vitals.set(vitals.items);
        this.labReports.set(labs.items.filter((l) => l.appointmentId === apt.id));
        this.invoice.set(invoices.items.find((i) => i.appointmentId === apt.id) ?? null);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
