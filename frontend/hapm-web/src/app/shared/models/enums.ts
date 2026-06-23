export type AppointmentStatus =
  | 'Pending'
  | 'Confirmed'
  | 'CheckedIn'
  | 'Completed'
  | 'Cancelled'
  | 'NoShow';

export type InvoiceStatus = 'Pending' | 'Paid' | 'Cancelled' | 'PartiallyPaid';

export type StatusTone = 'default' | 'success' | 'warning' | 'info' | 'destructive' | 'secondary';

export const APPOINTMENT_STATUS_TONE: Record<AppointmentStatus, StatusTone> = {
  Pending: 'warning',
  Confirmed: 'info',
  CheckedIn: 'secondary',
  Completed: 'success',
  Cancelled: 'destructive',
  NoShow: 'destructive',
};

export const INVOICE_STATUS_TONE: Record<InvoiceStatus, StatusTone> = {
  Pending: 'warning',
  PartiallyPaid: 'info',
  Paid: 'success',
  Cancelled: 'destructive',
};

export type WaitlistStatus = 'Active' | 'Notified' | 'Cancelled';

export const WAITLIST_STATUS_TONE: Record<WaitlistStatus, StatusTone> = {
  Active: 'info',
  Notified: 'success',
  Cancelled: 'destructive',
};

export type LabReportStatus = 'Uploaded' | 'Reviewed';

export const LAB_REPORT_STATUS_TONE: Record<LabReportStatus, StatusTone> = {
  Uploaded: 'warning',
  Reviewed: 'success',
};

export type PaymentMethod = 'Cash' | 'Card' | 'Upi' | 'Insurance' | 'BankTransfer';

export type NotificationType =
  | 'General'
  | 'AppointmentBooked'
  | 'AppointmentConfirmed'
  | 'AppointmentCancelled'
  | 'AppointmentReminder'
  | 'PrescriptionIssued'
  | 'LabReportUploaded'
  | 'InvoiceGenerated'
  | 'WaitlistSlotOpened'
  | 'PaymentReceived'
  | 'FollowUpDue'
  | 'AppointmentCompleted';

export type AuditAction = 'Created' | 'Updated' | 'Deleted';

export const AUDIT_ACTION_TONE: Record<AuditAction, StatusTone> = {
  Created: 'success',
  Updated: 'info',
  Deleted: 'destructive',
};
