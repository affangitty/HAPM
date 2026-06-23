import { PaginationParams } from '../../../core/api/api.models';
import { AuditAction } from '../../../shared/models/enums';

export interface AuditLogQueryParams extends PaginationParams {
  entityName?: string;
  action?: AuditAction;
  userId?: number;
  fromDate?: string;
  toDate?: string;
}

export interface AuditLogDto {
  id: number;
  userId?: number;
  userEmail?: string;
  entityName: string;
  entityId: string;
  action: AuditAction;
  changesJson: string;
  timestampUtc: string;
}
