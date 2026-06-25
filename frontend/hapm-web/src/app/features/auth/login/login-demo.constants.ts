export type DemoRole = 'Admin' | 'Doctor' | 'Patient' | 'Receptionist';

export const DEMO_ROLES: { role: DemoRole; label: string; email: string; password: string }[] = [
  { role: 'Admin', label: 'Admin', email: 'admin@hapm.local', password: 'Admin@12345' },
  { role: 'Doctor', label: 'Doctor', email: 'dr.sharma@hapm.local', password: 'Doctor@12345' },
  { role: 'Patient', label: 'Patient', email: 'patient@hapm.local', password: 'Patient@12345' },
  { role: 'Receptionist', label: 'Receptionist', email: 'reception@hapm.local', password: 'Reception@12345' },
];
