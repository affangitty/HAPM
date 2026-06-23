import { UserRole } from '../../../core/auth/auth.models';
import { PaginationParams } from '../../../core/api/api.models';

export interface UserQueryParams extends PaginationParams {
  role?: UserRole;
  isActive?: boolean;
}

export interface CreateReceptionistRequest {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
}

export interface ResetPasswordRequest {
  newPassword: string;
}

export interface SetUserActiveRequest {
  isActive: boolean;
}
