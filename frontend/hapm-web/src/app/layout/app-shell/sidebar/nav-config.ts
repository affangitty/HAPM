import { AppRoleKey } from '../../../core/auth/auth.models';

export interface NavItem {
  label: string;
  route: string;
  icon: NavIcon;
  badge?: number;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export type NavIcon =
  | 'dashboard'
  | 'users'
  | 'doctors'
  | 'patients'
  | 'appointments'
  | 'prescriptions'
  | 'templates'
  | 'lab-reports'
  | 'billing'
  | 'vitals'
  | 'waitlist'
  | 'notifications'
  | 'messages'
  | 'audit'
  | 'exports'
  | 'settings'
  | 'reviews'
  | 'analytics';

export const NAV_CONFIG: Record<AppRoleKey, NavGroup[]> = {
  admin: [
    {
      label: 'Overview',
      items: [{ label: 'Dashboard', route: '/admin/dashboard', icon: 'dashboard' }],
    },
    {
      label: 'Management',
      items: [
        { label: 'Users', route: '/admin/users', icon: 'users' },
        { label: 'Doctors', route: '/admin/doctors', icon: 'doctors' },
        { label: 'Patients', route: '/admin/patients', icon: 'patients' },
      ],
    },
    {
      label: 'Operations',
      items: [
        { label: 'Appointments', route: '/admin/appointments', icon: 'appointments' },
        { label: 'Billing', route: '/admin/billing', icon: 'billing' },
        { label: 'Payments', route: '/admin/billing/payments', icon: 'billing' },
        { label: 'Lab Reports', route: '/admin/lab-reports', icon: 'lab-reports' },
      ],
    },
    {
      label: 'System',
      items: [
        { label: 'Analytics', route: '/admin/analytics', icon: 'analytics' },
        { label: 'Audit Logs', route: '/admin/audit-logs', icon: 'audit' },
        { label: 'Exports', route: '/admin/exports', icon: 'exports' },
        { label: 'Notifications', route: '/admin/notifications', icon: 'notifications' },
        { label: 'Messages', route: '/admin/messages', icon: 'messages' },
        { label: 'Settings', route: '/admin/settings', icon: 'settings' },
      ],
    },
  ],
  doctor: [
    {
      label: 'Overview',
      items: [{ label: 'Dashboard', route: '/doctor/dashboard', icon: 'dashboard' }],
    },
    {
      label: 'Clinical',
      items: [
        { label: 'My Schedule', route: '/doctor/appointments', icon: 'appointments' },
        { label: 'Patients', route: '/doctor/patients', icon: 'patients' },
        { label: 'Prescriptions', route: '/doctor/prescriptions', icon: 'prescriptions' },
        { label: 'Templates', route: '/doctor/templates', icon: 'templates' },
        { label: 'Lab Reports', route: '/doctor/lab-reports', icon: 'lab-reports' },
        { label: 'Vital Signs', route: '/doctor/vitals', icon: 'vitals' },
        { label: 'Leave', route: '/doctor/leaves', icon: 'appointments' },
        { label: 'Performance', route: '/doctor/performance', icon: 'analytics' },
      ],
    },
    {
      label: 'Communicate',
      items: [
        { label: 'Notifications', route: '/doctor/notifications', icon: 'notifications' },
        { label: 'Messages', route: '/doctor/messages', icon: 'messages' },
      ],
    },
    {
      label: 'Account',
      items: [
        { label: 'My Profile', route: '/doctor/profile', icon: 'doctors' },
        { label: 'Settings', route: '/doctor/settings', icon: 'settings' },
      ],
    },
  ],
  patient: [
    {
      label: 'Overview',
      items: [{ label: 'Dashboard', route: '/patient/dashboard', icon: 'dashboard' }],
    },
    {
      label: 'My Health',
      items: [
        { label: 'Appointments', route: '/patient/appointments', icon: 'appointments' },
        { label: 'Waitlist', route: '/patient/waitlist', icon: 'waitlist' },
        { label: 'Medical Records', route: '/patient/records', icon: 'patients' },
        { label: 'Prescriptions', route: '/patient/prescriptions', icon: 'prescriptions' },
        { label: 'Lab Reports', route: '/patient/lab-reports', icon: 'lab-reports' },
        { label: 'Vital Signs', route: '/patient/vitals', icon: 'vitals' },
        { label: 'Reviews', route: '/patient/reviews', icon: 'reviews' },
      ],
    },
    {
      label: 'Billing',
      items: [{ label: 'Invoices', route: '/patient/billing', icon: 'billing' }],
    },
    {
      label: 'Communication',
      items: [
        { label: 'Notifications', route: '/patient/notifications', icon: 'notifications' },
      ],
    },
    {
      label: 'Account',
      items: [{ label: 'Settings', route: '/patient/settings', icon: 'settings' }],
    },
  ],
  receptionist: [
    {
      label: 'Overview',
      items: [{ label: 'Dashboard', route: '/reception/dashboard', icon: 'dashboard' }],
    },
    {
      label: 'Operations',
      items: [
        { label: 'Appointments', route: '/reception/appointments', icon: 'appointments' },
        { label: 'Patient Search', route: '/reception/patients', icon: 'patients' },
        { label: 'Doctors', route: '/reception/doctors', icon: 'doctors' },
        { label: 'Waitlist', route: '/reception/waitlist', icon: 'waitlist' },
        { label: 'Billing', route: '/reception/billing', icon: 'billing' },
        { label: 'Payments', route: '/reception/billing/payments', icon: 'billing' },
        { label: 'Lab Reports', route: '/reception/lab-reports', icon: 'lab-reports' },
      ],
    },
    {
      label: 'Communicate',
      items: [
        { label: 'Notifications', route: '/reception/notifications', icon: 'notifications' },
        { label: 'Messages', route: '/reception/messages', icon: 'messages' },
        { label: 'Exports', route: '/reception/exports', icon: 'exports' },
      ],
    },
    {
      label: 'Account',
      items: [{ label: 'Settings', route: '/reception/settings', icon: 'settings' }],
    },
  ],
};

export const PAGE_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  analytics: 'Analytics',
  users: 'User Management',
  doctors: 'Doctors',
  patients: 'Patients',
  appointments: 'Appointments',
  prescriptions: 'Prescriptions',
  templates: 'Prescription Templates',
  'lab-reports': 'Lab Reports',
  billing: 'Billing & Invoices',
  vitals: 'Vital Signs',
  waitlist: 'Waitlist',
  notifications: 'Notifications',
  messages: 'Messages',
  'audit-logs': 'Audit Logs',
  exports: 'Exports',
  settings: 'Settings',
  profile: 'Profile',
  performance: 'Performance',
  leaves: 'Leave Management',
  records: 'Medical Records',
  reviews: 'Reviews',
};
