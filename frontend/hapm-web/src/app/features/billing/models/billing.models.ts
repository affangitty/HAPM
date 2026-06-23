import { PaginationParams } from '../../../core/api/api.models';
import { InvoiceStatus, PaymentMethod } from '../../../shared/models/enums';

export interface InvoiceItemRequest {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateInvoiceRequest {
  patientId: number;
  appointmentId?: number;
  taxPercent: number;
  discountAmount: number;
  notes?: string;
  items: InvoiceItemRequest[];
}

export interface UpdateInvoiceRequest {
  taxPercent: number;
  discountAmount: number;
  notes?: string;
  items: InvoiceItemRequest[];
}

export interface AddPaymentRequest {
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface InvoiceQueryParams extends PaginationParams {
  patientId?: number;
  status?: InvoiceStatus;
  fromDate?: string;
  toDate?: string;
}

export interface InvoiceItemDto {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface PaymentDto {
  id: number;
  receiptNumber: string;
  amount: number;
  method: PaymentMethod;
  notes?: string;
  paidAtUtc: string;
}

export interface InvoiceDto {
  id: number;
  invoiceNumber: string;
  patientId: number;
  patientName: string;
  medicalRecordNumber: string;
  appointmentId?: number;
  subTotal: number;
  taxPercent: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  status: InvoiceStatus;
  paidAtUtc?: string;
  notes?: string;
  createdAtUtc: string;
  items: InvoiceItemDto[];
  payments: PaymentDto[];
}
