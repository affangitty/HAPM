import { Injectable, inject } from '@angular/core';
import { forkJoin, map, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AppointmentsApiService } from '../../features/appointments/data/appointments-api.service';
import { DoctorsApiService } from '../../features/doctors/data/doctors-api.service';
import { PatientsApiService } from '../../features/patients/data/patients-api.service';

export interface GlobalSearchResult {
  id: number;
  label: string;
  subtitle: string;
  type: 'patient' | 'doctor' | 'appointment';
  route: string;
}

@Injectable({ providedIn: 'root' })
export class GlobalSearchService {
  private readonly patientsApi = inject(PatientsApiService);
  private readonly doctorsApi = inject(DoctorsApiService);
  private readonly appointmentsApi = inject(AppointmentsApiService);

  search(query: string, rolePrefix: string): Observable<GlobalSearchResult[]> {
    const term = query.trim();
    if (term.length < 2) return of([]);

    return forkJoin({
      patients: this.patientsApi.list({ search: term, page: 1, pageSize: 5 }).pipe(catchError(() => of({ items: [] }))),
      doctors: this.doctorsApi.list({ search: term, page: 1, pageSize: 5 }).pipe(catchError(() => of({ items: [] }))),
      appointments: this.appointmentsApi.list({ search: term, page: 1, pageSize: 5 }).pipe(catchError(() => of({ items: [] }))),
    }).pipe(
      map(({ patients, doctors, appointments }) => {
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
        return results.slice(0, 12);
      }),
    );
  }
}
