import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiClientService } from '../../../core/api/api-client.service';
import { PagedResult } from '../../../core/api/api.models';
import { APP_CONFIG } from '../../../core/config/app-config';
import {
  AddPaymentRequest,
  CreateInvoiceRequest,
  InvoiceDto,
  InvoiceQueryParams,
  UpdateInvoiceRequest,
} from '../models/billing.models';

@Injectable({ providedIn: 'root' })
export class BillingApiService {
  private readonly api = inject(ApiClientService);
  private readonly http = inject(HttpClient);
  private readonly baseUrl = APP_CONFIG.apiUrl;

  list(params: InvoiceQueryParams): Observable<PagedResult<InvoiceDto>> {
    return this.api.getPaged<InvoiceDto>('/invoices', params);
  }

  getById(id: number): Observable<InvoiceDto> {
    return this.api.get<InvoiceDto>(`/invoices/${id}`);
  }

  create(request: CreateInvoiceRequest): Observable<InvoiceDto> {
    return this.api.post<InvoiceDto>('/invoices', request);
  }

  update(id: number, request: UpdateInvoiceRequest): Observable<InvoiceDto> {
    return this.api.patch<InvoiceDto>(`/invoices/${id}`, request);
  }

  addPayment(id: number, request: AddPaymentRequest): Observable<InvoiceDto> {
    return this.api.post<InvoiceDto>(`/invoices/${id}/payments`, request);
  }

  cancel(id: number): Observable<void> {
    return this.api.post<void>(`/invoices/${id}/cancel`, {});
  }

  exportInvoices(fromDate?: string, toDate?: string): Observable<Blob> {
    const params: Record<string, string> = {};
    if (fromDate) params['fromDate'] = fromDate;
    if (toDate) params['toDate'] = toDate;
    return this.http.get(`${this.baseUrl}/exports/invoices`, { params, responseType: 'blob' });
  }
}
