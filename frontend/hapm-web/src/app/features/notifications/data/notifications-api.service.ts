import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '../../../core/api/api-client.service';
import { PagedResult } from '../../../core/api/api.models';
import { NotificationDto, NotificationQueryParams } from '../models/notification.models';

@Injectable({ providedIn: 'root' })
export class NotificationsApiService {
  private readonly api = inject(ApiClientService);

  getById(id: number): Observable<NotificationDto> {
    return this.api.get<NotificationDto>(`/notifications/${id}`);
  }

  list(params: NotificationQueryParams): Observable<PagedResult<NotificationDto>> {
    return this.api.getPaged<NotificationDto>('/notifications', params);
  }

  getUnreadCount(): Observable<number> {
    return this.api.get<number>('/notifications/unread-count');
  }

  markAsRead(id: number): Observable<void> {
    return this.api.post<void>(`/notifications/${id}/read`, {});
  }

  markAllAsRead(): Observable<void> {
    return this.api.post<void>('/notifications/read-all', {});
  }
}
