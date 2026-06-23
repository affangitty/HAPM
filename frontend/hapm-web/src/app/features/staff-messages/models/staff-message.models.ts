import { PaginationParams } from '../../../core/api/api.models';

export type StaffMessageTarget = 'DoctorRoom' | 'StaffBroadcast';

export interface SendDoctorMessageRequest {
  doctorId: number;
  content: string;
}

export interface BroadcastStaffMessageRequest {
  content: string;
}

export interface StaffMessageQueryParams extends PaginationParams {
  doctorId?: number;
  target?: StaffMessageTarget;
}

export interface StaffMessageDto {
  id: number;
  senderUserId: number;
  senderName: string;
  senderRole: string;
  target: StaffMessageTarget;
  doctorId?: number;
  doctorName?: string;
  content: string;
  createdAtUtc: string;
}

export interface ConversationThread {
  id: string;
  title: string;
  subtitle: string;
  target: StaffMessageTarget;
  doctorId?: number;
  lastMessage?: string;
  lastAt?: string;
  unread?: number;
}
