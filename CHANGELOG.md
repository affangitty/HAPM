# Changelog

All notable changes to the Hospital Appointment & Patient Management System (HAPM).

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
