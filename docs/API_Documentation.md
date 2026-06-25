# HAPM API Documentation

Base URL: `http://localhost:5168/api` (run with `--urls http://localhost:5168`, or see `launchSettings.json`)

Interactive docs: **`/swagger`** (use the **Authorize** button with your access token).

## Conventions

- **Authentication:** `Authorization: Bearer <accessToken>` header.
- **Errors:** RFC-7807 `ProblemDetails`:

```json
{
  "status": 409,
  "title": "Conflict",
  "detail": "The doctor already has an appointment in this time slot.",
  "instance": "/api/appointments"
}
```

- **Pagination:** every list endpoint accepts `page` (default 1), `pageSize` (default 10, max 100), `search`, `sortBy`, `sortDescending` and returns:

```json
{
  "items": [],
  "page": 1,
  "pageSize": 10,
  "totalCount": 42,
  "totalPages": 5,
  "hasPrevious": false,
  "hasNext": true
}
```

- **Enums** are serialized as strings (e.g. `"status": "Confirmed"`).
- **IDs** are integers. **Dates** are `yyyy-MM-dd`, **times** are `HH:mm` / `HH:mm:ss`.
- **Rate limits:** 300 req/min per IP globally; 10 req/min per IP on `/api/auth/*` → HTTP 429.

---

## Authentication - `/api/auth`

### POST `/api/auth/register` (Public) - patient self-registration

```json
{
  "email": "rahul@example.com",
  "password": "Patient@12345",
  "fullName": "Rahul Verma",
  "phoneNumber": "+919876543210",
  "dateOfBirth": "1992-04-18",
  "gender": "Male",
  "bloodGroup": "O+",
  "address": "42 Lake View Road, Pune"
}
```

**Response (200):**

```json
{
  "accessToken": "eyJhbG...",
  "refreshToken": "base64...",
  "accessTokenExpiresAtUtc": "2026-06-10T09:09:02Z",
  "user": {
    "id": 5,
    "email": "rahul@example.com",
    "fullName": "Rahul Verma",
    "phoneNumber": "+919876543210",
    "role": "Patient",
    "isActive": true,
    "createdAtUtc": "2026-06-10T08:39:02Z"
  }
}
```

### POST `/api/auth/login` (Public)

```json
{ "email": "admin@hapm.local", "password": "Admin@12345" }
```

Returns the same `AuthResponse` shape as register.

### POST `/api/auth/refresh` (Public)

```json
{ "refreshToken": "your-refresh-token" }
```

Rotates the refresh token: the old one is revoked and a new pair is returned.

### POST `/api/auth/logout` (Authenticated) - revokes the supplied refresh token

### POST `/api/auth/change-password` (Authenticated)

```json
{ "currentPassword": "Admin@12345", "newPassword": "NewAdmin@456" }
```

### GET `/api/auth/me` (Authenticated) - current user profile

---

## Users (admin) - `/api/users`

| Method | Endpoint | Roles | Notes |
|--------|----------|-------|-------|
| GET | `/api/users?role=Doctor&isActive=true&search=` | Admin | Sort: `name`, `email`, `createdAt` |
| POST | `/api/users/receptionists` | Admin | `{ email, password, fullName, phoneNumber }` |
| PATCH | `/api/users/{id}/status` | Admin | `{ "isActive": false }` - revokes all refresh tokens |
| POST | `/api/users/{id}/reset-password` | Admin | `{ "newPassword": "..." }` |

---

## Doctors - `/api/doctors`

| Method | Endpoint | Roles |
|--------|----------|-------|
| GET | `/api/doctors?search=cardio&specialization=&isAvailable=true&sortBy=fee` | Public |
| GET | `/api/doctors/{id}` | Public |
| GET | `/api/doctors/specializations` | Public |
| GET | `/api/doctors/{id}/available-slots?date=2026-06-15` | Public |
| GET | `/api/doctors/{id}/schedules` | Public |
| POST | `/api/doctors` | Admin |
| PUT | `/api/doctors/{id}` | Admin |
| PUT | `/api/doctors/{id}/profile` | Doctor (own) |
| PUT | `/api/doctors/{id}/schedules` | Admin |
| DELETE | `/api/doctors/{id}` | Admin (soft delete; blocked while upcoming appointments exist) |
| GET | `/api/doctors/{id}/leaves` | Authenticated |
| POST | `/api/doctors/{id}/leaves` | Admin, Doctor (own) |
| DELETE | `/api/doctors/{id}/leaves/{leaveId}` | Admin, Doctor (own) |

Sort options: `name`, `fee`, `experience`, `specialization`. Doctor responses include `averageRating` and `reviewCount`.

**Create doctor:**

```json
{
  "email": "dr.jane@hapm.local",
  "password": "Doctor@12345",
  "fullName": "Jane Doe",
  "phoneNumber": "+919999990010",
  "specialization": "Neurology",
  "qualification": "MBBS, DM (Neurology)",
  "licenseNumber": "MCI-NEUR-3003",
  "experienceYears": 12,
  "consultationFee": 1500,
  "roomNumber": "N-301",
  "biography": "Consultant neurologist."
}
```

**Set weekly schedule** (`PUT /{id}/schedules` - replaces all):

```json
[
  { "dayOfWeek": "Monday", "startTime": "09:00", "endTime": "13:00", "slotDurationMinutes": 30 },
  { "dayOfWeek": "Wednesday", "startTime": "14:00", "endTime": "18:00", "slotDurationMinutes": 20 }
]
```

**Add leave** (`POST /{id}/leaves`) - blocks slot lookup and booking for the period; rejected (409) while active appointments exist in it:

```json
{ "startDate": "2026-06-22", "endDate": "2026-06-24", "reason": "Conference" }
```

**Update own profile** (`PUT /{id}/profile`, Doctor only - own `id`):

```json
{ "fullName": "Dr. Anil Sharma", "phoneNumber": "+919999990001", "roomNumber": "C-101", "biography": "Cardiologist with 15 years experience." }
```

Admin-only fields (specialization, fee, availability, etc.) remain on `PUT /{id}`.

---

## Patients - `/api/patients`

| Method | Endpoint | Roles |
|--------|----------|-------|
| GET | `/api/patients?search=rahul&gender=Male&bloodGroup=O%2B` | Admin, Receptionist, Doctor |
| GET | `/api/patients/me` | Patient |
| GET | `/api/patients/{id}` | Authenticated (patients: own only) |
| GET | `/api/patients/{id}/medical-history` | Authenticated (patients: own only) |
| POST | `/api/patients` | Admin, Receptionist (walk-in registration) |
| PUT | `/api/patients/{id}` | Authenticated (patients: own only) |
| DELETE | `/api/patients/{id}` | Admin (deactivate) |

Search matches name, email, MRN and phone. Sort: `name`, `mrn`, `registeredAt`. Medical history returns the patient plus all appointments, prescriptions and lab reports.

---

## Appointments - `/api/appointments`

Data is auto-scoped: patients see their own, doctors see theirs, staff see all.

| Method | Endpoint | Roles |
|--------|----------|-------|
| GET | `/api/appointments?doctorId=&patientId=&status=Confirmed&fromDate=&toDate=` | Authenticated (scoped) |
| GET | `/api/appointments/{id}` | Authenticated (scoped) |
| POST | `/api/appointments` | Patient, Admin, Receptionist |
| POST | `/api/appointments/{id}/confirm` | Doctor (own), Admin, Receptionist |
| POST | `/api/appointments/{id}/check-in` | Doctor (own), Admin, Receptionist |
| POST | `/api/appointments/{id}/complete` | Doctor (own), Admin, Receptionist - `{ "notes": "..." }` |
| POST | `/api/appointments/{id}/cancel` | Owner or staff - `{ "reason": "..." }` |
| POST | `/api/appointments/{id}/no-show` | Doctor (own), Admin, Receptionist (past slots only) |
| PUT | `/api/appointments/{id}/reschedule` | Owner or staff |

**Book** (start time must align to the doctor's slot grid; `patientId` required only for staff):

```json
{
  "doctorId": 1,
  "patientId": null,
  "appointmentDate": "2026-06-15",
  "startTime": "09:30",
  "reason": "Chest pain follow-up"
}
```

Validation errors → 400 (outside consulting hours, on leave, misaligned slot, past date) or 409 (doctor/patient slot conflict).

**Status machine:** `Pending → Confirmed → CheckedIn → Completed`; `Cancelled` from any non-terminal state; `NoShow` from Pending/Confirmed once the slot has passed. Reschedule resets to `Pending`.

---

## Vitals - `/api/vitals`

| Method | Endpoint | Roles |
|--------|----------|-------|
| GET | `/api/vitals?patientId=&appointmentId=` | Authenticated (patients: own) |
| GET | `/api/vitals/{id}` | Authenticated (scoped) |
| POST | `/api/vitals` | Admin, Receptionist, Doctor |

**Record** (at least one reading required; BMI computed automatically):

```json
{
  "appointmentId": 3,
  "temperatureCelsius": 36.8,
  "pulseBpm": 72,
  "respiratoryRatePerMin": 14,
  "systolicBpMmHg": 122,
  "diastolicBpMmHg": 80,
  "oxygenSaturationPercent": 98,
  "heightCm": 175,
  "weightKg": 70,
  "notes": "Normal"
}
```

---

## Prescriptions - `/api/prescriptions`

| Method | Endpoint | Roles |
|--------|----------|-------|
| GET | `/api/prescriptions?patientId=&doctorId=&fromDate=&toDate=` | Authenticated (scoped) |
| GET | `/api/prescriptions/{id}` | Authenticated (scoped) |
| GET | `/api/prescriptions/by-appointment/{appointmentId}` | Authenticated (scoped) |
| POST | `/api/prescriptions` | Doctor (own checked-in/completed appointment) |
| PUT | `/api/prescriptions/{id}` | Prescribing doctor |

**Create** (one per appointment - 409 if it already exists):

```json
{
  "appointmentId": 3,
  "diagnosis": "Hypertension Stage 1",
  "notes": "Lifestyle changes recommended",
  "followUpDate": "2026-07-01",
  "items": [
    {
      "medicineName": "Amlodipine",
      "dosage": "5 mg",
      "frequency": "1-0-0",
      "durationDays": 30,
      "instructions": "After breakfast"
    }
  ]
}
```

Search also matches medicine names.

When `followUpDate` is set, the patient automatically receives a `FollowUpDue` notification once the date is within 2 days (background job).

---

## Prescription Templates - `/api/prescription-templates`

Doctor-owned presets (e.g. "Viral Fever Protocol"). Using a template is **optional**: the doctor fetches one to prefill a normal create-prescription request, adjusts it, and submits as usual.

| Method | Endpoint | Roles |
|--------|----------|-------|
| GET | `/api/prescription-templates` | Doctor (own templates only) |
| GET | `/api/prescription-templates/{id}` | Doctor (own) |
| POST | `/api/prescription-templates` | Doctor |
| PUT | `/api/prescription-templates/{id}` | Doctor (own) |
| DELETE | `/api/prescription-templates/{id}` | Doctor (own) |

**Save template** (name unique per doctor - duplicate → 409):

```json
{
  "name": "Viral Fever Protocol",
  "diagnosis": "Viral fever",
  "notes": "Plenty of fluids and rest",
  "items": [
    { "medicineName": "Paracetamol", "dosage": "500 mg", "frequency": "1-1-1", "durationDays": 5, "instructions": "After food" },
    { "medicineName": "Cetirizine", "dosage": "10 mg", "frequency": "0-0-1", "durationDays": 5 }
  ]
}
```

Templates are fully isolated per doctor - other doctors get 404 for templates they don't own.

---

## Lab Reports - `/api/lab-reports`

| Method | Endpoint | Roles |
|--------|----------|-------|
| GET | `/api/lab-reports?patientId=&doctorId=&reportType=&status=Reviewed` | Authenticated (patients: own) |
| GET | `/api/lab-reports/{id}` | Authenticated (scoped) |
| GET | `/api/lab-reports/{id}/download` | Authenticated (scoped) - streams the file |
| POST | `/api/lab-reports` | Admin, Receptionist, Doctor (`multipart/form-data`) |
| PUT | `/api/lab-reports/{id}` | Admin, Receptionist, Doctor (`multipart/form-data`, `file` optional) |
| POST | `/api/lab-reports/{id}/review` | Doctor - `{ "remarks": "..." }` |
| DELETE | `/api/lab-reports/{id}` | Admin (also deletes the file) |

**Upload form fields:** `patientId` (required), `doctorId`, `appointmentId` (optional), `reportType`, `title`, `file` (required; `.pdf .jpg .jpeg .png .dcm`, max 10 MB).

**Update** (`PUT /{id}`): same metadata fields (`reportType`, `title`, `doctorId`, `appointmentId`); optional new `file`. Replacing the file resets status to `Uploaded` and clears review remarks.

---

## Invoices - `/api/invoices`

| Method | Endpoint | Roles |
|--------|----------|-------|
| GET | `/api/invoices?patientId=&status=Pending&fromDate=&toDate=` | Authenticated (patients: own) |
| GET | `/api/invoices/{id}` | Authenticated (scoped) |
| POST | `/api/invoices` | Admin, Receptionist |
| PUT | `/api/invoices/{id}` | Admin, Receptionist (pending only) |
| POST | `/api/invoices/{id}/payments` | Admin, Receptionist |
| GET | `/api/invoices/{id}/payments` | Authenticated (scoped) |
| POST | `/api/invoices/{id}/cancel` | Admin, Receptionist (pending only) |

**Create** (consultation fee auto-added when `appointmentId` is set):

```json
{
  "patientId": 1,
  "appointmentId": 3,
  "taxPercent": 18,
  "discountAmount": 100,
  "notes": "Includes ECG",
  "items": [
    { "description": "ECG", "quantity": 1, "unitPrice": 500 }
  ]
}
```

**Update pending invoice** (`PUT /{id}`, status must be `Pending`):

```json
{
  "taxPercent": 18,
  "discountAmount": 50,
  "notes": "Adjusted after review",
  "items": [
    { "description": "ECG", "quantity": 1, "unitPrice": 500 }
  ]
}
```

When linked to an appointment, the consultation fee line is preserved automatically if omitted.

**Record payment** (partial allowed; overpayment → 400):

```json
{ "amount": 500, "paymentMethod": "Upi", "notes": "First instalment" }
```

Each payment gets a receipt number (`RCP-2026-000001`). Status: `Pending → PartiallyPaid → Paid`. Invoice responses include `amountPaid`, `balanceDue` and the `payments` array. Payment methods: `Cash`, `Card`, `Upi`, `Insurance`, `BankTransfer`.

---

## Reviews - `/api/reviews`

| Method | Endpoint | Roles |
|--------|----------|-------|
| GET | `/api/reviews?doctorId=1&minRating=4&sortBy=rating` | Public |
| POST | `/api/reviews` | Patient (own completed appointment; one per appointment) |
| DELETE | `/api/reviews/{id}` | Admin or the review author |

```json
{ "appointmentId": 3, "rating": 5, "comment": "Excellent doctor!" }
```

---

## Waitlist - `/api/waitlist`

| Method | Endpoint | Roles |
|--------|----------|-------|
| GET | `/api/waitlist?doctorId=&preferredDate=&status=Active` | Authenticated (scoped) |
| POST | `/api/waitlist` | Patient, Admin, Receptionist |
| POST | `/api/waitlist/{id}/cancel` | Owner or staff |

```json
{ "doctorId": 1, "patientId": null, "preferredDate": "2026-06-15", "notes": "Any morning slot" }
```

When an appointment for that doctor/date is cancelled, every active waitlisted patient receives a `WaitlistSlotOpened` notification and the entry becomes `Notified`.

---

## Notifications - `/api/notifications`

| Method | Endpoint | Roles |
|--------|----------|-------|
| GET | `/api/notifications?unreadOnly=true` | Authenticated |
| GET | `/api/notifications/unread-count` | Authenticated |
| POST | `/api/notifications/{id}/read` | Authenticated |
| POST | `/api/notifications/read-all` | Authenticated |

**Automatic triggers:** appointment booked/confirmed/**completed**/cancelled/rescheduled, prescription issued, lab report uploaded, invoice generated, payment received, waitlist slot opened, 24-hour appointment reminders, and prescription follow-up reminders (due within 2 days). Reminders are sent by a background service (every 5 minutes, deduplicated).

---

## Dashboard - `/api/dashboard`

### GET `/api/dashboard/stats` (Admin)

```json
{
  "totalDoctors": 2,
  "totalPatients": 1,
  "totalAppointments": 3,
  "appointmentsToday": 0,
  "upcomingAppointments": 1,
  "pendingInvoices": 0,
  "totalRevenue": 5318.00,
  "revenueThisMonth": 5318.00,
  "appointmentsByStatus": [ { "status": "Completed", "count": 2 } ],
  "topSpecializations": [ { "specialization": "Cardiology", "doctorCount": 1, "appointmentCount": 3 } ]
}
```

Revenue is computed from received payments, not invoice face value.

### GET `/api/dashboard/peak-hours?fromDate=&toDate=` (Admin)

Appointment counts grouped by day-of-week × hour-of-day (cancelled excluded) - ready to render as a heatmap:

```json
[
  { "dayOfWeek": "Tuesday", "hour": 9, "appointmentCount": 12 },
  { "dayOfWeek": "Tuesday", "hour": 10, "appointmentCount": 7 }
]
```

### GET `/api/dashboard/revenue-by-specialization` (Admin)

Received payments grouped by the doctor's specialization (payments on invoices without an appointment fall into `"Other"`):

```json
[
  { "specialization": "Cardiology", "paymentCount": 2, "totalRevenue": 1500.00 }
]
```

---

## Doctor Performance - `/api/doctors/{id}/performance`

**Roles:** Admin, Doctor (own metrics only - other doctors' → 403).

```json
{
  "doctorId": 1,
  "doctorName": "Anil Sharma",
  "specialization": "Cardiology",
  "totalAppointments": 5,
  "completedAppointments": 1,
  "cancelledAppointments": 1,
  "noShowAppointments": 0,
  "noShowRatePercent": 0,
  "averageRating": 5,
  "reviewCount": 1,
  "prescriptionCount": 1,
  "distinctPatients": 1,
  "totalRevenue": 1500.00
}
```

`noShowRatePercent` is computed over concluded appointments (completed + no-show). Revenue is the sum of payments received on invoices linked to this doctor's appointments.

---

## Audit Logs - `/api/audit-logs`

### GET `/api/audit-logs?entityName=Invoice&action=Updated&userId=&fromDate=&toDate=` (Admin)

Every create/update/delete is captured automatically by an EF Core interceptor with the acting user and old/new values as JSON (`PasswordHash` masked). Technical tables (audit logs, notifications, refresh tokens) are excluded.

---

## Exports - `/api/exports` (Admin, Receptionist)

| Method | Endpoint | Output |
|--------|----------|--------|
| GET | `/api/exports/appointments?fromDate=&toDate=` | `appointments-*.csv` |
| GET | `/api/exports/patients` | `patients-*.csv` |
| GET | `/api/exports/invoices?fromDate=&toDate=` | `invoices-*.csv` (incl. amount paid) |

CSV files are UTF-8 with BOM (Excel-friendly) and properly escaped.

---

## Operational Endpoints

| Endpoint | Description |
|----------|-------------|
| GET `/health` | Healthy/Unhealthy incl. PostgreSQL connectivity |
| GET `/health/live` | Process liveness only |
| GET `/` | Redirects to `/swagger` |

---

## Seed Data Credentials

Use the **show password** control on the login screen in development, or the values below.

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@hapm.local` | `Admin@12345` |
| Receptionist | `reception@hapm.local` | `Reception@12345` |
| Doctor (Cardiology) | `dr.sharma@hapm.local` | `Doctor@12345` |
| Doctor (Dermatology) | `dr.iyer@hapm.local` | `Doctor@12345` |
| Doctor (Orthopedics) | `dr.khan@hapm.local` | `Doctor@12345` |
| Patient | `patient@hapm.local` | `Patient@12345` |

Demo patients (`*@demo.local`) use **`Patient@12345`**.
