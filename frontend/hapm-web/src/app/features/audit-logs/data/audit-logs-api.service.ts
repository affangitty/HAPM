import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '../../../core/api/api-client.service';
import { PagedResult } from '../../../core/api/api.models';
import { AuditLogDto, AuditLogQueryParams } from '../models/audit-log.models';

@Injectable({ providedIn: 'root' })
export class AuditLogsApiService {
  private readonly api = inject(ApiClientService);

  list(params: AuditLogQueryParams): Observable<PagedResult<AuditLogDto>> {
    return this.api.getPaged<AuditLogDto>('/audit-logs', params);
  }
}
