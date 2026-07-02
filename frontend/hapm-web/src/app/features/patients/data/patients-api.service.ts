import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '../../../core/api/api-client.service';
import { PagedResult } from '../../../core/api/api.models';
import {
  CreatePatientRequest,
  PatientDto,
  PatientMedicalHistoryDto,
  PatientQueryParams,
  UpdatePatientRequest,
} from '../models/patient.models';

@Injectable({ providedIn: 'root' })
export class PatientsApiService {
  private readonly api = inject(ApiClientService);

  list(params: PatientQueryParams): Observable<PagedResult<PatientDto>> {
    return this.api.getPaged<PatientDto>('/patients', params);
  }

  getById(id: number): Observable<PatientDto> {
    return this.api.get<PatientDto>(`/patients/${id}`);
  }

  getMyProfile(): Observable<PatientDto> {
    return this.api.get<PatientDto>('/patients/me');
  }

  getMedicalHistory(id: number): Observable<PatientMedicalHistoryDto> {
    return this.api.get<PatientMedicalHistoryDto>(`/patients/${id}/medical-history`);
  }

  create(request: CreatePatientRequest): Observable<PatientDto> {
    return this.api.post<PatientDto>('/patients', request);
  }

  update(id: number, request: UpdatePatientRequest): Observable<PatientDto> {
    return this.api.patch<PatientDto>(`/patients/${id}`, request);
  }

  deactivate(id: number): Observable<void> {
    return this.api.delete<void>(`/patients/${id}`);
  }
}
