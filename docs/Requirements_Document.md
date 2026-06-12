# Hospital Appointment & Patient Management System (HAPM)

## Requirements Document

**Technology Stack:** ASP.NET Core 8 Web API, PostgreSQL 15, Entity Framework Core 8, JWT, Serilog

---

## 1. Introduction

### 1.1 Purpose

This document defines the functional and non-functional requirements for the HAPM backend API — an enterprise-grade Hospital Appointment & Patient Management System.

### 1.2 Scope

The system supports hospital operations: doctor management (profiles, weekly schedules, leave), patient registration, appointment booking with conflict detection, vital signs, prescriptions, lab report files, billing with partial payments, in-app notifications with reminders, waitlisting, patient reviews, auditing, and reporting exports. The Angular frontend and Azure integrations (Blob Storage, Key Vault, Notification Hub) are planned for future phases.

### 1.3 Intended Users

| Role         | Description                                                                          |
| ------------ | ------------------------------------------------------------------------------------ |
| Admin        | Full system access: user/doctor management, billing, audit logs, exports, dashboard   |
| Doctor       | Own appointments, prescriptions, vitals, lab report review, own leave management      |
| Receptionist | Patient registration, appointment management, billing/payments, lab uploads, exports  |
| Patient      | Self-registration, booking, own records/prescriptions/reports/invoices, reviews       |

---

## 2. Functional Requirements

### 2.1 Authentication & Authorization

| ID         | Requirement                                                                     | Priority |
| ---------- | ------------------------------------------------------------------------------- | -------- |
| FR-AUTH-01 | Patients shall self-register with email, password and profile details           | High     |
| FR-AUTH-02 | Users shall login and receive a JWT access token (30 min)                       | High     |
| FR-AUTH-03 | System shall issue refresh tokens (7 days) with rotation on every refresh       | High     |
| FR-AUTH-04 | Logout shall revoke the refresh token; deactivation shall revoke all sessions   | High     |
| FR-AUTH-05 | Users shall change their own password; admins shall reset any password          | Medium   |
| FR-AUTH-06 | API shall enforce role-based access (Admin, Doctor, Patient, Receptionist)      | High     |
| FR-AUTH-07 | Data shall be scoped: patients/doctors only ever see their own records          | High     |
| FR-AUTH-08 | Auth endpoints shall be rate-limited (10 req/min per IP) for brute-force defence | High     |

### 2.2 Doctor Management

| ID        | Requirement                                                                          | Priority |
| --------- | ------------------------------------------------------------------------------------ | -------- |
| FR-DOC-01 | Admin shall create doctor accounts with profile (specialization, license, fee, etc.) | High     |
| FR-DOC-02 | License numbers shall be unique                                                       | High     |
| FR-DOC-03 | Doctors shall have weekly recurring schedules (day, window, slot duration)            | High     |
| FR-DOC-04 | System shall compute free bookable slots per doctor per date                          | High     |
| FR-DOC-05 | Doctor listing shall be public, with search, filters, sorting and pagination          | High     |
| FR-DOC-06 | Admin or the doctor shall register leave windows that block booking                   | High     |
| FR-DOC-07 | Leave creation shall be rejected while active appointments exist in the period        | High     |
| FR-DOC-08 | Admin shall deactivate doctors (blocked while upcoming appointments exist)            | Medium   |
| FR-DOC-09 | Listings shall show each doctor's average rating and review count                     | Medium   |
| FR-DOC-10 | Doctors shall update their own profile (name, phone, room, biography) via a dedicated endpoint | Medium |

### 2.3 Patient Registration

| ID        | Requirement                                                                       | Priority |
| --------- | ---------------------------------------------------------------------------------- | -------- |
| FR-PAT-01 | Patients shall self-register; staff shall register walk-ins                        | High     |
| FR-PAT-02 | System shall auto-generate Medical Record Numbers (`MRN-YYYY-NNNNNN`)              | High     |
| FR-PAT-03 | System shall search patients by name, email, MRN or phone                          | High     |
| FR-PAT-04 | Patients shall update their own profile; staff may update any                      | Medium   |
| FR-PAT-05 | System shall expose a consolidated medical history (appointments + prescriptions + lab reports) | High |

### 2.4 Appointment Booking

| ID        | Requirement                                                                              | Priority |
| --------- | ----------------------------------------------------------------------------------------- | -------- |
| FR-APT-01 | Slots shall be validated against the doctor's schedule and aligned to the slot grid       | High     |
| FR-APT-02 | Double booking shall be prevented for both the doctor and the patient (overlap detection) | High     |
| FR-APT-03 | Lifecycle: `Pending → Confirmed → CheckedIn → Completed`, plus `Cancelled` / `NoShow`, with legal-transition enforcement | High |
| FR-APT-04 | Patients shall book for themselves; staff shall book on behalf of patients                | High     |
| FR-APT-05 | Appointments shall be reschedulable (re-validated) and cancellable with a reason          | High     |
| FR-APT-06 | Booking shall be blocked during doctor leave                                              | High     |
| FR-APT-07 | Patients shall join a waitlist per doctor/date and be auto-notified on cancellations      | Medium   |
| FR-APT-08 | Patients shall be notified when an appointment is marked completed                        | Medium   |

### 2.5 Clinical Records

| ID        | Requirement                                                                    | Priority |
| --------- | ------------------------------------------------------------------------------ | -------- |
| FR-CLN-01 | Doctors shall issue one prescription per appointment (checked-in/completed only) | High   |
| FR-CLN-02 | Prescriptions shall contain multiple medicine items (dosage, frequency, duration) | High  |
| FR-CLN-03 | Clinical staff shall record vital signs per visit (temp, pulse, BP, SpO2, height/weight) | High |
| FR-CLN-04 | BMI shall be computed automatically from height and weight                      | Medium   |
| FR-CLN-05 | Doctors shall save named prescription templates (diagnosis + medicines) and optionally apply them when prescribing | Medium |
| FR-CLN-06 | Template names shall be unique per doctor; templates shall be private to their owner | Medium |
| FR-CLN-07 | Patients shall be auto-notified when a prescription follow-up date is within 2 days | Medium |

### 2.6 Lab Reports

| ID        | Requirement                                                                       | Priority |
| --------- | ---------------------------------------------------------------------------------- | -------- |
| FR-LAB-01 | Clinical staff shall upload report files (.pdf/.jpg/.jpeg/.png/.dcm, max 10 MB)    | High     |
| FR-LAB-02 | Files shall be stored on local disk behind an `IFileStorageService` abstraction (Azure Blob-ready) | High |
| FR-LAB-03 | Downloads shall stream the file with access control (patients: own only)           | High     |
| FR-LAB-04 | Doctors shall mark reports reviewed with remarks                                    | Medium   |
| FR-LAB-05 | Clinical staff shall update report metadata and optionally replace the uploaded file | Medium   |

### 2.7 Billing

| ID        | Requirement                                                                          | Priority |
| --------- | ------------------------------------------------------------------------------------- | -------- |
| FR-BIL-01 | Staff shall create invoices with auto-generated numbers (`INV-YYYY-NNNNNN`)           | High     |
| FR-BIL-02 | Linking an appointment shall auto-add the consultation fee as a line item             | High     |
| FR-BIL-03 | Totals shall compute: subtotal + tax% − discount                                       | High     |
| FR-BIL-04 | Staff shall record partial or full payments, each with a receipt (`RCP-YYYY-NNNNNN`)  | High     |
| FR-BIL-05 | Invoice status shall flow `Pending → PartiallyPaid → Paid`; overpayment rejected      | High     |
| FR-BIL-06 | Dashboard revenue shall reflect money actually received (payments)                     | Medium   |
| FR-BIL-07 | Staff shall update pending invoices (line items, tax, discount) before any payment is recorded | Medium |

### 2.8 Notifications

| ID        | Requirement                                                                            | Priority |
| --------- | ---------------------------------------------------------------------------------------- | -------- |
| FR-NOT-01 | In-app notifications shall be stored in PostgreSQL per user                              | High     |
| FR-NOT-02 | Triggers: booking, confirmation, completion, cancellation, reschedule, prescription, lab report, invoice, payment, waitlist slot | High |
| FR-NOT-03 | A background service shall send reminders for confirmed appointments within 24 h (no duplicates) | High |
| FR-NOT-04 | Users shall see unread counts and mark notifications read (one / all)                    | Medium   |

### 2.9 Feedback & Ratings

| ID        | Requirement                                                              | Priority |
| --------- | -------------------------------------------------------------------------- | -------- |
| FR-REV-01 | Patients shall rate completed appointments (1–5 stars, optional comment)   | Medium   |
| FR-REV-02 | One review per appointment, enforced by unique constraint                  | Medium   |
| FR-REV-03 | Reviews shall be publicly readable per doctor                              | Low      |

### 2.10 Administration & Reporting

| ID        | Requirement                                                                            | Priority |
| --------- | ---------------------------------------------------------------------------------------- | -------- |
| FR-ADM-01 | Admin dashboard: headcounts, appointment load, status breakdown, revenue, top specializations | High |
| FR-ADM-02 | Admin shall manage user accounts (list, create receptionists, activate/deactivate, reset passwords) | High |
| FR-ADM-03 | Every create/update/delete shall be audit-logged automatically (user, entity, old/new values) | High |
| FR-ADM-04 | Audit log shall mask sensitive values (password hashes) and be queryable by admins       | High     |
| FR-ADM-05 | Staff shall export appointments, patients and invoices as CSV                            | Medium   |
| FR-ADM-06 | Admin shall view peak-hour appointment density (day-of-week × hour heatmap data)         | Medium   |
| FR-ADM-07 | Admin shall view received revenue grouped by doctor specialization                       | Medium   |
| FR-ADM-08 | Admin (and each doctor for themselves) shall view per-doctor performance metrics: appointment outcomes, no-show rate, average rating, prescription volume, distinct patients, revenue | Medium |

---

## 3. Non-Functional Requirements

| ID     | Requirement                                                                                   |
| ------ | ---------------------------------------------------------------------------------------------- |
| NFR-01 | Layered architecture: API → Application (services) → Repository/UoW → PostgreSQL               |
| NFR-02 | PostgreSQL 13+ with EF Core code-first migrations, applied automatically at startup            |
| NFR-03 | All list endpoints support pagination (`page`, `pageSize` ≤ 100), `search`, `sortBy`, `sortDescending` |
| NFR-04 | Passwords hashed with BCrypt (work factor 11); JWT signed with HMAC-SHA256                     |
| NFR-05 | Errors returned as RFC-7807 `ProblemDetails` with accurate status codes (400/401/403/404/409/429/500) |
| NFR-06 | Input validation via DataAnnotations enforced by `[ApiController]` model validation           |
| NFR-07 | Structured logging via Serilog (console + rolling files under `logs/`, 14-day retention)      |
| NFR-08 | Swagger/OpenAPI with JWT bearer support at `/swagger`                                         |
| NFR-09 | Rate limiting: 300 req/min per IP global, 10 req/min per IP on `/api/auth/*`                  |
| NFR-10 | Health endpoints: `/health` (incl. DB connectivity), `/health/live`                            |
| NFR-11 | Async/await end-to-end; cancellation tokens propagated to the database                         |
| NFR-12 | All timestamps stored in UTC; audit columns (`CreatedAtUtc`, `UpdatedAtUtc`) on every entity  |
| NFR-13 | Account deactivation (soft) instead of hard deletes for users/doctors/patients                 |
| NFR-14 | CORS restricted to configured frontend origins (default `http://localhost:4200`)               |
| NFR-15 | HTTPS redirection enabled outside Development                                                 |

---

## 4. System Modules

```
┌─────────────┐  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐
│    Auth     │  │   Doctors   │  │   Patients   │  │ Appointments│
│  + Users    │  │ + Schedules │  │ + History    │  │ + Waitlist  │
│             │  │ + Leave     │  │              │  │             │
└─────────────┘  └─────────────┘  └──────────────┘  └─────────────┘
┌─────────────┐  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐
│Prescriptions│  │ Lab Reports │  │   Billing    │  │   Vitals    │
│ + Templates │  │             │  │ + Payments   │  │             │
└─────────────┘  └─────────────┘  └──────────────┘  └─────────────┘
┌─────────────┐  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐
│Notifications│  │   Reviews   │  │  Dashboard   │  │ Audit Logs  │
│ + Reminders │  │             │  │ + Analytics  │  │             │
│ + Follow-ups│  │             │  │ + Exports    │  │             │
└─────────────┘  └─────────────┘  └──────────────┘  └─────────────┘
```

---

## 5. Out of Scope (Current Phase)

- Angular frontend
- Azure Blob Storage (local file storage behind `IFileStorageService` seam)
- Azure Key Vault (configuration/environment variables used instead)
- Azure Notification Hub / push delivery (in-app notifications only)
- Email/SMS notifications
- Inpatient (ward/bed) management, insurance/TPA billing

---

## 6. Assumptions & Constraints

- Single hospital deployment, single time zone (server local time used for slot logic)
- PostgreSQL reachable from the API host; database `hapm_db`
- JWT secret configured via `appsettings.json` for development; environment variables/secret store in production
- Seed data (admin, receptionist, two doctors with schedules, one patient) created automatically on first run
