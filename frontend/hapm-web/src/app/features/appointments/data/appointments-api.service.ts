import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '../../../core/api/api-client.service';
import { PagedResult } from '../../../core/api/api.models';
import {
  AppointmentDto,
  AppointmentQueryParams,
  BookAppointmentRequest,
  CancelAppointmentRequest,
  CompleteAppointmentRequest,
  RescheduleAppointmentRequest,
} from '../models/appointment.models';

@Injectable({ providedIn: 'root' })
export class AppointmentsApiService {
  private readonly api = inject(ApiClientService);

  list(params: AppointmentQueryParams): Observable<PagedResult<AppointmentDto>> {
    return this.api.getPaged<AppointmentDto>('/appointments', params);
  }

  getById(id: number): Observable<AppointmentDto> {
    return this.api.get<AppointmentDto>(`/appointments/${id}`);
  }

  book(request: BookAppointmentRequest): Observable<AppointmentDto> {
    return this.api.post<AppointmentDto>('/appointments', request);
  }

  confirm(id: number): Observable<AppointmentDto> {
    return this.api.post<AppointmentDto>(`/appointments/${id}/confirm`, {});
  }

  checkIn(id: number): Observable<AppointmentDto> {
    return this.api.post<AppointmentDto>(`/appointments/${id}/check-in`, {});
  }

  complete(id: number, request: CompleteAppointmentRequest): Observable<AppointmentDto> {
    return this.api.post<AppointmentDto>(`/appointments/${id}/complete`, request);
  }

  cancel(id: number, request: CancelAppointmentRequest): Observable<AppointmentDto> {
    return this.api.post<AppointmentDto>(`/appointments/${id}/cancel`, request);
  }

  markNoShow(id: number): Observable<AppointmentDto> {
    return this.api.post<AppointmentDto>(`/appointments/${id}/no-show`, {});
  }

  reschedule(id: number, request: RescheduleAppointmentRequest): Observable<AppointmentDto> {
    return this.api.patch<AppointmentDto>(`/appointments/${id}/reschedule`, request);
  }
}
