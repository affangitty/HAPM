import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiClientService } from '../../../core/api/api-client.service';
import { PagedResult } from '../../../core/api/api.models';
import { MAX_PAGE_SIZE } from '../../../shared/models/pagination.model';
import { JoinWaitlistRequest, WaitlistEntryDto, WaitlistQueryParams } from '../models/waitlist.models';

@Injectable({ providedIn: 'root' })
export class WaitlistApiService {
  private readonly api = inject(ApiClientService);

  list(params: WaitlistQueryParams): Observable<PagedResult<WaitlistEntryDto>> {
    return this.api.getPaged<WaitlistEntryDto>('/waitlist', params);
  }

  getById(id: number): Observable<WaitlistEntryDto> {
    return this.list({ page: 1, pageSize: MAX_PAGE_SIZE }).pipe(
      map((result) => {
        const entry = result.items.find((item) => item.id === id);
        if (!entry) {
          throw new Error('Waitlist entry not found');
        }
        return entry;
      }),
    );
  }

  join(request: JoinWaitlistRequest): Observable<WaitlistEntryDto> {
    return this.api.post<WaitlistEntryDto>('/waitlist', request);
  }

  cancel(id: number): Observable<void> {
    return this.api.post<void>(`/waitlist/${id}/cancel`, {});
  }
}
