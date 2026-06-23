import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '../../../core/api/api-client.service';
import { PagedResult } from '../../../core/api/api.models';
import { RecordVitalSignRequest, VitalSignDto, VitalSignQueryParams } from '../models/vital.models';

@Injectable({ providedIn: 'root' })
export class VitalsApiService {
  private readonly api = inject(ApiClientService);

  list(params: VitalSignQueryParams): Observable<PagedResult<VitalSignDto>> {
    return this.api.getPaged<VitalSignDto>('/vitals', params);
  }

  getById(id: number): Observable<VitalSignDto> {
    return this.api.get<VitalSignDto>(`/vitals/${id}`);
  }

  record(request: RecordVitalSignRequest): Observable<VitalSignDto> {
    return this.api.post<VitalSignDto>('/vitals', request);
  }
}
