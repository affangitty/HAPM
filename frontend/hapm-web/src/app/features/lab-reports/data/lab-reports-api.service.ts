import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiClientService } from '../../../core/api/api-client.service';
import { PagedResult } from '../../../core/api/api.models';
import { APP_CONFIG } from '../../../core/config/app-config';
import {
  LabReportDto,
  LabReportQueryParams,
  ReviewLabReportRequest,
  UpdateLabReportRequest,
  UploadLabReportRequest,
} from '../models/lab-report.models';

@Injectable({ providedIn: 'root' })
export class LabReportsApiService {
  private readonly api = inject(ApiClientService);
  private readonly http = inject(HttpClient);
  private readonly baseUrl = APP_CONFIG.apiUrl;

  list(params: LabReportQueryParams): Observable<PagedResult<LabReportDto>> {
    return this.api.getPaged<LabReportDto>('/lab-reports', params);
  }

  getById(id: number): Observable<LabReportDto> {
    return this.api.get<LabReportDto>(`/lab-reports/${id}`);
  }

  upload(request: UploadLabReportRequest): Observable<LabReportDto> {
    const form = new FormData();
    form.append('patientId', String(request.patientId));
    if (request.doctorId) form.append('doctorId', String(request.doctorId));
    if (request.appointmentId) form.append('appointmentId', String(request.appointmentId));
    form.append('reportType', request.reportType);
    form.append('title', request.title);
    form.append('file', request.file);
    return this.http.post<LabReportDto>(`${this.baseUrl}/lab-reports`, form);
  }

  review(id: number, request: ReviewLabReportRequest): Observable<LabReportDto> {
    return this.api.post<LabReportDto>(`/lab-reports/${id}/review`, request);
  }

  update(id: number, request: UpdateLabReportRequest): Observable<LabReportDto> {
    const form = new FormData();
    form.append('reportType', request.reportType);
    form.append('title', request.title);
    if (request.doctorId != null) form.append('doctorId', String(request.doctorId));
    if (request.appointmentId != null) form.append('appointmentId', String(request.appointmentId));
    if (request.file) form.append('file', request.file);
    return this.http.put<LabReportDto>(`${this.baseUrl}/lab-reports/${id}`, form);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`/lab-reports/${id}`);
  }

  download(id: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/lab-reports/${id}/download`, { responseType: 'blob' });
  }
}
