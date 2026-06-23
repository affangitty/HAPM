import { Routes } from '@angular/router';
import { UserRole } from '../../core/auth/auth.models';
import { roleGuard } from '../../core/auth/role.guard';
import { APPOINTMENT_ROUTES } from '../../features/appointments/appointments.routes';
import { DOCTOR_DIRECTORY_ROUTES, DOCTOR_SELF_ROUTES } from '../../features/doctors/doctors.routes';
import { PATIENT_DIRECTORY_ROUTES, PATIENT_SELF_ROUTES } from '../../features/patients/patients.routes';
import { PRESCRIPTION_TEMPLATE_ROUTES } from '../../features/prescription-templates/prescription-templates.routes';
import { PRESCRIPTION_ROUTES } from '../../features/prescriptions/prescriptions.routes';
import { WAITLIST_ROUTES } from '../../features/waitlist/waitlist.routes';
import { LAB_REPORT_ROUTES } from '../../features/lab-reports/lab-reports.routes';
import { BILLING_ROUTES } from '../../features/billing/billing.routes';
import { NOTIFICATION_ROUTES } from '../../features/notifications/notifications.routes';
import { STAFF_MESSAGE_ROUTES } from '../../features/staff-messages/staff-messages.routes';
import { VITAL_ROUTES } from '../../features/vitals/vitals.routes';
import { DOCTOR_PERFORMANCE_ROUTES, REVIEW_ROUTES } from '../../features/reviews/reviews.routes';
import { AUDIT_LOG_ROUTES } from '../../features/audit-logs/audit-logs.routes';
import { ANALYTICS_ROUTES } from '../../features/analytics/analytics.routes';
import { USER_ROUTES } from '../../features/users/users.routes';
import { EXPORT_ROUTES } from '../../features/exports/exports.routes';

interface PlaceholderRoute {
  path: string;
  title: string;
  subtitle?: string;
  showKpis?: boolean;
}

function placeholderRoutes(routes: PlaceholderRoute[]): Routes {
  return routes.map((route) => ({
    path: route.path,
    loadComponent: () =>
      import('../../shared/pages/placeholder-page.component').then((m) => m.PlaceholderPageComponent),
    data: {
      title: route.title,
      subtitle: route.subtitle,
      showKpis: route.showKpis,
    },
  }));
}

function dashboardRoute(role: 'admin' | 'doctor' | 'patient' | 'reception'): Routes {
  const loaders = {
    admin: () =>
      import('../../features/dashboard/pages/admin/admin-dashboard-page.component').then(
        (m) => m.AdminDashboardPageComponent,
      ),
    doctor: () =>
      import('../../features/dashboard/pages/doctor/doctor-dashboard-page.component').then(
        (m) => m.DoctorDashboardPageComponent,
      ),
    patient: () =>
      import('../../features/dashboard/pages/patient/patient-dashboard-page.component').then(
        (m) => m.PatientDashboardPageComponent,
      ),
    reception: () =>
      import('../../features/dashboard/pages/receptionist/receptionist-dashboard-page.component').then(
        (m) => m.ReceptionistDashboardPageComponent,
      ),
  };

  return [{ path: 'dashboard', loadComponent: loaders[role] }];
}

const profileSettingsRoute: Routes = [
  {
    path: 'settings',
    loadComponent: () =>
      import('../../features/auth/profile-settings/profile-settings-page.component').then(
        (m) => m.ProfileSettingsPageComponent,
      ),
    data: { title: 'Profile & Settings' },
  },
];

function reservedPaths(featureRoutes: Routes, placeholders: PlaceholderRoute[]): Set<string> {
  const reserved = new Set(['settings', 'dashboard']);
  for (const route of featureRoutes) {
    if (route.path) reserved.add(route.path.split('/')[0]);
  }
  for (const route of placeholders) {
    reserved.add(route.path);
  }
  return reserved;
}

function roleShell(
  prefix: string,
  roles: UserRole[],
  placeholders: PlaceholderRoute[],
  featureRoutes: Routes = [],
): Routes {
  const reserved = reservedPaths(featureRoutes, placeholders);

  return [
    {
      path: prefix,
      canActivate: [roleGuard],
      data: { roles },
      children: [
        ...featureRoutes,
        ...placeholderRoutes(placeholders.filter((p) => !reserved.has(p.path))),
        ...dashboardRoute(prefix as 'admin' | 'doctor' | 'patient' | 'reception'),
        ...profileSettingsRoute,
        { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      ],
    },
  ];
}

export const SHELL_CHILD_ROUTES: Routes = [
  ...roleShell(
    'admin',
    ['Admin'],
    [],
    [...DOCTOR_DIRECTORY_ROUTES, ...PATIENT_DIRECTORY_ROUTES, ...APPOINTMENT_ROUTES, ...LAB_REPORT_ROUTES, ...BILLING_ROUTES, ...NOTIFICATION_ROUTES, ...STAFF_MESSAGE_ROUTES, ...AUDIT_LOG_ROUTES, ...USER_ROUTES, ...EXPORT_ROUTES, ...ANALYTICS_ROUTES],
  ),
  ...roleShell(
    'doctor',
    ['Doctor'],
    [],
    [
      ...DOCTOR_SELF_ROUTES,
      ...PATIENT_DIRECTORY_ROUTES.filter((r) => r.path === 'patients' || r.path === 'patients/:id'),
      ...APPOINTMENT_ROUTES,
      ...PRESCRIPTION_ROUTES,
      ...PRESCRIPTION_TEMPLATE_ROUTES,
      ...LAB_REPORT_ROUTES,
      ...NOTIFICATION_ROUTES,
      ...STAFF_MESSAGE_ROUTES,
      ...VITAL_ROUTES,
      ...DOCTOR_PERFORMANCE_ROUTES,
    ],
  ),
  ...roleShell(
    'patient',
    ['Patient'],
    [],
    [
      ...PATIENT_SELF_ROUTES,
      ...APPOINTMENT_ROUTES,
      ...DOCTOR_DIRECTORY_ROUTES.filter((r) => r.path === 'doctors' || r.path === 'doctors/:id'),
      ...WAITLIST_ROUTES,
      ...PRESCRIPTION_ROUTES,
      ...LAB_REPORT_ROUTES,
      ...BILLING_ROUTES,
      ...NOTIFICATION_ROUTES,
      ...VITAL_ROUTES,
      ...REVIEW_ROUTES,
    ],
  ),
  ...roleShell(
    'reception',
    ['Receptionist'],
    [],
    [...DOCTOR_DIRECTORY_ROUTES, ...PATIENT_DIRECTORY_ROUTES, ...APPOINTMENT_ROUTES, ...WAITLIST_ROUTES, ...LAB_REPORT_ROUTES, ...BILLING_ROUTES, ...NOTIFICATION_ROUTES, ...STAFF_MESSAGE_ROUTES, ...EXPORT_ROUTES],
  ),
];
