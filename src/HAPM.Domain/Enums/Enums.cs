namespace HAPM.Domain.Enums;

public enum UserRole
{
    Admin = 1,
    Doctor = 2,
    Patient = 3,
    Receptionist = 4
}

public enum Gender
{
    Male = 1,
    Female = 2,
    Other = 3
}

public enum AppointmentStatus
{
    Pending = 1,
    Confirmed = 2,
    CheckedIn = 3,
    Completed = 4,
    Cancelled = 5,
    NoShow = 6
}

public enum InvoiceStatus
{
    Pending = 1,
    Paid = 2,
    Cancelled = 3,
    PartiallyPaid = 4
}

public enum WaitlistStatus
{
    Active = 1,
    Notified = 2,
    Cancelled = 3
}

public enum AuditAction
{
    Created = 1,
    Updated = 2,
    Deleted = 3
}

public enum PaymentMethod
{
    Cash = 1,
    Card = 2,
    Upi = 3,
    Insurance = 4,
    BankTransfer = 5
}

public enum LabReportStatus
{
    Uploaded = 1,
    Reviewed = 2
}

public enum NotificationType
{
    General = 0,
    AppointmentBooked = 1,
    AppointmentConfirmed = 2,
    AppointmentCancelled = 3,
    AppointmentReminder = 4,
    PrescriptionIssued = 5,
    LabReportUploaded = 6,
    InvoiceGenerated = 7,
    WaitlistSlotOpened = 8,
    PaymentReceived = 9,
    FollowUpDue = 10,
    AppointmentCompleted = 11
}

public enum StaffMessageTarget
{
    DoctorRoom = 1,
    StaffBroadcast = 2
}
