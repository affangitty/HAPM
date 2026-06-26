# HAPM Feature List

**Hospital Appointment & Patient Management System** - a REST API for hospital operations built with ASP.NET Core 8, PostgreSQL, EF Core, and JWT authentication.

This document describes **what the application can do**, organized by capability. For endpoint-level detail, see the API tables in [README.md](../README.md).

**To exercise every feature in the browser** (what to click, expected results, API-only endpoints), use **[Frontend_Flow_Testing.md](Frontend_Flow_Testing.md)**.

---

## Summary

| Category | Highlights |
|----------|------------|
| **Users & security** | JWT + refresh tokens, 4 roles, strong passwords, rate limiting |
| **Clinical** | Appointments, vitals, prescriptions, lab reports, medical history |
| **Operations** | Doctor schedules, leave, waitlist, notifications, reminders |
| **Financial** | Invoices, tax/discount, partial payments, receipt numbers |
| **Governance** | Audit log, CSV exports, admin dashboard & analytics |
| **Quality** | Validation, ProblemDetails errors, health checks, unit tests |

**Scale:** 16 controllers · ~75 HTTP endpoints · 17 application services · 4 user roles

---

## Platform & architecture

- **Layered clean architecture** - Domain → Application → Infrastructure → API
- **PostgreSQL** database with **EF Core migrations** applied at startup
- **Startup seeding** - default admin, doctors, receptionist, and sample patient
- **Swagger / OpenAPI** at `/swagger` for interactive API exploration
- **Serilog** logging to console and rolling daily files (`src/HAPM.API/logs/`)
- **Global exception handling** - consistent RFC-7807 `ProblemDetails` JSON for errors
- **HTTPS redirect** in non-Development environments
- **Health checks** - `/health` (includes DB connectivity) and `/health/live` (process only)

---

## Authentication & authorization

### Authentication

- **Patient self-registration** with immediate token issuance
- **Login** returns short-lived **access token** + long-lived **refresh token**
- **Refresh token rotation** - old refresh token invalidated on each refresh
- **Logout** revokes the refresh token
- **Change password** for the signed-in user
- **Get current user** (`/api/auth/me`) - profile of the authenticated account
- **Strong password policy** - minimum length, uppercase, lowercase, digit, and special character
- **Angular login UX** - show/hide password toggle on all password fields; demo mode lists seeded credentials on the sign-in screen

### Role-based access control (RBAC)

Four roles with endpoint-level enforcement:

| Role | Typical capabilities |
|------|----------------------|
| **Admin** | Full system access, user management, analytics, audit, exports |
| **Doctor** | Own appointments, prescriptions, templates, leave, lab review, performance |
| **Receptionist** | Front desk - patients, booking, check-in, vitals, billing |
| **Patient** | Own profile, appointments, notifications, reviews, waitlist |

### Admin user management

- List all user accounts with search, role filter, and active/inactive filter
- Create receptionist accounts
- Activate or deactivate users (deactivation revokes all refresh tokens)
- Reset a user's password (admin)

### Security hardening

- **JWT signing key** validated at startup (minimum 32 bytes)
- **Rate limiting** - 300 requests/min per IP globally; 10 requests/min on `/api/auth/*` (HTTP 429)
- **Audit interceptor** masks password fields in change logs

---

## Doctor management

### Public discovery (no login required)

- List doctors with **pagination**, **search**, and **sorting** (name, fee, experience, specialization)
- Filter by specialization and availability
- View doctor profile - specialization, consultation fee, room, biography, average rating
- List all distinct specializations
- View weekly schedule (day, start/end time, slot duration)
- **Compute available slots** for any date - respects existing bookings and leave periods

### Admin doctor administration

- Create doctor accounts with full profiles
- Update doctor profiles and consultation fees
- Replace weekly schedules (slot grid alignment enforced)
- Deactivate doctors (blocked while upcoming appointments exist)

### Doctor self-service

- Update own name, phone, room number, and biography
- View own performance metrics (see Analytics)
- Manage own leave periods

### Doctor leave

- Add leave windows (start/end date + reason)
- Leave blocks slot lookup and new bookings for those dates
- Leave creation rejected if active appointments already exist in the period
- Remove leave entries
- View leave history

---

## Patient management

### Registration & profiles

- **Walk-in registration** by reception or admin (email, password, demographics, allergies, etc.)
- **Auto-generated Medical Record Number (MRN)** for each patient
- Patients view and update **their own profile** (demographics, emergency contact, allergies, chronic conditions)
- Staff search patients by name, email, MRN, or phone
- Filter by gender and blood group
- Admin can deactivate patient accounts

### Medical history

- Consolidated view per patient: past appointments, prescriptions, and lab reports
- Patients can only access their own history; staff can access any patient

---

## Appointments

### Booking rules

- Book by **patient** (self) or **reception/admin** (on behalf of a patient)
- Slot must fall inside the doctor's weekly schedule
- Start time must align to the doctor's **slot grid** (e.g. 30-minute blocks)
- **Double-booking prevention** - no overlapping slots for the same doctor or the same patient
- Cannot book in the past or on dates when the doctor is on leave
- Rescheduling moves an appointment to a new valid slot (resets reminder flag)

### Appointment lifecycle

```
Pending → Confirmed → CheckedIn → Completed
                ↓           ↓
           Cancelled     NoShow
```

| Status | How it is reached |
|--------|-------------------|
| **Pending** | New booking |
| **Confirmed** | Doctor or staff confirms |
| **CheckedIn** | Reception/doctor checks patient in |
| **Completed** | Doctor completes visit (optional notes) |
| **Cancelled** | Patient, doctor, or staff cancels (reason required) |
| **NoShow** | Doctor/staff marks past Pending/Confirmed appointment |

### Notifications on appointment events

Automatic in-app notifications when appointments are booked, confirmed, rescheduled, cancelled, or completed.

### Data scoping

- Patients see only their appointments
- Doctors see only appointments assigned to them
- Admin and reception see all appointments

### List & filter

- Filter by doctor, patient, status, and date range
- Pagination and sorting on all list endpoints

---

## Vital signs

Record and retrieve clinical measurements per appointment visit:

- Temperature (°C)
- Pulse (BPM)
- Respiratory rate
- Blood pressure (systolic / diastolic) - **validated: systolic must exceed diastolic**
- Oxygen saturation (SpO₂)
- Height and weight - **BMI calculated automatically**
- Optional notes

Staff record vitals at check-in; patients can view their own history.

---

## Prescriptions

- **One prescription per appointment** (issued by the treating doctor)
- Multi-line medicine entries: name, dosage, frequency, duration, instructions
- Diagnosis, optional notes, and optional **follow-up date**
- Issue only when appointment is **CheckedIn** or **Completed**
- Prescribing doctor can update diagnosis and medicine lines
- Search and filter prescriptions by patient, doctor, date range, and medicine name

### Prescription templates

Doctors save reusable named presets (diagnosis + medicine lines) for common cases, e.g. "Viral Fever Protocol":

- Create, list, update, and delete own templates
- Unique template name per doctor
- Templates prefill new prescriptions (optional workflow)

### Follow-up reminders

Background job notifies patients when a prescription's follow-up date is within **2 days**.

---

## Lab reports

- Upload report files via **multipart/form-data**
- Supported formats: **PDF, JPG, JPEG, PNG, DCM** (max **10 MB**)
- Metadata: patient, optional doctor/appointment link, report type, title
- **Download** report files as a streamed response
- **Update** metadata and optionally replace the file (resets review status)
- **Doctor review** - mark as reviewed with remarks
- Admin can delete reports
- Patients see only their own reports; staff see all

---

## Billing & invoices

### Invoice creation

- Line items with description, quantity, and unit price (minimum ₹0.01 / unit)
- Tax percentage and flat discount amount
- When linked to an appointment, the doctor's **consultation fee is added automatically** as a line item
- Optional notes

### Invoice statuses

```
Pending → PartiallyPaid → Paid
    ↓
Cancelled
```

| Status | Meaning |
|--------|---------|
| **Pending** | No payments yet; can be edited or cancelled |
| **PartiallyPaid** | One or more partial payments recorded |
| **Paid** | Total amount received |
| **Cancelled** | Voided by staff |

### Payments

- Record **partial or full payments** with payment method (Cash, Card, UPI, Insurance, Bank Transfer)
- Auto-generated **receipt numbers** per payment
- View payment history per invoice

### Invoice management

- Update **pending** invoices (line items, tax, discount, notes)
- Cancel pending invoices
- Patients see only their own invoices

---

## Reviews & ratings

- Patients rate **completed appointments** (1–5 stars, optional comment)
- **One review per appointment**
- Public listing of doctor reviews (filter by doctor, minimum rating; sort by rating or date)
- Average rating shown on doctor listings and performance metrics
- Patient or admin can delete a review

---

## Waitlist

- Patients (or staff on behalf of a patient) join a waitlist for a **doctor + preferred date**
- When an appointment for that doctor/date is **cancelled**, all active waitlisted patients are **notified automatically**
- View waitlist entries with status filter
- Cancel a waitlist entry

---

## Notifications

In-app notification inbox for every authenticated user:

| Trigger | Examples |
|---------|----------|
| Appointments | Booked, confirmed, rescheduled, cancelled, completed |
| Billing | Invoice created, payment received |
| Waitlist | Slot became available |
| Reminders | Appointment in 24 h; follow-up in 2 days |

- List notifications (optionally unread only)
- Unread count for badge display
- Mark one or all as read
- **Real-time push** via SignalR when the client is connected (see [SignalR.md](SignalR.md))

---

## Real-time features (SignalR)

| Feature | Hub | Audience |
|---------|-----|----------|
| Live notification delivery | `/hubs/notifications` | All users (group `user-{id}`) |
| Appointment status board | `/hubs/appointments` | Admin, Receptionist (`staff-board`) |
| Staff internal messaging | `/hubs/chat` | Admin, Receptionist, Doctor |

Staff messaging is **operational only** (e.g. “Patient in Room 3 is ready”) — not patient-doctor clinical chat. Messages are persisted and delivered over SignalR.

See **[docs/SignalR.md](SignalR.md)** for connection details and client events.

---

## Analytics & dashboard (admin)

### Dashboard stats

- Total patients, doctors, appointments
- Today's and upcoming appointment counts
- Revenue from received payments
- Appointment status breakdown
- Top specializations by volume

### Peak hours heatmap

- Appointment counts grouped by **day of week × hour of day**
- Optional date range filter
- Useful for staffing and capacity planning

### Revenue by specialization

- Total received payments grouped by doctor specialization (e.g. Cardiology vs Dermatology)

### Doctor performance

Per-doctor metrics:

- Appointment outcomes (completed, cancelled, no-show counts)
- No-show rate
- Average patient rating
- Prescriptions issued
- Distinct patients seen
- Revenue generated

---

## Audit log

Every create, update, and delete across the system is recorded automatically:

- Entity name, record ID, action type
- Old and new values as JSON snapshots
- User who performed the action and timestamp
- Password fields masked in audit entries
- Admin can query with filters (entity, action, user, date range)

---

## CSV exports

Admin and reception can download Excel-friendly CSV files (UTF-8 with BOM):

| Export | Contents |
|--------|----------|
| **Appointments** | Date, time, status, patient, doctor, reason (optional date filter) |
| **Patients** | MRN, demographics, contact info |
| **Invoices** | Line totals, status, amount paid (optional date filter) |

---

## Background jobs

Two automated reminder flows run on a background timer:

| Job | When | Action |
|-----|------|--------|
| **Appointment reminder** | Confirmed appointment within **24 hours** | In-app notification; flag prevents duplicate sends |
| **Follow-up reminder** | Prescription follow-up date within **2 days** | In-app notification to patient |

Rescheduling an appointment resets the appointment reminder flag.

---

## API conventions

All list endpoints support:

- **Pagination** - `page`, `pageSize` (max 100)
- **Search** - endpoint-specific text search
- **Sorting** - `sortBy`, `sortDescending`
- **Filtering** - endpoint-specific query parameters

Standard paged response:

```json
{
  "items": [ ... ],
  "page": 1,
  "pageSize": 20,
  "totalCount": 142,
  "totalPages": 8
}
```

Authenticated requests use:

```
Authorization: Bearer <accessToken>
```

---

## Validation & data integrity

- Request DTO validation via Data Annotations (required fields, ranges, formats)
- Strong passwords on registration and all password-change flows
- Blood pressure clinical rule (systolic > diastolic)
- Invoice math centralized (`InvoiceMath`) - subtotal, tax, discount, total, balance
- Hospital-local clock (`HospitalClock`) for consistent scheduling and reminders
- Business rules enforced in services - conflicts return **409**, validation **400**, not found **404**, forbidden **403**

---

## Testing & demo assets

- **Unit tests** - `tests/HAPM.Application.Tests` (services, validation, business rules)
- **Smoke tests** - `smoke-test.ps1` through `smoke-test-v4.ps1`

## Coverlet

dotnet test tests/HAPM.Application.Tests/HAPM.Application.Tests.csproj \
  --settings tests/HAPM.Application.Tests/coverlet.runsettings \
  --collect:"XPlat Code Coverage" \
  --results-directory ./TestResults

reportgenerator -reports:"TestResults/**/coverage.cobertura.xml" -targetdir:"TestResults/coverage-report" -reporttypes:Html