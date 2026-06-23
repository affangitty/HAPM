import { PaginationParams } from '../../../core/api/api.models';
import { NotificationType } from '../../../shared/models/enums';

export interface NotificationQueryParams extends PaginationParams {
  unreadOnly?: boolean;
}

export interface NotificationDto {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAtUtc: string;
  readAtUtc?: string;
}
