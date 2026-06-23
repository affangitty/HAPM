import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { extractApiErrorMessage } from '../../../core/auth/utils/api-error.util';
import { AuthService } from '../../../core/auth/auth.service';
import { FormFieldComponent } from '../../../shared/components/forms/form-field/form-field.component';
import { UiButtonComponent } from '../../../shared/components/ui/button/ui-button.component';
import { UiCardComponent, UiCardContentComponent } from '../../../shared/components/ui/card/ui-card.component';
import { UiInputComponent } from '../../../shared/components/ui/input/ui-input.component';
import { UiSelectComponent } from '../../../shared/components/ui/select/ui-select.component';
import { UiSkeletonComponent } from '../../../shared/components/ui/skeleton/ui-skeleton.component';
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
    UiButtonComponent, UiSkeletonComponent, InvoiceSummaryCardComponent, InvoiceItemsTableComponent,
    PaymentHistoryTableComponent, FormFieldComponent, UiInputComponent, UiSelectComponent,
  ],
  template: `
    <a [routerLink]="basePath() + '/billing'" class="text-xs text-primary hover:underline">← Back to invoices</a>

    @if (loading()) { <app-ui-skeleton class="mt-4 h-64" /> } @else {
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

        @if (isStaff() && inv.balanceDue > 0 && inv.status !== 'Cancelled') {
          <app-ui-card class="mt-6 max-w-md">
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
      }
    }
  `,
})
export class InvoiceDetailPageComponent implements OnInit {
  private readonly api = inject(BillingApiService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly paying = signal(false);
  readonly error = signal<string | null>(null);
  readonly invoice = signal<InvoiceDto | null>(null);

  readonly methodOptions = [
    { label: 'Cash', value: 'Cash' }, { label: 'Card', value: 'Card' },
    { label: 'UPI', value: 'Upi' }, { label: 'Insurance', value: 'Insurance' },
    { label: 'Bank transfer', value: 'BankTransfer' },
  ];

  readonly paymentForm = this.fb.nonNullable.group({
    amount: [0, [Validators.required, Validators.min(0.01)]],
    paymentMethod: ['Cash' as PaymentMethod, Validators.required],
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getById(id).subscribe({
      next: (inv) => {
        this.invoice.set(inv);
        this.paymentForm.patchValue({ amount: inv.balanceDue });
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  isStaff(): boolean {
    const role = this.auth.role();
    return role === 'Admin' || role === 'Receptionist';
  }

  pay(): void {
    const inv = this.invoice();
    if (!inv || this.paymentForm.invalid) return;
    this.paying.set(true);
    const v = this.paymentForm.getRawValue();
    this.api.addPayment(inv.id, { amount: v.amount, paymentMethod: v.paymentMethod }).subscribe({
      next: (updated) => { this.invoice.set(updated); this.paying.set(false); },
      error: (err) => { this.error.set(extractApiErrorMessage(err, 'Payment failed.')); this.paying.set(false); },
    });
  }

  basePath(): string { return `/${this.router.url.split('/').filter(Boolean)[0]}`; }
}
