import { Injectable, inject } from '@angular/core';
import { forkJoin, map, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AppointmentsApiService } from '../../features/appointments/data/appointments-api.service';
import { BillingApiService } from '../../features/billing/data/billing-api.service';
import { DoctorsApiService } from '../../features/doctors/data/doctors-api.service';
import { LabReportsApiService } from '../../features/lab-reports/data/lab-reports-api.service';
import { PatientsApiService } from '../../features/patients/data/patients-api.service';
import { PrescriptionsApiService } from '../../features/prescriptions/data/prescriptions-api.service';

export type GlobalSearchResultType =
  | 'patient'
  | 'doctor'
  | 'appointment'
  | 'prescription'
  | 'invoice'
  | 'lab-report';

export interface GlobalSearchResult {
  id: number;
  label: string;
  subtitle: string;
  type: GlobalSearchResultType;
  route: string;
}

@Injectable({ providedIn: 'root' })
export class GlobalSearchService {
  private readonly patientsApi = inject(PatientsApiService);
  private readonly doctorsApi = inject(DoctorsApiService);
  private readonly appointmentsApi = inject(AppointmentsApiService);
  private readonly prescriptionsApi = inject(PrescriptionsApiService);
  private readonly billingApi = inject(BillingApiService);
  private readonly labReportsApi = inject(LabReportsApiService);

  search(query: string, rolePrefix: string): Observable<GlobalSearchResult[]> {
    const term = query.trim();
    if (term.length < 2) return of([]);

    const includeClinical = rolePrefix !== 'patient';
    const includeBilling = rolePrefix === 'admin' || rolePrefix === 'reception' || rolePrefix === 'patient';

    return forkJoin({
      patients: this.patientsApi.list({ search: term, page: 1, pageSize: 4 }).pipe(catchError(() => of({ items: [] }))),
      doctors: this.doctorsApi.list({ search: term, page: 1, pageSize: 4 }).pipe(catchError(() => of({ items: [] }))),
      appointments: this.appointmentsApi.list({ search: term, page: 1, pageSize: 4 }).pipe(catchError(() => of({ items: [] }))),
      prescriptions: includeClinical
        ? this.prescriptionsApi.list({ search: term, page: 1, pageSize: 3 }).pipe(catchError(() => of({ items: [] })))
        : of({ items: [] }),
      invoices: includeBilling
        ? this.billingApi.list({ search: term, page: 1, pageSize: 3 }).pipe(catchError(() => of({ items: [] })))
        : of({ items: [] }),
      labReports: includeClinical
        ? this.labReportsApi.list({ search: term, page: 1, pageSize: 3 }).pipe(catchError(() => of({ items: [] })))
        : of({ items: [] }),
    }).pipe(
      map(({ patients, doctors, appointments, prescriptions, invoices, labReports }) => {
        const results: GlobalSearchResult[] = [];
        for (const p of patients.items) {
          results.push({
            id: p.id,
            label: p.fullName,
            subtitle: `Patient · ${p.medicalRecordNumber}`,
            type: 'patient',
            route: `/${rolePrefix}/patients/${p.id}`,
          });
        }
        for (const d of doctors.items) {
          results.push({
            id: d.id,
            label: d.fullName,
            subtitle: `Doctor · ${d.specialization}`,
            type: 'doctor',
            route: `/${rolePrefix}/doctors/${d.id}`,
          });
        }
        for (const a of appointments.items) {
          results.push({
            id: a.id,
            label: `${a.patientName} with ${a.doctorName}`,
            subtitle: `Appointment · ${a.appointmentDate} ${a.startTime}`,
            type: 'appointment',
            route: `/${rolePrefix}/appointments/${a.id}`,
          });
        }
        for (const rx of prescriptions.items) {
          results.push({
            id: rx.id,
            label: `Rx for ${rx.patientName}`,
            subtitle: `Prescription · ${rx.doctorName}`,
            type: 'prescription',
            route: `/${rolePrefix}/prescriptions/${rx.id}`,
          });
        }
        for (const inv of invoices.items) {
          results.push({
            id: inv.id,
            label: inv.invoiceNumber,
            subtitle: `Invoice · ${inv.patientName}`,
            type: 'invoice',
            route: `/${rolePrefix}/billing/invoices/${inv.id}`,
          });
        }
        for (const lab of labReports.items) {
          results.push({
            id: lab.id,
            label: lab.title,
            subtitle: `Lab report · ${lab.patientName}`,
            type: 'lab-report',
            route: `/${rolePrefix}/lab-reports/${lab.id}`,
          });
        }
        return results.slice(0, 12);
      }),
    );
  }
}
