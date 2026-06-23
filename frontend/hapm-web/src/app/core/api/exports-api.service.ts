import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiClientService } from './api-client.service';
import { downloadBlob, fileNameFromContentDisposition } from './dto-mapper.util';

export interface ExportDateRange {
  fromDate?: string;
  toDate?: string;
}

@Injectable({ providedIn: 'root' })
export class ExportsApiService {
  private readonly api = inject(ApiClientService);

  exportAppointments(range: ExportDateRange = {}): Observable<void> {
    return this.download('/exports/appointments', this.toQuery(range), 'appointments.csv');
  }

  exportPatients(): Observable<void> {
    return this.download('/exports/patients', {}, 'patients.csv');
  }

  exportInvoices(range: ExportDateRange = {}): Observable<void> {
    return this.download('/exports/invoices', this.toQuery(range), 'invoices.csv');
  }

  private toQuery(range: ExportDateRange): Record<string, string | undefined> {
    return { fromDate: range.fromDate, toDate: range.toDate };
  }

  private download(
    path: string,
    params: Record<string, string | undefined>,
    fallbackName: string,
  ): Observable<void> {
    const query: Record<string, string> = {};
    if (params['fromDate']) query['fromDate'] = params['fromDate'];
    if (params['toDate']) query['toDate'] = params['toDate'];

    return this.api.getBlob(path, query).pipe(
      map((response) => {
        const name = fileNameFromContentDisposition(
          response.headers.get('content-disposition'),
          fallbackName,
        );
        downloadBlob(response.body ?? new Blob(), name);
      }),
    );
  }
}
