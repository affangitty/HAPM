import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '../../../core/api/api-client.service';
import { PagedResult } from '../../../core/api/api.models';
import {
  CreatePrescriptionRequest,
  PrescriptionDto,
  PrescriptionQueryParams,
  UpdatePrescriptionRequest,
} from '../models/prescription.models';

@Injectable({ providedIn: 'root' })
export class PrescriptionsApiService {
  private readonly api = inject(ApiClientService);

  list(params: PrescriptionQueryParams): Observable<PagedResult<PrescriptionDto>> {
    return this.api.getPaged<PrescriptionDto>('/prescriptions', params);
  }

  getById(id: number): Observable<PrescriptionDto> {
    return this.api.get<PrescriptionDto>(`/prescriptions/${id}`);
  }

  getByAppointment(appointmentId: number): Observable<PrescriptionDto> {
    return this.api.get<PrescriptionDto>(`/prescriptions/by-appointment/${appointmentId}`);
  }

  create(request: CreatePrescriptionRequest): Observable<PrescriptionDto> {
    return this.api.post<PrescriptionDto>('/prescriptions', request);
  }

  update(id: number, request: UpdatePrescriptionRequest): Observable<PrescriptionDto> {
    return this.api.patch<PrescriptionDto>(`/prescriptions/${id}`, request);
  }
}
