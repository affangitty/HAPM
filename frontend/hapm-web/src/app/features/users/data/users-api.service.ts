import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '../../../core/api/api-client.service';
import { PagedResult } from '../../../core/api/api.models';
import { UserDto } from '../../../core/auth/auth.models';
import {
  CreateReceptionistRequest,
  ResetPasswordRequest,
  SetUserActiveRequest,
  UserQueryParams,
} from '../models/user.models';

@Injectable({ providedIn: 'root' })
export class UsersApiService {
  private readonly api = inject(ApiClientService);

  list(params: UserQueryParams): Observable<PagedResult<UserDto>> {
    return this.api.getPaged<UserDto>('/users', params);
  }

  createReceptionist(request: CreateReceptionistRequest): Observable<UserDto> {
    return this.api.post<UserDto>('/users/receptionists', request);
  }

  setActive(id: number, request: SetUserActiveRequest): Observable<void> {
    return this.api.patch<void>(`/users/${id}/status`, request);
  }

  resetPassword(id: number, request: ResetPasswordRequest): Observable<void> {
    return this.api.post<void>(`/users/${id}/reset-password`, request);
  }
}
