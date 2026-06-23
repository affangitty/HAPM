import { environment } from '../../../environments/environment';

export const APP_CONFIG = {
  apiUrl: environment.apiUrl,
  hubNotifications: `${environment.hubBaseUrl}/hubs/notifications`,
  hubAppointments: `${environment.hubBaseUrl}/hubs/appointments`,
  hubChat: `${environment.hubBaseUrl}/hubs/chat`,
  tokenStorageKey: 'hapm.accessToken',
  refreshStorageKey: 'hapm.refreshToken',
  userStorageKey: 'hapm.user',
  rememberMeKey: 'hapm.rememberMe',
} as const;
