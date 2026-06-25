import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '../../../core/api/api-client.service';
import { PagedResult } from '../../../core/api/api.models';
import { JoinWaitlistRequest, WaitlistEntryDto, WaitlistQueryParams } from '../models/waitlist.models';

@Injectable({ providedIn: 'root' })
export class WaitlistApiService {
  private readonly api = inject(ApiClientService);

  list(params: WaitlistQueryParams): Observable<PagedResult<WaitlistEntryDto>> {
    return this.api.getPaged<WaitlistEntryDto>('/waitlist', params);
  }

  getById(id: number): Observable<WaitlistEntryDto> {
    return this.api.get<WaitlistEntryDto>(`/waitlist/${id}`);
  }

  join(request: JoinWaitlistRequest): Observable<WaitlistEntryDto> {
    return this.api.post<WaitlistEntryDto>('/waitlist', request);
  }

  cancel(id: number): Observable<void> {
    return this.api.post<void>(`/waitlist/${id}/cancel`, {});
  }
}
