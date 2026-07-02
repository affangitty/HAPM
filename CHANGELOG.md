# Changelog

All notable changes to the Hospital Appointment & Patient Management System (HAPM).

## [1.6.0] - 2026-06-30 - PATCH, idempotency & audit hardening

### Added
- **PATCH partial updates** for patients, doctors (admin + self profile), prescriptions, templates, lab reports, invoices, and appointment reschedule (`PUT` retained for full weekly schedule replace)
- **`Idempotency-Key`** middleware + `IdempotencyRecords` table; Angular `idempotency.interceptor.ts`
- **`ChangeLogService`** — per-field audit JSON (`{ "Field": { "old", "new" } }`); audit detail UI table
- **`AuditLogArchive`** entity + `AuditLogArchiveService` background job (`Audit` settings in `appsettings.json`)
- **`IdempotencyCleanupService`** — hourly purge of expired keys
- Frontend: dark/light theme toggle; inline patient registration on login shell; doctor route order fix (`/doctors/new` before `:id`)

### Fixed
- **Circular DI deadlock** on startup — `AuditSaveChangesInterceptor` resolves `IChangeLogService` via `IServiceScopeFactory` instead of constructor injection

### Changed
- Service methods renamed from `Update*` to `Patch*` where applicable; `PatchDtos.cs` request types

---

## [1.5.0] - 2026-06-16 - Real-time (SignalR)

### Added
- **SignalR live notification push** — `NotificationsHub` at `/hubs/notifications`; integrated with `NotificationService` and background reminder job
- **Live appointment status board** — `AppointmentsHub` at `/hubs/appointments`; reception/admin receive `AppointmentStatusChanged` events
- **Instant waitlist alerts** — waitlist slot notifications pushed via SignalR when connected
- **Staff internal messaging** — `ChatHub` at `/hubs/chat`, `StaffMessage` entity, `POST /api/staff-messages/to-doctor`, `POST /api/staff-messages/broadcast`
- JWT auth for SignalR via `access_token` query string; CORS credentials enabled
- Documentation: [docs/SignalR.md](docs/SignalR.md)

---

## [1.4.0] - 2026-06-10 - Hardening & tests

### Added
- `HospitalClock` for consistent hospital-local time in scheduling and reminders
- Strong password validation (`[StrongPassword]` on all password fields)
- JWT key length validation at startup (minimum 32 bytes)
- Invoice line item minimum price (`UnitPrice` ≥ 0.01)
- Blood pressure rule: systolic must exceed diastolic when both provided
- **85 xUnit tests** in `tests/HAPM.Application.Tests`
- Postman collection and evaluator demo preparation script

### Fixed
- `StrongPasswordAttribute` now attaches validation errors to the password field correctly

---

## [1.3.0] - 2026-06-10 - Gap fill (legacy spec parity)

### Added
- `PUT /api/doctors/{id}/profile` - doctor self-update
- `NotificationType.AppointmentCompleted`
- `PUT /api/invoices/{id}` - update pending invoices
- `PUT /api/lab-reports/{id}` - update metadata/file
- HTTPS redirect in non-Development

---

## [1.2.0] - 2026-06-10 - Analytics & templates

### Added
- Prescription templates, follow-up reminders, peak-hours heatmap, revenue by specialization, doctor performance metrics

---

## [1.1.0] - 2026-06-10 - Clinical & operations

### Added
- Vitals, doctor leave, reviews, waitlist, partial payments, CSV exports, audit log, rate limiting, health checks

---

## [1.0.0] - 2026-06-10 - Initial release

### Added
- Full layered API: auth, doctors, patients, appointments, prescriptions, lab reports, billing, notifications, dashboard, migrations, seeding, documentation
