import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '../../../core/api/api-client.service';
import { PagedResult } from '../../../core/api/api.models';
import {
  BroadcastStaffMessageRequest,
  SendDoctorMessageRequest,
  StaffMessageDto,
  StaffMessageQueryParams,
} from '../models/staff-message.models';

@Injectable({ providedIn: 'root' })
export class StaffMessagesApiService {
  private readonly api = inject(ApiClientService);

  list(params: StaffMessageQueryParams): Observable<PagedResult<StaffMessageDto>> {
    return this.api.getPaged<StaffMessageDto>('/staff-messages', params);
  }

  sendToDoctor(request: SendDoctorMessageRequest): Observable<StaffMessageDto> {
    return this.api.post<StaffMessageDto>('/staff-messages/to-doctor', request);
  }

  broadcast(request: BroadcastStaffMessageRequest): Observable<StaffMessageDto> {
    return this.api.post<StaffMessageDto>('/staff-messages/broadcast', request);
  }
}
