# HAPM — ER Diagram

Paste the following DBML into [dbdiagram.io](https://dbdiagram.io) to visualize the schema. It mirrors the EF Core model in `HAPM.Infrastructure/Persistence/AppDbContext.cs` (all tables also carry `CreatedAtUtc timestamp [not null]` and `UpdatedAtUtc timestamp` from `BaseEntity`).

```dbml
Table Users {
  Id int [pk, increment]
  Email varchar(256) [unique, not null]
  PasswordHash text [not null]
  FullName varchar(150) [not null]
  PhoneNumber varchar(20)
  Role int [not null, note: 'Admin=1, Doctor=2, Patient=3, Receptionist=4']
  IsActive boolean [default: true]
  CreatedAtUtc timestamp [not null]
  UpdatedAtUtc timestamp
}

Table RefreshTokens {
  Id int [pk, increment]
  UserId int [ref: > Users.Id, not null]
  Token varchar(200) [unique, not null]
  ExpiresAtUtc timestamp [not null]
  RevokedAtUtc timestamp
  ReplacedByToken varchar
  CreatedAtUtc timestamp [not null]
}

Table Doctors {
  Id int [pk, increment]
  UserId int [ref: - Users.Id, unique, not null]
  Specialization varchar(100) [not null]
  Qualification varchar(200) [not null]
  LicenseNumber varchar(50) [unique, not null]
  ExperienceYears int [not null]
  ConsultationFee decimal(12,2) [not null]
  RoomNumber varchar(20)
  Biography varchar(2000)
  IsAvailable boolean [default: true]
  CreatedAtUtc timestamp [not null]
}

Table DoctorSchedules {
  Id int [pk, increment]
  DoctorId int [ref: > Doctors.Id, not null]
  DayOfWeek int [not null, note: 'Sunday=0 .. Saturday=6']
  StartTime time [not null]
  EndTime time [not null]
  SlotDurationMinutes int [not null, default: 30]
}

Table DoctorLeaves {
  Id int [pk, increment]
  DoctorId int [ref: > Doctors.Id, not null]
  StartDate date [not null]
  EndDate date [not null]
  Reason varchar(300) [not null]
  CreatedByUserId int [not null]
  CreatedAtUtc timestamp [not null]
}

Table Patients {
  Id int [pk, increment]
  UserId int [ref: - Users.Id, unique, not null]
  MedicalRecordNumber varchar(30) [unique, not null, note: 'MRN-YYYY-NNNNNN']
  DateOfBirth date [not null]
  Gender int [not null, note: 'Male=1, Female=2, Other=3']
  BloodGroup varchar(10)
  Address varchar(500)
  EmergencyContactName varchar(150)
  EmergencyContactPhone varchar(20)
  Allergies varchar(1000)
  ChronicConditions varchar(1000)
  CreatedAtUtc timestamp [not null]
}

Table Appointments {
  Id int [pk, increment]
  PatientId int [ref: > Patients.Id, not null]
  DoctorId int [ref: > Doctors.Id, not null]
  AppointmentDate date [not null]
  StartTime time [not null]
  EndTime time [not null]
  Status int [not null, note: 'Pending=1, Confirmed=2, CheckedIn=3, Completed=4, Cancelled=5, NoShow=6']
  Reason varchar(500) [not null]
  Notes varchar(2000)
  CancellationReason varchar(500)
  ReminderSent boolean [default: false]
  CreatedAtUtc timestamp [not null]
}

Table VitalSigns {
  Id int [pk, increment]
  AppointmentId int [ref: > Appointments.Id, not null]
  PatientId int [ref: > Patients.Id, not null]
  RecordedByUserId int [not null]
  TemperatureCelsius decimal(4,1)
  PulseBpm int
  RespiratoryRatePerMin int
  SystolicBpMmHg int
  DiastolicBpMmHg int
  OxygenSaturationPercent decimal(4,1)
  HeightCm decimal(5,1)
  WeightKg decimal(5,1)
  Notes varchar(1000)
  CreatedAtUtc timestamp [not null]
}

Table Prescriptions {
  Id int [pk, increment]
  AppointmentId int [ref: - Appointments.Id, unique, not null]
  DoctorId int [ref: > Doctors.Id, not null]
  PatientId int [ref: > Patients.Id, not null]
  Diagnosis varchar(1000) [not null]
  Notes varchar(2000)
  FollowUpDate date
  FollowUpReminderSent boolean [default: false]
  CreatedAtUtc timestamp [not null]
}

Table PrescriptionTemplates {
  Id int [pk, increment]
  DoctorId int [ref: > Doctors.Id, not null]
  Name varchar(100) [not null, note: 'unique per doctor']
  Diagnosis varchar(1000) [not null]
  Notes varchar(2000)
  CreatedAtUtc timestamp [not null]
}

Table PrescriptionTemplateItems {
  Id int [pk, increment]
  PrescriptionTemplateId int [ref: > PrescriptionTemplates.Id, not null]
  MedicineName varchar(200) [not null]
  Dosage varchar(50) [not null]
  Frequency varchar(50) [not null]
  DurationDays int [not null]
  Instructions varchar(300)
}

Table PrescriptionItems {
  Id int [pk, increment]
  PrescriptionId int [ref: > Prescriptions.Id, not null]
  MedicineName varchar(200) [not null]
  Dosage varchar(50) [not null]
  Frequency varchar(50) [not null]
  DurationDays int [not null]
  Instructions varchar(300)
}

Table LabReports {
  Id int [pk, increment]
  PatientId int [ref: > Patients.Id, not null]
  DoctorId int [ref: > Doctors.Id]
  AppointmentId int [ref: > Appointments.Id]
  ReportType varchar(100) [not null]
  Title varchar(200) [not null]
  FileName varchar(260) [not null]
  StoredFilePath varchar(500) [not null]
  ContentType varchar(100) [not null]
  FileSizeBytes bigint [not null]
  Status int [not null, note: 'Uploaded=1, Reviewed=2']
  ReviewRemarks varchar(2000)
  UploadedByUserId int [not null]
  CreatedAtUtc timestamp [not null]
}

Table Invoices {
  Id int [pk, increment]
  InvoiceNumber varchar(30) [unique, not null, note: 'INV-YYYY-NNNNNN']
  PatientId int [ref: > Patients.Id, not null]
  AppointmentId int [ref: - Appointments.Id, unique]
  SubTotal decimal(12,2) [not null]
  TaxPercent decimal(5,2) [not null]
  TaxAmount decimal(12,2) [not null]
  DiscountAmount decimal(12,2) [not null]
  TotalAmount decimal(12,2) [not null]
  Status int [not null, note: 'Pending=1, Paid=2, Cancelled=3, PartiallyPaid=4']
  PaidAtUtc timestamp [note: 'set when fully paid']
  Notes varchar(1000)
  CreatedAtUtc timestamp [not null]
}

Table InvoiceItems {
  Id int [pk, increment]
  InvoiceId int [ref: > Invoices.Id, not null]
  Description varchar(300) [not null]
  Quantity int [not null, default: 1]
  UnitPrice decimal(12,2) [not null]
  Amount decimal(12,2) [not null]
}

Table Payments {
  Id int [pk, increment]
  InvoiceId int [ref: > Invoices.Id, not null]
  ReceiptNumber varchar(30) [unique, not null, note: 'RCP-YYYY-NNNNNN']
  Amount decimal(12,2) [not null]
  Method int [not null, note: 'Cash=1, Card=2, Upi=3, Insurance=4, BankTransfer=5']
  Notes varchar(500)
  ReceivedByUserId int [not null]
  CreatedAtUtc timestamp [not null]
}

Table DoctorReviews {
  Id int [pk, increment]
  DoctorId int [ref: > Doctors.Id, not null]
  PatientId int [ref: > Patients.Id, not null]
  AppointmentId int [ref: - Appointments.Id, unique, not null]
  Rating int [not null, note: '1-5']
  Comment varchar(1000)
  CreatedAtUtc timestamp [not null]
}

Table WaitlistEntries {
  Id int [pk, increment]
  DoctorId int [ref: > Doctors.Id, not null]
  PatientId int [ref: > Patients.Id, not null]
  PreferredDate date [not null]
  Status int [not null, note: 'Active=1, Notified=2, Cancelled=3']
  Notes varchar(500)
  NotifiedAtUtc timestamp
  CreatedAtUtc timestamp [not null]
}

Table Notifications {
  Id int [pk, increment]
  UserId int [ref: > Users.Id, not null]
  Type int [not null, note: 'General=0, Booked=1, Confirmed=2, Cancelled=3, Reminder=4, Prescription=5, LabReport=6, Invoice=7, WaitlistSlot=8, Payment=9, FollowUpDue=10']
  Title varchar(200) [not null]
  Message varchar(1000) [not null]
  IsRead boolean [default: false]
  ReadAtUtc timestamp
  CreatedAtUtc timestamp [not null]
}

Table AuditLogs {
  Id int [pk, increment]
  UserId int
  UserEmail varchar(256)
  EntityName varchar(100) [not null]
  EntityId varchar(50) [not null]
  Action int [not null, note: 'Created=1, Updated=2, Deleted=3']
  ChangesJson jsonb [not null, note: 'old/new values; PasswordHash masked']
  CreatedAtUtc timestamp [not null]
}
```

## Relationships Summary

| Relationship | Type | Notes |
|---|---|---|
| User → Doctor | One-to-One | Doctor login account |
| User → Patient | One-to-One | Patient login account |
| User → RefreshTokens / Notifications | One-to-Many | Cascade delete |
| Doctor → DoctorSchedules | One-to-Many | Weekly recurring windows |
| Doctor → DoctorLeaves | One-to-Many | Absence windows block booking |
| Doctor / Patient → Appointments | One-to-Many | `Restrict` delete (history preserved) |
| Appointment → Prescription | One-to-One | Unique `AppointmentId` |
| Prescription → PrescriptionItems | One-to-Many | Cascade |
| Doctor → PrescriptionTemplates | One-to-Many | Private per doctor; name unique per doctor |
| PrescriptionTemplate → Items | One-to-Many | Cascade |
| Appointment → VitalSigns | One-to-Many | Multiple readings per visit |
| Appointment → Invoice | One-to-One (optional) | Unique `AppointmentId`, `SetNull` on delete |
| Invoice → InvoiceItems / Payments | One-to-Many | Cascade |
| Appointment → DoctorReview | One-to-One | Unique `AppointmentId` (1 review per visit) |
| Doctor / Patient → WaitlistEntries | One-to-Many | |
| Patient → LabReports | One-to-Many | Optional links to Doctor / Appointment (`SetNull`) |
| AuditLogs | Standalone | Written automatically by EF interceptor |

## Key Indexes & Constraints

- **Unique:** `Users.Email`, `Doctors.LicenseNumber`, `Patients.MedicalRecordNumber`, `Invoices.InvoiceNumber`, `Payments.ReceiptNumber`, `RefreshTokens.Token`, `Prescriptions.AppointmentId`, `DoctorReviews.AppointmentId`, `PrescriptionTemplates(DoctorId, Name)`
- **Composite:** `Appointments(DoctorId, AppointmentDate)`, `Appointments(PatientId, AppointmentDate)`, `DoctorSchedules(DoctorId, DayOfWeek)`, `DoctorLeaves(DoctorId, StartDate, EndDate)`, `WaitlistEntries(DoctorId, PreferredDate, Status)`, `LabReports(PatientId, ReportType)`, `Notifications(UserId, IsRead)`, `AuditLogs(EntityName, EntityId)`
- **Delete behavior:** appointment and invoice FKs use `Restrict` to preserve clinical/financial history; user-owned data cascades; optional links use `SetNull`
