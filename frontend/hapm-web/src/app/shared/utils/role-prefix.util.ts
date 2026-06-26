import { Router } from '@angular/router';

/** First URL segment after the app root (e.g. admin, doctor, patient, reception). */
export function getRolePrefix(router: Router): string {
  return router.url.split('/').filter(Boolean)[0] ?? 'admin';
}

export { roleRoutePrefix } from '../../core/auth/auth.models';

/** Role-scoped base path such as `/admin`. */
export function roleBase(router: Router): string {
  return `/${getRolePrefix(router)}`;
}

/** Role-scoped route path such as `/admin/patients`. */
export function roleRoute(router: Router, ...segments: string[]): string {
  const path = [roleBase(router), ...segments.filter(Boolean)].join('/');
  return path.replace(/\/+$/, '') || roleBase(router);
}
