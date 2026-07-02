import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiErrorService } from '../../../core/api/api-error.service';
import { extractApiErrorMessage } from '../../../core/auth/utils/api-error.util';
import { AuthService } from '../../../core/auth/auth.service';
import { FormFieldComponent } from '../../../shared/components/forms/form-field/form-field.component';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiCardComponent, UiCardContentComponent } from '../../../shared/components/ui/card/ui-card.component';
import { UiEmptyStateComponent } from '../../../shared/components/ui/empty-state/ui-empty-state.component';
import { UiInputComponent } from '../../../shared/components/ui/input/ui-input.component';
import { UiSelectComponent } from '../../../shared/components/ui/select/ui-select.component';
import { UiSkeletonComponent } from '../../../shared/components/ui/skeleton/ui-skeleton.component';
import { UiTextareaComponent } from '../../../shared/components/ui/textarea/ui-textarea.component';
import { HasUnsavedChanges } from '../../../core/guards/has-unsaved-changes';
import { initDetailRouteLoader } from '../../../shared/utils/detail-route.util';
import { bindUnsavedChangesProtection, formsAreDirty, markFormsPristine } from '../../../shared/utils/unsaved-changes.util';
import { roleRoute } from '../../../shared/utils/role-prefix.util';
import { PaymentMethod } from '../../../shared/models/enums';
import { InvoiceItemsTableComponent } from '../components/invoice-items-table.component';
import { InvoiceSummaryCardComponent } from '../components/invoice-summary-card.component';
import { PaymentHistoryTableComponent } from '../components/payment-history-table.component';
import { BillingApiService } from '../data/billing-api.service';
import { InvoiceDto } from '../models/billing.models';

@Component({
  selector: 'app-invoice-detail-page',
  standalone: true,
  imports: [
    RouterLink, ReactiveFormsModule, UiCardComponent, UiCardContentComponent,
    UiButtonComponent, UiSkeletonComponent, UiEmptyStateComponent, InvoiceSummaryCardComponent, InvoiceItemsTableComponent,
    PaymentHistoryTableComponent, FormFieldComponent, UiInputComponent, UiSelectComponent, UiTextareaComponent,
  ],
  template: `
    <a [routerLink]="listLink()" class="text-xs text-primary hover:underline">← Back to invoices</a>

    @if (loading()) {
      <app-ui-skeleton class="mt-4 h-64" />
    } @else if (notFound()) {
      <app-ui-empty-state class="mt-6 block" title="Invoice not found" message="This invoice may have been removed or you may not have access." />
    } @else {
      @if (invoice(); as inv) {
        <app-invoice-summary-card class="mt-4 block" [invoice]="inv" />

        <div class="mt-6 grid gap-6 lg:grid-cols-2">
          <div>
            <h2 class="mb-3 font-semibold">Line items</h2>
            <app-invoice-items-table [items]="inv.items" />
            <div class="mt-4 space-y-1 text-sm">
              <div class="flex justify-between"><span class="text-muted-foreground">Subtotal</span><span>{{ '$' + inv.subTotal.toFixed(2) }}</span></div>
              <div class="flex justify-between"><span class="text-muted-foreground">Tax ({{ inv.taxPercent }}%)</span><span>{{ '$' + inv.taxAmount.toFixed(2) }}</span></div>
              <div class="flex justify-between"><span class="text-muted-foreground">Discount</span><span>{{ '$' + inv.discountAmount.toFixed(2) }}</span></div>
              <div class="flex justify-between font-semibold"><span>Total</span><span>{{ '$' + inv.totalAmount.toFixed(2) }}</span></div>
            </div>
          </div>
          <div>
            <h2 class="mb-3 font-semibold">Payments</h2>
            <app-payment-history-table [payments]="inv.payments" />
          </div>
        </div>

        @if (isStaff() && inv.status === 'Pending') {
          <app-ui-card class="mt-6">
            <app-ui-card-content class="space-y-4 p-5">
              <h3 class="font-semibold">Edit invoice</h3>
              <form [formGroup]="editForm" (ngSubmit)="saveEdit()">
                <div class="grid gap-4 sm:grid-cols-2">
                  <app-form-field label="Tax %"><app-ui-input type="number" formControlName="taxPercent" step="0.01" /></app-form-field>
                  <app-form-field label="Discount"><app-ui-input type="number" formControlName="discountAmount" step="0.01" /></app-form-field>
                  <app-form-field label="Notes" class="sm:col-span-2"><app-ui-textarea formControlName="notes" [rows]="2" /></app-form-field>
                </div>
                <div class="mt-4 space-y-3" formArrayName="items">
                  @for (group of editItemControls; track $index; let i = $index) {
                    <div class="grid gap-3 rounded-lg border p-3 sm:grid-cols-4" [formGroupName]="i">
                      <app-form-field label="Description" class="sm:col-span-2"><app-ui-input formControlName="description" /></app-form-field>
                      <app-form-field label="Qty"><app-ui-input type="number" formControlName="quantity" /></app-form-field>
                      <app-form-field label="Unit price"><app-ui-input type="number" formControlName="unitPrice" step="0.01" /></app-form-field>
                    </div>
                  }
                </div>
                <app-ui-button type="submit" class="mt-4" [loading]="editing()">Save changes</app-ui-button>
              </form>
            </app-ui-card-content>
          </app-ui-card>
        }

        @if (isPatient() && inv.balanceDue > 0 && inv.status !== 'Cancelled') {
          <app-ui-card class="mt-6 max-w-md">
            <app-ui-card-content class="space-y-4 p-5">
              <h3 class="font-semibold">Pay online</h3>
              <p class="text-sm text-muted-foreground">
                Outstanding balance: <span class="font-semibold text-foreground">{{ '$' + inv.balanceDue.toFixed(2) }}</span>
              </p>
              <form [formGroup]="paymentForm" (ngSubmit)="pay()">
                <app-form-field label="Amount">
                  <app-ui-input type="number" formControlName="amount" step="0.01" />
                </app-form-field>
                <app-form-field label="Payment method">
                  <app-ui-select formControlName="paymentMethod" [options]="patientMethodOptions" />
                </app-form-field>
                @if (error()) { <p class="text-sm text-destructive">{{ error() }}</p> }
                @if (paymentSuccess()) {
                  <p class="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{{ paymentSuccess() }}</p>
                }
                <app-ui-button type="submit" class="mt-2" [loading]="paying()">
                  Pay {{ '$' + paymentForm.controls.amount.value.toFixed(2) }}
                </app-ui-button>
              </form>
            </app-ui-card-content>
          </app-ui-card>
        }

        @if (isStaff() && inv.status !== 'Cancelled') {
          <div class="mt-6 flex flex-wrap gap-2">
            @if (inv.balanceDue > 0) {
              <app-ui-card class="max-w-md flex-1">
                <app-ui-card-content class="space-y-4 p-5">
                  <h3 class="font-semibold">Record payment</h3>
                  <form [formGroup]="paymentForm" (ngSubmit)="pay()">
                    <app-form-field label="Amount"><app-ui-input type="number" formControlName="amount" /></app-form-field>
                    <app-form-field label="Method"><app-ui-select formControlName="paymentMethod" [options]="methodOptions" /></app-form-field>
                    @if (error()) { <p class="text-sm text-destructive">{{ error() }}</p> }
                    <app-ui-button type="submit" [loading]="paying()">Apply payment</app-ui-button>
                  </form>
                </app-ui-card-content>
              </app-ui-card>
            }
            <app-ui-card class="max-w-xs">
              <app-ui-card-content class="p-5">
                <h3 class="mb-2 font-semibold">Cancel invoice</h3>
                <p class="mb-3 text-sm text-muted-foreground">Void this invoice if it was issued in error.</p>
                <app-ui-button variant="destructive" [loading]="cancelling()" (pressed)="cancelInvoice()">Cancel invoice</app-ui-button>
              </app-ui-card-content>
            </app-ui-card>
          </div>
        }
      }
    }
  `,
})
export class InvoiceDetailPageComponent implements HasUnsavedChanges {
  private readonly api = inject(BillingApiService);
  private readonly auth = inject(AuthService);
  private readonly toasts = inject(ApiErrorService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly routeState = initDetailRouteLoader(
    'id',
    (id) => this.api.getById(id),
    this.destroyRef,
    { onLoaded: (inv) => {
        this.paymentForm.patchValue({
          amount: inv.balanceDue,
          paymentMethod: this.isPatient() ? 'Card' : 'Cash',
        });
        markFormsPristine(this.paymentForm);
        this.patchEditForm(inv);
      } },
  );

  readonly loading = this.routeState.loading;
  readonly notFound = this.routeState.notFound;
  readonly invoice = this.routeState.data;
  readonly paying = signal(false);
  readonly cancelling = signal(false);
  readonly editing = signal(false);
  readonly error = signal<string | null>(null);
  readonly paymentSuccess = signal<string | null>(null);

  readonly methodOptions = [
    { label: 'Cash', value: 'Cash' }, { label: 'Card', value: 'Card' },
    { label: 'UPI', value: 'Upi' }, { label: 'Insurance', value: 'Insurance' },
    { label: 'Bank transfer', value: 'BankTransfer' },
  ];

  readonly patientMethodOptions = [
    { label: 'Credit / debit card', value: 'Card' },
    { label: 'UPI', value: 'Upi' },
  ];

  readonly paymentForm = this.fb.nonNullable.group({
    amount: [0, [Validators.required, Validators.min(0.01)]],
    paymentMethod: ['Cash' as PaymentMethod, Validators.required],
  });

  readonly editForm = this.fb.nonNullable.group({
    taxPercent: [5, [Validators.required, Validators.min(0)]],
    discountAmount: [0, [Validators.required, Validators.min(0)]],
    notes: [''],
    items: this.fb.nonNullable.array([] as ReturnType<typeof this.editItemGroup>[]),
  });

  get editItemControls() {
    return this.editForm.controls.items.controls;
  }

  constructor() {
    bindUnsavedChangesProtection(this.destroyRef, () => this.hasUnsavedChanges());
  }

  hasUnsavedChanges(): boolean {
    return formsAreDirty(this.paymentForm) || (this.editing() && formsAreDirty(this.editForm));
  }

  isStaff(): boolean {
    const role = this.auth.role();
    return role === 'Admin' || role === 'Receptionist';
  }

  isPatient(): boolean {
    return this.auth.role() === 'Patient';
  }

  pay(): void {
    const inv = this.invoice();
    if (!inv || this.paymentForm.invalid) return;
    this.paying.set(true);
    this.error.set(null);
    this.paymentSuccess.set(null);
    const v = this.paymentForm.getRawValue();
    this.api.addPayment(inv.id, { amount: v.amount, paymentMethod: v.paymentMethod }).subscribe({
      next: (updated) => {
        this.invoice.set(updated);
        this.paying.set(false);
        this.paymentForm.patchValue({ amount: updated.balanceDue, paymentMethod: this.isPatient() ? 'Card' : v.paymentMethod });
        markFormsPristine(this.paymentForm);
        if (updated.balanceDue <= 0) {
          this.paymentSuccess.set('Payment successful. This invoice is fully paid.');
          this.toasts.show('Payment successful.', 'success');
        } else {
          this.paymentSuccess.set(`Payment recorded. Remaining balance: $${updated.balanceDue.toFixed(2)}`);
          this.toasts.show('Payment recorded.', 'success');
        }
      },
      error: (err) => { this.error.set(extractApiErrorMessage(err, 'Payment failed.')); this.paying.set(false); },
    });
  }

  saveEdit(): void {
    const inv = this.invoice();
    if (!inv || this.editForm.invalid) return;
    this.editing.set(true);
    const v = this.editForm.getRawValue();
    this.api.update(inv.id, {
      taxPercent: v.taxPercent,
      discountAmount: v.discountAmount,
      notes: v.notes || undefined,
      items: v.items.map((i) => ({ description: i.description, quantity: i.quantity, unitPrice: i.unitPrice })),
    }).subscribe({
      next: (updated) => {
        this.editing.set(false);
        this.invoice.set(updated);
        this.patchEditForm(updated);
        this.toasts.show('Invoice updated.', 'success');
      },
      error: (err) => {
        this.editing.set(false);
        this.toasts.show(extractApiErrorMessage(err, 'Failed to update invoice.'), 'error');
      },
    });
  }

  cancelInvoice(): void {
    const inv = this.invoice();
    if (!inv || !confirm(`Cancel invoice ${inv.invoiceNumber}?`)) return;
    this.cancelling.set(true);
    this.api.cancel(inv.id).subscribe({
      next: () => {
        this.cancelling.set(false);
        this.toasts.show('Invoice cancelled.', 'success');
        this.api.getById(inv.id).subscribe({ next: (updated) => this.invoice.set(updated) });
      },
      error: (err) => {
        this.cancelling.set(false);
        this.toasts.show(extractApiErrorMessage(err, 'Failed to cancel invoice.'), 'error');
      },
    });
  }

  listLink(): string {
    return roleRoute(this.router, 'billing');
  }

  private patchEditForm(inv: InvoiceDto): void {
    this.editForm.patchValue({
      taxPercent: inv.taxPercent,
      discountAmount: inv.discountAmount,
      notes: inv.notes ?? '',
    });
    this.editForm.controls.items.clear();
    for (const item of inv.items) {
      this.editForm.controls.items.push(this.editItemGroup(item.description, item.quantity, item.unitPrice));
    }
    markFormsPristine(this.editForm);
  }

  private editItemGroup(description = '', quantity = 1, unitPrice = 0) {
    return this.fb.nonNullable.group({
      description: [description, Validators.required],
      quantity: [quantity, [Validators.required, Validators.min(1)]],
      unitPrice: [unitPrice, [Validators.required, Validators.min(0)]],
    });
  }
}
