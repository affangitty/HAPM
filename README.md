# Hospital Appointment & Patient Management System (HAPM)

Backend API for managing doctors, patients, appointments, prescriptions, lab reports and billing — built with **ASP.NET Core 8**, **PostgreSQL** and **Entity Framework Core** using a layered clean architecture with **JWT authentication** and **role-based access control**.

## Architecture

```
Client (Angular / Swagger / curl)
        │
        ▼
HAPM.API            – Controllers, JWT auth, Swagger, middleware, CORS
        │
        ▼
HAPM.Application    – Services (business logic), DTOs, validation, interfaces
        │
        ▼
HAPM.Infrastructure – EF Core DbContext, repositories/UoW, JWT issuing,
        │             file storage, seeding, background jobs
        ▼
PostgreSQL
```

| Project | Responsibility |
|---|---|
| `HAPM.Domain` | Entities, enums — no dependencies |
| `HAPM.Application` | Service layer, DTOs, business rules, repository abstractions |
| `HAPM.Infrastructure` | Repository layer, EF Core + Npgsql, BCrypt hashing, JWT, local file storage, reminder job |
| `HAPM.API` | Web API host, controllers, exception middleware, Serilog, Swagger |

## Features

- **JWT authentication** with **refresh-token rotation** and revocation on logout/deactivation
- **RBAC** with 4 roles: `Admin`, `Doctor`, `Patient`, `Receptionist`
- **Doctor management** — profiles (doctors update own name/phone/room/bio), weekly schedules, computed **available slots**
- **Appointment lifecycle** — `Pending → Confirmed → CheckedIn → Completed` (+ `Cancelled`, `NoShow`) with slot-grid validation and **double-booking prevention** for both doctor and patient
- **Prescriptions** — one per appointment, multi-line medicines, doctor-only
- **Prescription templates** — doctors save named diagnosis + medicines presets (e.g. "Viral Fever Protocol") and optionally apply them to prefill new prescriptions
- **Follow-up reminders** — patients are auto-notified when a prescription's follow-up date is within 2 days
- **Lab reports** — file upload (pdf/jpg/png/dcm, max 10 MB), metadata/file update, download streaming, doctor review
- **Billing** — invoices with auto consultation fee, tax/discount math, **edit pending invoices**, **partial payments with receipt numbers** (`Pending → PartiallyPaid → Paid`)
- **Vital signs per visit** — temperature, pulse, BP, SpO2, height/weight with **auto-computed BMI**
- **Doctor leave management** — leave windows block slot lookup and booking; creation rejected while active appointments exist in the period
- **Patient feedback & ratings** — 1–5 stars per completed appointment (one per appointment), average rating surfaced on doctor listings
- **Appointment waitlist** — patients waitlist a doctor/date and are **auto-notified when a cancellation frees a slot**
- **Audit log** — every create/update/delete recorded automatically by an EF Core interceptor (old/new values as JSON, passwords masked), queryable by admins
- **CSV exports** — appointments, patients and invoices (Excel-friendly, UTF-8 BOM)
- **Analytics** — peak-hours heatmap data (day-of-week × hour), revenue by specialization, and per-doctor **performance metrics** (outcomes, no-show rate, rating, prescriptions, revenue)
- **In-app notifications** (incl. on appointment complete) + background **appointment reminder job** (24 h window)
- **Rate limiting** — global per-IP ceiling plus a strict policy on `/api/auth/*` for brute-force protection (HTTP 429)
- **Health checks** — `/health` (includes DB connectivity) and `/health/live`
- **Search, filtering, sorting and pagination** on every list endpoint
- Global exception middleware returning RFC-7807 `ProblemDetails`
- Serilog console + rolling file logging, EF migrations, startup seeding, **HTTPS redirect in non-Development**

## Getting started

### Prerequisites

- .NET 8 SDK (or newer)
- PostgreSQL 13+

### Run

1. Set your connection string in `src/HAPM.API/appsettings.json`:

```json
"ConnectionStrings": {
  "DefaultConnection": "Host=localhost;Port=5432;Database=hapm_db;Username=postgres;Password=<your-password>"
}
```

2. Start the API (migrations + seed data are applied automatically):

```bash
dotnet run --project src/HAPM.API --urls http://localhost:5080
```

3. Open Swagger: http://localhost:5080/swagger

### Seeded accounts

| Role | Email | Password |
|---|---|---|
| Admin | `admin@hapm.local` | `Admin@12345` |
| Receptionist | `reception@hapm.local` | `Reception@12345` |
| Doctor (Cardiology) | `dr.sharma@hapm.local` | `Doctor@12345` |
| Doctor (Dermatology) | `dr.iyer@hapm.local` | `Doctor@12345` |
| Patient | `patient@hapm.local` | `Patient@12345` |

### Smoke test

With the API running:

```powershell
powershell -ExecutionPolicy Bypass -File smoke-test.ps1     # core flows
powershell -ExecutionPolicy Bypass -File smoke-test-v2.ps1  # vitals, reviews, leave, waitlist, payments, exports, audit, rate limit
powershell -ExecutionPolicy Bypass -File smoke-test-v3.ps1  # prescription templates, follow-up reminders, analytics, doctor performance
powershell -ExecutionPolicy Bypass -File smoke-test-v4.ps1  # doctor self-profile, complete notification, invoice/lab update
```

## API documentation

All list endpoints accept `page`, `pageSize` (max 100), `search`, `sortBy`, `sortDescending` plus endpoint-specific filters, and return:

```json
{ "items": [...], "page": 1, "pageSize": 10, "totalCount": 42, "totalPages": 5, "hasPrevious": false, "hasNext": true }
```

Authenticate via `Authorization: Bearer <accessToken>`.

### Auth — `/api/auth`

| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/register` | Anonymous | Patient self-registration (returns tokens) |
| POST | `/login` | Anonymous | Login, returns access + refresh tokens |
| POST | `/refresh` | Anonymous | Rotate refresh token |
| POST | `/logout` | Authenticated | Revoke refresh token |
| POST | `/change-password` | Authenticated | Change own password |
| GET | `/me` | Authenticated | Current user profile |

### Users (admin) — `/api/users`

| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/` | Admin | List users (filter by `role`, `isActive`) |
| POST | `/receptionists` | Admin | Create receptionist account |
| PATCH | `/{id}/status` | Admin | Activate/deactivate (revokes sessions) |
| POST | `/{id}/reset-password` | Admin | Reset a user's password |

### Doctors — `/api/doctors`

| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/` | Anonymous | Search by name/specialization, filters `specialization`, `isAvailable`, sort by `name|fee|experience|specialization` |
| GET | `/specializations` | Anonymous | Distinct specialization list |
| GET | `/{id}` | Anonymous | Doctor details incl. weekly schedule |
| GET | `/{id}/available-slots?date=` | Anonymous | Free bookable slots for a date |
| GET | `/{id}/schedules` | Anonymous | Weekly schedule |
| POST | `/` | Admin | Create doctor (account + profile) |
| PUT | `/{id}` | Admin | Update doctor (full profile) |
| PUT | `/{id}/profile` | Doctor (own) | Update own name, phone, room, biography |
| PUT | `/{id}/schedules` | Admin | Replace weekly schedule |
| DELETE | `/{id}` | Admin | Deactivate (blocked while upcoming appointments exist) |
| GET | `/{id}/leaves` | Authenticated | Leave history |
| POST | `/{id}/leaves` | Admin, Doctor (own) | Add a leave window (blocks booking for the period) |
| DELETE | `/{id}/leaves/{leaveId}` | Admin, Doctor (own) | Remove a leave |
| GET | `/{id}/performance` | Admin, Doctor (own) | Performance metrics: appointment outcomes, no-show rate, rating, prescriptions, distinct patients, revenue |

### Patients — `/api/patients`

| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/` | Admin, Receptionist, Doctor | Search by name/email/MRN/phone, filters `gender`, `bloodGroup` |
| GET | `/me` | Patient | Own profile |
| GET | `/{id}` | Auth (patients: own only) | Patient details |
| GET | `/{id}/medical-history` | Auth (patients: own only) | Appointments + prescriptions + lab reports |
| POST | `/` | Admin, Receptionist | Register walk-in patient |
| PUT | `/{id}` | Auth (patients: own only) | Update patient |
| DELETE | `/{id}` | Admin | Deactivate |

### Appointments — `/api/appointments`

Data is auto-scoped: patients see their own, doctors see theirs, staff see all.

| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/` | Authenticated | Filters: `doctorId`, `patientId`, `status`, `fromDate`, `toDate` |
| GET | `/{id}` | Authenticated (scoped) | Appointment details |
| POST | `/` | Patient, Admin, Receptionist | Book (validates schedule, slot grid, conflicts) |
| POST | `/{id}/confirm` | Doctor (own), Staff | Pending → Confirmed |
| POST | `/{id}/check-in` | Doctor (own), Staff | Confirmed → CheckedIn |
| POST | `/{id}/complete` | Doctor (own), Staff | → Completed (with notes) |
| POST | `/{id}/cancel` | Owner or staff | → Cancelled (with reason) |
| POST | `/{id}/no-show` | Doctor (own), Staff | Past appointment → NoShow |
| PUT | `/{id}/reschedule` | Owner or staff | Move to a new valid slot |

### Prescriptions — `/api/prescriptions`

| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/` | Authenticated (scoped) | Filters: `patientId`, `doctorId`, date range; search incl. medicine name |
| GET | `/{id}` | Authenticated (scoped) | Prescription details |
| GET | `/by-appointment/{appointmentId}` | Authenticated (scoped) | Prescription for appointment |
| POST | `/` | Doctor (own appointment) | Issue prescription (checked-in/completed only, one per appointment) |
| PUT | `/{id}` | Prescribing doctor | Update diagnosis/items |

### Prescription templates — `/api/prescription-templates`

Doctor-owned presets; applying one simply prefills a normal create-prescription request (using a template is optional).

| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/` | Doctor | List own templates |
| GET | `/{id}` | Doctor (own) | Fetch a template (e.g. to prefill a prescription) |
| POST | `/` | Doctor | Save a named template (unique name per doctor) |
| PUT | `/{id}` | Doctor (own) | Update a template |
| DELETE | `/{id}` | Doctor (own) | Delete a template |

### Lab reports — `/api/lab-reports`

| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/` | Authenticated (patients: own) | Filters: `patientId`, `doctorId`, `reportType`, `status` |
| GET | `/{id}` | Authenticated (scoped) | Report metadata |
| GET | `/{id}/download` | Authenticated (scoped) | Stream the file |
| POST | `/` | Admin, Receptionist, Doctor | `multipart/form-data` upload (`file` + metadata) |
| PUT | `/{id}` | Admin, Receptionist, Doctor | Update metadata; optional new `file` (resets review status) |
| POST | `/{id}/review` | Doctor | Mark reviewed with remarks |
| DELETE | `/{id}` | Admin | Delete report + file |

### Invoices — `/api/invoices`

| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/` | Authenticated (patients: own) | Filters: `patientId`, `status`, date range |
| GET | `/{id}` | Authenticated (scoped) | Invoice with line items |
| POST | `/` | Admin, Receptionist | Create (consultation fee auto-added when `appointmentId` set) |
| PUT | `/{id}` | Admin, Receptionist | Update pending invoice (line items, tax, discount, notes) |
| POST | `/{id}/payments` | Admin, Receptionist | Record a (partial) payment; receipt auto-numbered; status moves `Pending → PartiallyPaid → Paid` |
| GET | `/{id}/payments` | Authenticated (scoped) | Payment receipts for the invoice |
| POST | `/{id}/cancel` | Admin, Receptionist | Cancel pending invoice |

### Notifications — `/api/notifications`

| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/?unreadOnly=` | Authenticated | Own notifications, newest first |
| GET | `/unread-count` | Authenticated | Unread badge count |
| POST | `/{id}/read` | Authenticated | Mark one read |
| POST | `/read-all` | Authenticated | Mark all read |

### Vitals — `/api/vitals`

| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/` | Authenticated (patients: own) | Vital sign history; filter by `patientId`, `appointmentId` |
| GET | `/{id}` | Authenticated (scoped) | Single reading (incl. computed BMI) |
| POST | `/` | Admin, Receptionist, Doctor | Record readings for an appointment |

### Reviews — `/api/reviews`

| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/` | Anonymous | Doctor reviews; filter `doctorId`, `minRating`; sort by rating/date |
| POST | `/` | Patient | Rate a completed appointment (1–5, one review per appointment) |
| DELETE | `/{id}` | Admin or author | Delete a review |

### Waitlist — `/api/waitlist`

| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/` | Authenticated (scoped) | Entries; filter `doctorId`, `preferredDate`, `status` |
| POST | `/` | Patient, Staff | Join the waitlist for a doctor/date; auto-notified on cancellations |
| POST | `/{id}/cancel` | Owner or staff | Leave the waitlist |

### Exports — `/api/exports`

| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/appointments?fromDate=&toDate=` | Admin, Receptionist | Appointments as CSV |
| GET | `/patients` | Admin, Receptionist | Patient register as CSV |
| GET | `/invoices?fromDate=&toDate=` | Admin, Receptionist | Invoices (incl. amount paid) as CSV |

### Audit logs — `/api/audit-logs`

| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/` | Admin | Data-change trail; filter `entityName`, `action`, `userId`, date range |

### Dashboard — `/api/dashboard`

| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/stats` | Admin | Headcounts, today's/upcoming appointments, revenue (from received payments), status breakdown, top specializations |
| GET | `/peak-hours?fromDate=&toDate=` | Admin | Appointment counts per day-of-week × hour-of-day (heatmap data) |
| GET | `/revenue-by-specialization` | Admin | Received payments grouped by doctor specialization |

### Operational endpoints

| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/health` | Anonymous | Liveness + PostgreSQL connectivity |
| GET | `/health/live` | Anonymous | Process liveness only |

Rate limits: 300 requests/min per IP globally; 10 requests/min per IP on `/api/auth/*` (HTTP 429 when exceeded).

## ER overview

```
User 1──0..1 Doctor ──* DoctorSchedule
  │  1──0..1 Patient │──* DoctorLeave
  │  1──* RefreshToken
  │  1──* Notification
Doctor 1──* Appointment *──1 Patient
Doctor 1──* DoctorReview *──1 Patient   (1 review per Appointment)
Doctor 1──* WaitlistEntry *──1 Patient
Appointment 1──0..1 Prescription ──* PrescriptionItem
Doctor 1──* PrescriptionTemplate ──* PrescriptionTemplateItem
Appointment 1──* VitalSign
Appointment 1──0..1 Invoice ──* InvoiceItem  (Invoice *──1 Patient)
Invoice 1──* Payment
Patient 1──* LabReport (optional links to Doctor / Appointment)
AuditLog (standalone, written by EF interceptor)
```

Key constraints: unique `User.Email`, `Doctor.LicenseNumber`, `Patient.MedicalRecordNumber`, `Invoice.InvoiceNumber`, `Payment.ReceiptNumber`, `Prescription.AppointmentId`, `DoctorReview.AppointmentId`, `PrescriptionTemplate(DoctorId, Name)`; restricted deletes on appointment/invoice FKs; composite indexes on `(DoctorId, AppointmentDate)`, `(PatientId, AppointmentDate)`, `(DoctorId, PreferredDate, Status)` and `(EntityName, EntityId)`.

## Configuration

| Key | Description |
|---|---|
| `ConnectionStrings:DefaultConnection` | PostgreSQL connection string |
| `Jwt:Key` | HMAC-SHA256 signing secret (64+ chars; use env var/secret store in production) |
| `Jwt:AccessTokenMinutes` / `Jwt:RefreshTokenDays` | Token lifetimes |
| `FileStorage:RootPath` | Folder for uploaded lab reports |
| `Cors:AllowedOrigins` | Allowed frontend origins (default `http://localhost:4200`) |

## EF Core migrations

```bash
dotnet tool restore
dotnet ef migrations add <Name> --project src/HAPM.Infrastructure --startup-project src/HAPM.API --output-dir Persistence/Migrations
dotnet ef database update --project src/HAPM.Infrastructure --startup-project src/HAPM.API
```

## Deployment steps

1. **Database** – provision PostgreSQL (e.g. Azure Database for PostgreSQL Flexible Server); create database `hapm_db`.
2. **Secrets** – set `ConnectionStrings__DefaultConnection` and `Jwt__Key` as environment variables (or Azure Key Vault references). Never ship real secrets in `appsettings.json`.
3. **Publish** –

```bash
dotnet publish src/HAPM.API -c Release -o publish
```

4. **Host** – deploy the `publish` folder to Azure App Service (Linux/Windows), IIS, or a container:

```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY publish .
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "HAPM.API.dll"]
```

5. **Files** – point `FileStorage:RootPath` at a persistent volume, or replace `LocalFileStorageService` with an Azure Blob Storage implementation of `IFileStorageService` (single class swap).
6. **CORS** – add the production frontend origin to `Cors:AllowedOrigins`.
7. Migrations and seeding run automatically at startup; for locked-down environments run `dotnet ef database update` in the release pipeline instead.

## Azure integration notes

The brief's Azure services map to existing seams — no business logic changes required:

- **Azure Blob Storage** → implement `IFileStorageService` with `BlobContainerClient` and register it in `HAPM.Infrastructure/DependencyInjection.cs`.
- **Azure Key Vault** → `builder.Configuration.AddAzureKeyVault(...)` in `Program.cs`; `Jwt:Key` and the connection string resolve transparently.
- **Azure Notification Hub** → extend `INotificationService.NotifyAsync` to also push via `NotificationHubClient`; the in-app notification table remains the audit trail.
