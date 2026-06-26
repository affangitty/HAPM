export type UserRole = 'Admin' | 'Doctor' | 'Patient' | 'Receptionist';

export interface UserDto {
  id: number;
  email: string;
  fullName: string;
  phoneNumber: string | null;
  role: UserRole;
  isActive: boolean;
  createdAtUtc?: string;
  doctorId?: number | null;
  patientId?: number | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAtUtc: string;
  user: UserDto;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
  resetToken?: string | null;
}

export interface CompletePasswordResetRequest {
  token: string;
  newPassword: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
  exp: number;
}

export const ROLE_HOME_ROUTES: Record<UserRole, string> = {
  Admin: '/admin/dashboard',
  Doctor: '/doctor/dashboard',
  Patient: '/patient/dashboard',
  Receptionist: '/reception/dashboard',
};

export type AppRoleKey = 'admin' | 'doctor' | 'patient' | 'receptionist';

export const ROLE_KEY_TO_API: Record<AppRoleKey, UserRole> = {
  admin: 'Admin',
  doctor: 'Doctor',
  patient: 'Patient',
  receptionist: 'Receptionist',
};

export const API_ROLE_TO_KEY: Record<UserRole, AppRoleKey> = {
  Admin: 'admin',
  Doctor: 'doctor',
  Patient: 'patient',
  Receptionist: 'receptionist',
};

/** URL path segment for role-scoped routes (e.g. reception, not receptionist). */
export function roleRoutePrefix(role: UserRole): string {
  if (role === 'Receptionist') return 'reception';
  return role.toLowerCase();
}
