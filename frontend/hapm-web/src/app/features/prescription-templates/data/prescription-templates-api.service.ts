import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '../../../core/api/api-client.service';
import {
  PrescriptionTemplateDto,
  SavePrescriptionTemplateRequest,
} from '../models/prescription-template.models';

@Injectable({ providedIn: 'root' })
export class PrescriptionTemplatesApiService {
  private readonly api = inject(ApiClientService);

  list(): Observable<PrescriptionTemplateDto[]> {
    return this.api.get<PrescriptionTemplateDto[]>('/prescription-templates');
  }

  getById(id: number): Observable<PrescriptionTemplateDto> {
    return this.api.get<PrescriptionTemplateDto>(`/prescription-templates/${id}`);
  }

  create(request: SavePrescriptionTemplateRequest): Observable<PrescriptionTemplateDto> {
    return this.api.post<PrescriptionTemplateDto>('/prescription-templates', request);
  }

  update(id: number, request: SavePrescriptionTemplateRequest): Observable<PrescriptionTemplateDto> {
    return this.api.put<PrescriptionTemplateDto>(`/prescription-templates/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`/prescription-templates/${id}`);
  }
}
