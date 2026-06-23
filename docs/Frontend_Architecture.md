# HAPM Frontend Architecture

**Angular 19 · Tailwind CSS · ASP.NET Core API**

This document defines the frontend architecture for the Hospital Appointment & Patient Management System. It merges two design exports:

| Source | Path | Role in implementation |
|--------|------|------------------------|
| **Stitch** | `design/stitch-export/` | Layouts, page structure, navigation, dashboard organization, component hierarchy |
| **Figma** | `design/figma-export/` | Spacing, typography, color tokens, visual hierarchy, cards, tables, forms, responsiveness, UI polish |

**Rule:** Stitch decides *where things go*; Figma decides *how they look*.

---

## Design source analysis

### Stitch export (`design/stitch-export/`)

- **29 screen PNGs** + `clinical_precision/DESIGN.md` (Material-style token spec)
- **Canonical shell:** HAPM Clinical Portal — light sidebar (260px), top header with global search, white content canvas, teal active nav state
- **Page patterns:** KPI row → filter bar → data table; multi-step wizards (appointment booking); split-pane messaging; calendar + list dual views
- **Two layout families exist** — only the **HAPM Clinical Portal** shell is adopted. Screens using the alternate “St. Mary’s / HAPM Enterprise” dark-sidebar shell (`audit_logs`, `staff_messaging`, `notification_center`) are **re-skinned** into the canonical shell during implementation
- **Branding noise to normalize:** “City General Medical Center”, “St. Mary’s Health” → **HAPM System / Clinical Portal**

### Figma export (`design/figma-export/`)

- **Runnable React prototype** — single `App.tsx` (~3,100 lines), 19 navigable views
- **Role-based `NAV_CONFIG`** — proven IA for Admin, Doctor, Patient, Receptionist
- **Design tokens:** `src/styles/theme.css` — CSS variables mapped to Tailwind `@theme`
- **Component vocabulary:** shadcn-style primitives (Button, Card, Badge, Input, Table, Dialog, Tabs, etc.)
- **Auth UX:** split-panel login, forgot-password flow (Stitch lacks this)
- **Visual identity:** Inter 15px base, slate backgrounds (`#F1F5F9`), primary blue (`#1D4ED8`), accent teal (`#0D9488`), ghost-bordered cards, `rounded-xl`, focus rings, hover row states

### Merge strategy

```
┌─────────────────────────────────────────────────────────────┐
│  STITCH                          FIGMA                      │
│  ───────                         ─────                      │
│  Sidebar width (260px)           Dark→light sidebar tokens  │
│  Nav item grouping               Nav group labels + icons   │
│  Dashboard widget layout         KPICard, chart card polish  │
│  Appointment 4-step wizard       Form input focus/hover     │
│  Table column structure          Table row hover, badges    │
│  Page titles + subtitles         Typography scale           │
│  12-column content grid          Spacing (p-5, gap-6)       │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    Angular 19 + Tailwind CSS
                    Single HAPM design system
```

---

## 1. Screen inventory

### 1.1 Authentication (Figma-led — Stitch gap)

| ID | Screen | Roles | Stitch ref | Figma ref | Priority |
|----|--------|-------|------------|-----------|----------|
| AUTH-01 | Login | Public | — | `LoginScreen` | P0 |
| AUTH-02 | Patient self-registration | Public | — | (derive from login panel) | P0 |
| AUTH-03 | Forgot password | Public | — | `LoginScreen` (forgot view) | P1 |
| AUTH-04 | Change password | Authenticated | — | `ProfileSettingsView` | P1 |

### 1.2 Dashboards (Stitch-led)

| ID | Screen | Roles | Stitch ref | Figma ref |
|----|--------|-------|------------|-----------|
| DASH-01 | Admin dashboard | Admin | `admin_dashboard_hapm_system` | `AdminDashboard` |
| DASH-02 | Admin analytics overview | Admin | `admin_dashboard_analytics_overview` | charts in `AdminDashboard` |
| DASH-03 | Operational & financial analytics | Admin | `admin_operational_financial_analytics` | — |
| DASH-04 | Revenue analytics | Admin | `revenue_analytics_financial_overview` | — |
| DASH-05 | Doctor dashboard | Doctor | `doctor_dashboard_hapm_system` | `DoctorDashboard` |
| DASH-06 | Doctor clinical workspace | Doctor | `doctor_dashboard_clinical_workspace` | vitals queue in `DoctorDashboard` |
| DASH-07 | Patient portal dashboard | Patient | `patient_portal_hapm_system` | `PatientDashboard` |
| DASH-08 | Patient health portal | Patient | `patient_dashboard_health_portal` | merge into DASH-07 |
| DASH-09 | Receptionist dashboard | Receptionist | `receptionist_dashboard_hapm_system` | `ReceptionistDashboard` |
| DASH-10 | Reception front-desk hub | Receptionist | `receptionist_dashboard_front_desk_hub` | merge into DASH-09 |

### 1.3 Users & doctors

| ID | Screen | Roles | Stitch ref | Figma ref |
|----|--------|-------|------------|-----------|
| USR-01 | User management | Admin | — | `UserManagementView` |
| DOC-01 | Medical staff directory | Admin, Receptionist | `medical_staff_directory` | `DoctorList` |
| DOC-02 | Doctor profile & availability | Admin, Doctor | `doctor_profile_availability` | `DoctorProfile` |
| DOC-03 | Doctor create / edit | Admin | — | modal in `DoctorList` |
| DOC-04 | Doctor schedule editor | Admin | partial in DOC-02 | schedule tab in `DoctorProfile` |
| DOC-05 | Doctor leave management | Admin, Doctor | — | — |
| DOC-06 | Doctor reviews & performance | Admin, Doctor | `doctor_reviews_performance_metrics` | rating in `DoctorProfile` |
| DOC-07 | Public doctor browse | Public | — | `DoctorList` (anonymous slots) |

### 1.4 Patients

| ID | Screen | Roles | Stitch ref | Figma ref |
|----|--------|-------|------------|-----------|
| PAT-01 | Patient directory | Admin, Receptionist, Doctor | `patient_directory_hapm_system` | `PatientList` |
| PAT-02 | Patient comprehensive profile | Staff | `patient_comprehensive_profile` | `PatientProfile` |
| PAT-03 | New patient registration | Receptionist, Admin | `new_patient_registration` | modal in `PatientList` |
| PAT-04 | My medical records | Patient | — | `patient-profile` view for patient role |
| PAT-05 | Patient deactivate | Admin | — | action in PAT-01 |

### 1.5 Appointments & waitlist

| ID | Screen | Roles | Stitch ref | Figma ref |
|----|--------|-------|------------|-----------|
| APT-01 | Appointment list | All (scoped) | `appointment_management_list_view` | `AppointmentsView` |
| APT-02 | Appointment calendar | Staff | `centralized_appointment_calendar` | calendar tab in `AppointmentsView` |
| APT-03 | Appointment details & tracking | All (scoped) | `appointment_details_tracking` | detail drawer in `AppointmentsView` |
| APT-04 | Schedule appointment wizard | Patient, Staff | `schedule_new_appointment` | book modal in `AppointmentsView` |
| APT-05 | Reschedule appointment | Patient, Staff | step in APT-04 | — |
| WLT-01 | Waitlist management | Patient, Staff | — | — |

### 1.6 Clinical

| ID | Screen | Roles | Stitch ref | Figma ref |
|----|--------|-------|------------|-----------|
| RX-01 | Prescription history | Doctor, Patient | `prescription_history_tracking` | `PrescriptionsView` |
| RX-02 | Digital prescription creator | Doctor | `digital_prescription_creator` | create flow in `PrescriptionsView` |
| RX-03 | Prescription detail / edit | Doctor | — | detail in `PrescriptionsView` |
| TPL-01 | Prescription templates library | Doctor | — | — |
| TPL-02 | Template create / edit | Doctor | — | — |
| VIT-01 | Vitals entry (per appointment) | Doctor, Staff | — | `VitalSignsView` |
| VIT-02 | Patient vitals & clinical trends | Doctor, Patient | `patient_vitals_clinical_trends` | charts in `VitalSignsView` |
| REV-01 | Submit review | Patient | — | — |
| REV-02 | Reviews list (public) | Public | partial in DOC-06 | — |

### 1.7 Lab reports

| ID | Screen | Roles | Stitch ref | Figma ref |
|----|--------|-------|------------|-----------|
| LAB-01 | Diagnostic lab reports hub | Staff, Patient | `diagnostic_lab_reports_hub` | `LabReportsView` |
| LAB-02 | Lab report upload | Staff | — | upload in `LabReportsView` |
| LAB-03 | Lab report review | Doctor | — | review action in `LabReportsView` |

### 1.8 Billing

| ID | Screen | Roles | Stitch ref | Figma ref |
|----|--------|-------|------------|-----------|
| BIL-01 | Financial billing & invoices list | Staff, Patient | `financial_billing_invoices` | `BillingView` |
| BIL-02 | Detailed invoice statement | Staff, Patient | `detailed_invoice_statement` | invoice detail in `BillingView` |
| BIL-03 | Record payment | Staff | — | payment modal in `BillingView` |
| BIL-04 | Edit pending invoice | Staff | — | — |

### 1.9 Operations & system

| ID | Screen | Roles | Stitch ref | Figma ref |
|----|--------|-------|------------|-----------|
| NTF-01 | Notification center | All | `notification_center_real_time_alerts` | `NotificationsView` |
| MSG-01 | Staff messaging | Clinical | `staff_messaging_team_collaboration` | `MessagingView` |
| AUD-01 | Audit logs & compliance | Admin | `audit_logs_compliance_tracking` | `AuditLogsView` |
| EXP-01 | CSV exports | Staff | export button in AUD-01 | — |
| SET-01 | Profile & settings | All | — | `ProfileSettingsView` |

### 1.10 System / error

| ID | Screen | Roles | Stitch ref | Figma ref |
|----|--------|-------|------------|-----------|
| SYS-01 | Unauthorized (403) | All | — | — |
| SYS-02 | Not found (404) | All | — | — |
| SYS-03 | Global loading / empty states | All | Stitch `DESIGN.md` | Figma `EmptyState`, `Skeleton` |

**Total: 52 screens** (29 from Stitch + 19 Figma views − overlaps + 12 net-new gaps)

---

## 2. Route map

### 2.1 Public routes

| Path | Screen ID | Guard |
|------|-----------|-------|
| `/auth/login` | AUTH-01 | `guestGuard` |
| `/auth/register` | AUTH-02 | `guestGuard` |
| `/auth/forgot-password` | AUTH-03 | `guestGuard` |
| `/doctors` | DOC-07 | none (anonymous browse) |
| `/doctors/:id` | DOC-07 | none |
| `/reviews` | REV-02 | none |

### 2.2 Authenticated shell (`AppShellComponent`)

All routes below use `authGuard` + `roleGuard` where noted. Layout: Stitch sidebar + Figma top header.

#### Admin (`roleGuard: Admin`)

| Path | Screen ID |
|------|-----------|
| `/admin/dashboard` | DASH-01 |
| `/admin/analytics` | DASH-02, DASH-03, DASH-04 (tabbed) |
| `/admin/users` | USR-01 |
| `/admin/doctors` | DOC-01 |
| `/admin/doctors/new` | DOC-03 |
| `/admin/doctors/:id` | DOC-02 |
| `/admin/doctors/:id/schedules` | DOC-04 |
| `/admin/patients` | PAT-01 |
| `/admin/patients/new` | PAT-03 |
| `/admin/patients/:id` | PAT-02 |
| `/admin/appointments` | APT-01 |
| `/admin/appointments/calendar` | APT-02 |
| `/admin/appointments/new` | APT-04 |
| `/admin/appointments/:id` | APT-03 |
| `/admin/billing` | BIL-01 |
| `/admin/billing/invoices/:id` | BIL-02 |
| `/admin/lab-reports` | LAB-01 |
| `/admin/audit-logs` | AUD-01 |
| `/admin/exports` | EXP-01 |
| `/admin/notifications` | NTF-01 |
| `/admin/messages` | MSG-01 |
| `/admin/settings` | SET-01 |

#### Doctor (`roleGuard: Doctor`)

| Path | Screen ID |
|------|-----------|
| `/doctor/dashboard` | DASH-05, DASH-06 |
| `/doctor/appointments` | APT-01 |
| `/doctor/appointments/:id` | APT-03 |
| `/doctor/patients` | PAT-01 (scoped) |
| `/doctor/patients/:id` | PAT-02 |
| `/doctor/prescriptions` | RX-01 |
| `/doctor/prescriptions/new` | RX-02 |
| `/doctor/prescriptions/:id` | RX-03 |
| `/doctor/templates` | TPL-01 |
| `/doctor/templates/new` | TPL-02 |
| `/doctor/templates/:id` | TPL-02 |
| `/doctor/lab-reports` | LAB-01 |
| `/doctor/lab-reports/:id/review` | LAB-03 |
| `/doctor/vitals` | VIT-01 |
| `/doctor/vitals/trends/:patientId` | VIT-02 |
| `/doctor/leaves` | DOC-05 |
| `/doctor/profile` | DOC-02 |
| `/doctor/performance` | DOC-06 |
| `/doctor/notifications` | NTF-01 |
| `/doctor/messages` | MSG-01 |
| `/doctor/settings` | SET-01 |

#### Patient (`roleGuard: Patient`)

| Path | Screen ID |
|------|-----------|
| `/patient/dashboard` | DASH-07 |
| `/patient/appointments` | APT-01 |
| `/patient/appointments/book` | APT-04 |
| `/patient/appointments/:id` | APT-03 |
| `/patient/waitlist` | WLT-01 |
| `/patient/records` | PAT-04 |
| `/patient/prescriptions` | RX-01 |
| `/patient/lab-reports` | LAB-01 |
| `/patient/vitals` | VIT-02 |
| `/patient/billing` | BIL-01 |
| `/patient/billing/invoices/:id` | BIL-02 |
| `/patient/reviews/new` | REV-01 |
| `/patient/notifications` | NTF-01 |
| `/patient/settings` | SET-01 |

#### Receptionist (`roleGuard: Receptionist`)

| Path | Screen ID |
|------|-----------|
| `/reception/dashboard` | DASH-09 |
| `/reception/appointments` | APT-01 |
| `/reception/appointments/calendar` | APT-02 |
| `/reception/appointments/new` | APT-04 |
| `/reception/appointments/:id` | APT-03 |
| `/reception/patients` | PAT-01 |
| `/reception/patients/new` | PAT-03 |
| `/reception/patients/:id` | PAT-02 |
| `/reception/doctors` | DOC-01 |
| `/reception/billing` | BIL-01 |
| `/reception/billing/invoices/:id` | BIL-02 |
| `/reception/lab-reports` | LAB-01 |
| `/reception/lab-reports/upload` | LAB-02 |
| `/reception/waitlist` | WLT-01 |
| `/reception/notifications` | NTF-01 |
| `/reception/messages` | MSG-01 |
| `/reception/exports` | EXP-01 |
| `/reception/settings` | SET-01 |

### 2.3 Post-login redirect

| Role | Default route |
|------|---------------|
| Admin | `/admin/dashboard` |
| Doctor | `/doctor/dashboard` |
| Patient | `/patient/dashboard` |
| Receptionist | `/reception/dashboard` |

### 2.4 Route architecture notes

- **Lazy-loaded feature routes** per domain (appointments, billing, etc.)
- **Role prefix** (`/admin`, `/doctor`, …) keeps guards simple and URLs eval-friendly
- **Shared feature components** reused across roles with `data.scope` resolving API filters
- **Wildcard:** `**` → SYS-02

---

## 3. Angular 19 folder structure

```
frontend/hapm-web/
├── angular.json
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── proxy.conf.json                    # dev proxy → http://localhost:5080
├── public/
│   ├── favicon.ico
│   └── assets/
│       └── illustrations/             # login hero (from Figma)
└── src/
    ├── index.html
    ├── main.ts
    ├── styles/
    │   ├── styles.css                 # Tailwind entry
    │   ├── theme.css                  # Figma tokens → CSS variables
    │   └── typography.css             # Stitch + Figma type scale
    └── app/
        ├── app.config.ts              # provideRouter, provideHttpClient, interceptors
        ├── app.routes.ts              # top-level routes + lazy children
        ├── app.component.ts
        │
        ├── core/                      # singleton services, guards, interceptors
        │   ├── auth/
        │   │   ├── auth.service.ts
        │   │   ├── auth.guard.ts
        │   │   ├── guest.guard.ts
        │   │   ├── role.guard.ts
        │   │   ├── token-storage.service.ts
        │   │   └── auth.models.ts
        │   ├── api/
        │   │   ├── api-client.service.ts
        │   │   ├── api-error.interceptor.ts
        │   │   ├── auth-token.interceptor.ts
        │   │   └── api.models.ts      # PagedResult, ProblemDetails
        │   ├── realtime/
        │   │   ├── signalr.service.ts
        │   │   ├── notifications-hub.service.ts
        │   │   ├── appointments-hub.service.ts
        │   │   └── chat-hub.service.ts
        │   ├── layout/
        │   │   └── breadcrumb.service.ts
        │   └── config/
        │       └── app-config.ts      # apiBaseUrl, hubUrls
        │
        ├── shared/                    # dumb UI + pipes; no feature logic
        │   ├── components/
        │   │   ├── ui/                # Figma-aligned primitives
        │   │   │   ├── button/
        │   │   │   ├── card/
        │   │   │   ├── badge/
        │   │   │   ├── input/
        │   │   │   ├── select/
        │   │   │   ├── textarea/
        │   │   │   ├── checkbox/
        │   │   │   ├── dialog/
        │   │   │   ├── tabs/
        │   │   │   ├── table/
        │   │   │   ├── pagination/
        │   │   │   ├── avatar/
        │   │   │   ├── skeleton/
        │   │   │   ├── empty-state/
        │   │   │   ├── search-input/
        │   │   │   ├── status-badge/
        │   │   │   ├── kpi-card/
        │   │   │   ├── page-header/
        │   │   │   ├── filter-bar/
        │   │   │   ├── stepper/
        │   │   │   └── file-upload/
        │   │   ├── data-table/        # Stitch table pattern + Figma polish
        │   │   ├── confirm-dialog/
        │   │   └── toast/
        │   ├── pipes/
        │   │   ├── currency-inr.pipe.ts
        │   │   ├── appointment-status.pipe.ts
        │   │   └── relative-time.pipe.ts
        │   ├── directives/
        │   │   └── autofocus.directive.ts
        │   └── models/
        │       ├── pagination.model.ts
        │       └── enums.ts           # mirrors API string enums
        │
        ├── layout/
        │   ├── auth-layout/           # Figma login split panel
        │   │   └── auth-layout.component.ts
        │   ├── app-shell/             # Stitch sidebar + Figma top nav
        │   │   ├── app-shell.component.ts
        │   │   ├── sidebar/
        │   │   │   ├── sidebar.component.ts
        │   │   │   └── nav-config.ts  # from Figma NAV_CONFIG, adapted
        │   │   ├── top-nav/
        │   │   │   └── top-nav.component.ts
        │   │   └── mobile-drawer/
        │   │       └── mobile-drawer.component.ts
        │   └── public-layout/
        │       └── public-layout.component.ts
        │
        └── features/
            ├── auth/
            │   ├── auth.routes.ts
            │   ├── login/
            │   ├── register/
            │   ├── forgot-password/
            │   └── change-password/
            ├── dashboard/
            │   ├── dashboard.routes.ts
            │   ├── admin-dashboard/
            │   ├── doctor-dashboard/
            │   ├── patient-dashboard/
            │   ├── receptionist-dashboard/
            │   └── analytics/         # peak-hours, revenue charts
            ├── users/
            ├── doctors/
            ├── patients/
            ├── appointments/
            ├── waitlist/
            ├── prescriptions/
            ├── prescription-templates/
            ├── lab-reports/
            ├── billing/
            ├── vitals/
            ├── reviews/
            ├── notifications/
            ├── staff-messages/
            ├── audit-logs/
            ├── exports/
            └── settings/
```

**Conventions**

- Standalone components only (Angular 19 default)
- Each feature folder: `*.routes.ts`, `*.service.ts`, `*.models.ts`, page components
- Smart/dumb split: pages orchestrate; `shared/ui` holds presentation
- Signals for local UI state; RxJS for HTTP and SignalR streams

---

## 4. Shared component architecture

### 4.1 Layer model

```
Page Component (feature)
    ├── layout slots (app-shell)
    ├── domain containers (AppointmentTableContainer)
    └── shared/ui primitives (Button, Card, Badge, …)
```

### 4.2 UI primitives (Figma source → Angular + Tailwind)

| Component | Figma reference | Tailwind / behavior |
|-----------|-----------------|-------------------|
| `ButtonComponent` | `button.tsx` variants | `default`, `outline`, `secondary`, `ghost`, `destructive`, `link`; sizes `sm/default/lg/icon` |
| `CardComponent` | `card.tsx` | `rounded-xl border bg-card`; sub-slots: header, title, description, content, footer |
| `BadgeComponent` | `badge.tsx` + Stitch status rules | Semantic appointment/invoice status colors |
| `InputComponent` | `input.tsx` | `h-9`, `bg-input-background`, `focus-visible:ring-ring/50` |
| `SelectComponent` | `select.tsx` | Native or headless; label above field (Stitch rule) |
| `TableComponent` | `table.tsx` | Sticky header, `hover:bg-muted/50`, compact 40px / standard 48px rows |
| `DialogComponent` | `dialog.tsx` | Level-2 elevation per Stitch |
| `TabsComponent` | `tabs.tsx` | List/calendar toggle on appointments |
| `PaginationComponent` | `pagination.tsx` | Wired to `PagedResult` (page, pageSize max 100) |
| `AvatarComponent` | Figma `Avatar` helper | Initials + color hash |
| `SkeletonComponent` | `skeleton.tsx` | Table/card loading |
| `EmptyStateComponent` | Figma `EmptyState` | Icon + title + message + CTA |

### 4.3 Composite shared components (Stitch structure + Figma polish)

| Component | Purpose | Stitch | Figma |
|-----------|---------|--------|-------|
| `PageHeaderComponent` | Title, subtitle, primary action | All list pages | `SectionHeader` |
| `KpiCardComponent` | Metric + trend | Dashboard rows | `KPICard` |
| `FilterBarComponent` | Search + dropdown filters | Billing, audit, appointments | filter rows in views |
| `DataTableComponent` | Sortable paginated table | All directory screens | `TableHead` + rows |
| `StatusBadgeComponent` | Appointment/invoice/lab status | DESIGN.md mapping | `apptStatusBadge` |
| `StepperComponent` | Multi-step forms | `schedule_new_appointment` | — |
| `FileUploadComponent` | Lab report multipart | `diagnostic_lab_reports_hub` | upload in `LabReportsView` |
| `TimelineComponent` | Audit activity sidebar | `audit_logs` right panel | — |
| `ChatThreadComponent` | Staff messages | `staff_messaging` | `MessagingView` |
| `NotificationFeedComponent` | Grouped alerts | `notification_center` | `NotificationsView` |
| `ChartCardComponent` | Analytics charts | Analytics dashboards | Recharts patterns in Figma |

### 4.4 Component rules

1. **Presentational only** in `shared/` — inputs via `input()`, outputs via `output()`
2. **Status badges** — single `StatusBadgeComponent` maps API enum strings → Stitch semantic colors
3. **Tables** — always support `empty`, `loading`, `error` states
4. **Forms** — Reactive Forms; labels above fields; inline validation messages
5. **No API calls** inside `shared/ui`

---

## 5. Layout architecture

### 5.1 Shell composition (Stitch structure, Figma styling)

```
┌──────────────────────────────────────────────────────────────────┐
│ AppShell                                                         │
│ ┌────────────┬─────────────────────────────────────────────────┐ │
│ │ Sidebar    │ TopNav (breadcrumb, search, notif, profile)     │ │
│ │ 260px      ├─────────────────────────────────────────────────┤ │
│ │ collapsible│ Main content (max-w-[1440px] mx-auto p-5)       │ │
│ │ 64px mini  │   PageHeader                                    │ │
│ │            │   [ optional FilterBar ]                        │ │
│ │            │   [ page content grid ]                         │ │
│ └────────────┴─────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### 5.2 Sidebar (Stitch `admin_dashboard_hapm_system`)

- Width: **260px** expanded / **64px** collapsed (Stitch DESIGN.md)
- Sections: logo → grouped nav (Figma `NAV_CONFIG` labels) → user footer
- Active item: teal tint background (Stitch) + Figma `ring` focus for a11y
- **Light sidebar** (white/`surface-container-low`) — not Figma dark navy; Figma dark tokens repurposed for text contrast only
- Mobile: off-canvas drawer (`< lg`)

### 5.3 Top navigation (Figma `TopNav`)

- Height: `h-14`
- Breadcrumb: `HAPM / {page title}`
- Global search: debounced; context-aware placeholder
- Notification bell → unread count from API + SignalR
- Profile menu: settings, change password, logout
- **Remove** Figma dev-only role switcher in production builds

### 5.4 Auth layout (Figma `LoginScreen`)

- Split panel: 52% brand gradient left / form right
- Full-width form stack on mobile
- No sidebar

### 5.5 Content grid (Stitch)

- 12-column fluid grid, `max-width: 1440px`
- Dashboard: `4× KPI` → `2× chart` → `1× table` (Stitch `admin_dashboard_hapm_system`)
- List pages: header → filters → full-width table
- Detail pages: `2/3 main + 1/3 sidebar` (Stitch `appointment_details_tracking`)
- Wizard: centered `max-w-2xl` card (Stitch `schedule_new_appointment`)

### 5.6 Responsiveness (Figma breakpoints)

| Breakpoint | Behavior |
|------------|----------|
| `< md` | Sidebar → drawer; tables → card list or horizontal scroll |
| `md–lg` | Sidebar collapsed by default |
| `≥ lg` | Full shell |
| `≥ xl` | 12-col grid with gutters (Stitch 24px) |

---

## 6. Feature module breakdown

Each feature is a lazy route bundle with `*.routes.ts`, `*.service.ts`, `*.models.ts`.

| Feature | Pages | API base | Realtime | Roles |
|---------|-------|----------|----------|-------|
| **auth** | login, register, forgot, change-password | `/api/auth` | — | public / all |
| **dashboard** | 4 role dashboards + analytics | `/api/dashboard` | — | all |
| **users** | user list, create receptionist, reset password | `/api/users` | — | Admin |
| **doctors** | directory, profile, schedules, leaves, performance | `/api/doctors` | — | Admin, Doctor, Receptionist, Public |
| **patients** | directory, profile, registration, my records | `/api/patients` | — | all |
| **appointments** | list, calendar, detail, wizard, status actions | `/api/appointments` | `AppointmentsHub` | all |
| **waitlist** | join, list, cancel | `/api/waitlist` | via notifications | Patient, Staff |
| **prescriptions** | list, create, edit, by-appointment | `/api/prescriptions` | — | Doctor, Patient |
| **prescription-templates** | library, CRUD | `/api/prescription-templates` | — | Doctor |
| **lab-reports** | hub, upload, download, review | `/api/lab-reports` | — | Staff, Doctor, Patient |
| **billing** | invoices, detail, payments, edit | `/api/invoices` | — | Staff, Patient |
| **vitals** | record, list, trends | `/api/vitals` | — | Doctor, Staff, Patient |
| **reviews** | list (public), submit | `/api/reviews` | — | Patient, Public |
| **notifications** | feed, mark read | `/api/notifications` | `NotificationsHub` | all |
| **staff-messages** | inbox, send to doctor, broadcast | `/api/staff-messages` | `ChatHub` | Clinical |
| **audit-logs** | paginated log, filters | `/api/audit-logs` | — | Admin |
| **exports** | CSV download triggers | `/api/exports` | — | Staff |
| **settings** | profile, password, preferences | `/api/auth/me`, change-password | — | all |

### Feature dependency graph

```
auth ──► all features
dashboard ──► analytics charts
appointments ──► vitals, prescriptions, billing (per appointment)
patients ──► appointments, lab-reports, billing
doctors ──► appointments, leaves, templates
notifications ◄── SignalR (all modules push via backend)
```

---

## 7. Design system specification

### 7.1 Merged color tokens (Tailwind `@theme`)

Primary source: **Figma `theme.css`**, semantic status colors from **Stitch `DESIGN.md`**.

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#F1F5F9` | Page canvas (Figma) |
| `--foreground` | `#0F172A` | Body text |
| `--card` | `#FFFFFF` | Cards, table surface |
| `--primary` | `#1D4ED8` | Primary buttons, links (Figma) |
| `--accent` | `#0D9488` | Secondary actions, charts (Figma) |
| `--secondary` | `#EFF6FF` | Tinted backgrounds |
| `--muted` | `#F8FAFC` | Table header, input bg |
| `--muted-foreground` | `#64748B` | Secondary text |
| `--destructive` | `#DC2626` | Errors, cancelled |
| `--border` | `rgba(148,163,184,0.25)` | Card/table borders |
| `--ring` | `#3B82F6` | Focus ring |
| `--sidebar` | `#FFFFFF` | Light sidebar bg (Stitch override) |
| `--sidebar-active` | `#E6FFFA` / teal tint | Active nav (Stitch) |
| `--success` | `#10B981` | Completed, paid |
| `--warning` | `#F59E0B` | Pending, partial |
| `--info` | `#3B82F6` | Confirmed, scheduled |

### 7.2 Typography

| Token | Size | Weight | Source |
|-------|------|--------|--------|
| `display` | 36px / 44px lh | 700 | Stitch |
| `headline-lg` | 28px | 600 | Stitch |
| `headline-md` | 20px | 600 | Stitch |
| `body` | 15px (Figma base) / 14px md | 400 | Figma + Stitch |
| `label` | 12px | 500 | Stitch |
| `caption` | 11px | 600 | Stitch |

- Font: **Inter** (`--font-sans`)
- Mono: **JetBrains Mono** for IDs, MRNs, invoice numbers
- Tabular nums (`tnum`) on all numeric columns (Stitch rule)

### 7.3 Spacing & radius

| Rule | Value |
|------|-------|
| Base unit | 4px (Stitch) |
| Content padding | `p-5` (20px) — Figma main area |
| Card padding | `p-6` — Figma Card |
| Gutter | 24px — Stitch |
| Container max | 1440px — Stitch |
| Radius sm | 4px — buttons, inputs |
| Radius lg | 8px — cards (Stitch `rounded-lg`) |
| Radius xl | 12px — Figma cards `rounded-xl` (use xl for outer cards) |

### 7.4 Elevation

| Level | Treatment |
|-------|-----------|
| 0 | `bg-background` |
| 1 | `bg-card border border-border` — no shadow (Stitch ghost-bordered) |
| 2 | `shadow-md` popovers/modals — Figma `shadow-sm` on dropdowns |

### 7.5 Status badge mapping (API enums)

**AppointmentStatus**

| API value | Badge color | Stitch label |
|-----------|-------------|--------------|
| Pending | warning | Pending |
| Confirmed | info | Scheduled |
| CheckedIn | secondary | Checked In |
| Completed | success | Completed |
| Cancelled | destructive | Cancelled |
| NoShow | destructive | No Show |

**InvoiceStatus**

| API value | Badge |
|-----------|-------|
| Pending | warning |
| PartiallyPaid | info |
| Paid | success |
| Cancelled | destructive |

### 7.6 Form patterns (Figma + Stitch)

- Label above field, `text-sm font-medium`
- Input height `h-9`, `rounded-md`
- Focus: `ring-[3px] ring-ring/50`
- Error: `aria-invalid` + destructive ring
- Required marker: `*` in muted red
- Wizard: Stitch 4-step stepper with Figma button styles

### 7.7 Table patterns

- Sticky header
- Row height 48px (40px compact mode for clinical dashboards)
- Hover: `bg-muted/50` (Figma)
- Actions column: icon buttons or `⋯` menu
- Pagination footer: “Showing X–Y of Z” (Stitch billing screen)
- Sort indicators on clickable headers

---

## 8. Backend module → frontend screen mapping

| Backend module | API prefix | Frontend screens | Primary roles |
|----------------|------------|------------------|---------------|
| **Authentication** | `/api/auth` | AUTH-01–04, SET-01 | all |
| **Users** | `/api/users` | USR-01 | Admin |
| **Doctors** | `/api/doctors` | DOC-01–07, DASH-05/06 | Admin, Doctor, Receptionist, Public |
| **Patients** | `/api/patients` | PAT-01–05 | all |
| **Appointments** | `/api/appointments` | APT-01–05, DASH-* | all |
| **Waitlists** | `/api/waitlist` | WLT-01 | Patient, Staff |
| **Prescriptions** | `/api/prescriptions` | RX-01–03 | Doctor, Patient |
| **Prescription Templates** | `/api/prescription-templates` | TPL-01–02 | Doctor |
| **Lab Reports** | `/api/lab-reports` | LAB-01–03 | Staff, Doctor, Patient |
| **Billing** | `/api/invoices` | BIL-01–04, DASH-* | Staff, Patient |
| **Notifications** | `/api/notifications` | NTF-01 | all |
| **Staff Messaging** | `/api/staff-messages` | MSG-01 | Clinical |
| **Vitals** | `/api/vitals` | VIT-01–02 | Doctor, Staff, Patient |
| **Reviews** | `/api/reviews` | REV-01–02, DOC-06 | Patient, Public |
| **Audit Logs** | `/api/audit-logs` | AUD-01 | Admin |
| **Dashboards** | `/api/dashboard` | DASH-01–04 | Admin |
| **Exports** | `/api/exports` | EXP-01 | Staff |

### SignalR hub mapping

| Hub | URL | Frontend consumer |
|-----|-----|-----------------|
| Notifications | `/hubs/notifications` | `NotificationFeedComponent`, top-nav bell |
| Appointments | `/hubs/appointments` | Appointment list/board live status |
| Chat | `/hubs/chat` | `ChatThreadComponent`, MSG-01 |

JWT passed as `?access_token=` on hub connect (per `docs/SignalR.md`).

### API integration patterns

- Base URL: `environment.apiUrl` (default `http://localhost:5080`)
- Auth: `Authorization: Bearer` on all except public routes
- Refresh: interceptor calls `/api/auth/refresh` on 401, retry once
- Lists: `?page=&pageSize=&search=&sortBy=&sortDescending=`
- Errors: map `ProblemDetails` → toast
- File upload: `multipart/form-data` for lab reports
- CSV export: `window.open` or blob download from `/api/exports/*`

---

## 9. Missing screens to add

These are required for full backend coverage but absent from both design exports:

| ID | Screen | Reason |
|----|--------|--------|
| **WLT-01** | Waitlist join & management | Backend has `/api/waitlist`; no Stitch/Figma screen |
| **TPL-01/02** | Prescription templates library & editor | Backend CRUD; not in Stitch/Figma |
| **DOC-04** | Doctor weekly schedule editor | API `PUT /doctors/{id}/schedules`; only partial in DOC-02 |
| **DOC-05** | Doctor leave management | API leave endpoints; not designed |
| **APT-05** | Reschedule flow | API `PUT /appointments/{id}/reschedule`; no dedicated UI |
| **BIL-04** | Edit pending invoice | API `PUT /invoices/{id}`; not explicit in designs |
| **EXP-01** | Exports page (or admin panel section) | API `/api/exports/*`; only button on audit screen |
| **REV-01** | Submit review form | API `POST /reviews`; no form screen |
| **AUTH-02** | Patient registration | API `/api/auth/register`; Figma has no dedicated page |
| **SYS-01/02** | 403 / 404 error pages | Standard production requirement |
| **ONB-01** | First-run / empty dashboard states | Both assume seeded data |

### Stitch screens to simplify (backend mismatch)

| Stitch screen | Issue | Implementation note |
|---------------|-------|---------------------|
| `staff_messaging_team_collaboration` | Slack-style channels | Map to HAPM: doctor room + admin broadcast only |
| `notification_center` | Clinical alert types not in API | Use actual `NotificationType` enum |
| `audit_logs` | Severity / IP columns | Show fields API actually returns |
| Analytics KPIs | Bed occupancy, EHR uptime | Replace with `/api/dashboard/stats` fields |

### Duplicate Stitch screens to merge

| Keep | Merge / drop |
|------|----------------|
| `admin_dashboard_hapm_system` | `admin_dashboard_analytics_overview` → tab on analytics route |
| `doctor_dashboard_hapm_system` | `doctor_dashboard_clinical_workspace` → widgets on same page |
| `patient_portal_hapm_system` | `patient_dashboard_health_portal` |
| `receptionist_dashboard_hapm_system` | `receptionist_dashboard_front_desk_hub` |

---

## 10. Implementation phases (reference — no code yet)

| Phase | Scope |
|-------|-------|
| **P0** | Scaffold, design tokens, auth, app shell, role routing |
| **P1** | Dashboards, patients, doctors, appointments (list + wizard + detail) |
| **P2** | Prescriptions, templates, vitals, lab reports, billing |
| **P3** | Notifications + SignalR, staff messages, waitlist, reviews |
| **P4** | Admin: users, audit, exports, analytics |
| **P5** | Polish: responsive, empty states, error pages, accessibility audit |

---

## 11. Key files to reference during build

| Purpose | Path |
|---------|------|
| Stitch layouts | `design/stitch-export/*/screen.png` |
| Stitch tokens | `design/stitch-export/clinical_precision/DESIGN.md` |
| Figma colors/type | `design/figma-export/src/styles/theme.css` |
| Figma navigation | `design/figma-export/src/app/App.tsx` → `NAV_CONFIG` |
| Figma login | `design/figma-export/src/app/App.tsx` → `LoginScreen` |
| Figma components | `design/figma-export/src/app/components/ui/*` |
| API contracts | `docs/API_Documentation.md` |
| SignalR | `docs/SignalR.md` |
| Backend roles | `src/HAPM.API/Security/Roles.cs` |

---

*Document version: 1.0 — analysis only, no implementation code.*
