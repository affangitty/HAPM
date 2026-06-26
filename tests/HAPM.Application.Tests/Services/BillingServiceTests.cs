using HAPM.Application.Common;
using HAPM.Application.DTOs;
using HAPM.Application.Services;
using HAPM.Application.Tests.Infrastructure;
using HAPM.Domain.Enums;

namespace HAPM.Application.Tests.Services;

public class BillingServiceTests : ServiceTestBase
{
    private BillingService CreateSut() =>
        new(Uow, CurrentUser, Notifications);

    [Fact]
    public async Task CreateAsync_calculates_tax_and_total()
    {
        var scenario = await SeedScenarioAsync();
        CurrentUser.As(UserRole.Receptionist, scenario.ReceptionistUserId);
        var sut = CreateSut();

        var invoice = await sut.CreateAsync(new CreateInvoiceRequest
        {
            PatientId = scenario.PatientId,
            TaxPercent = 10m,
            DiscountAmount = 5m,
            Items =
            {
                new InvoiceItemRequest { Description = "Lab test", Quantity = 1, UnitPrice = 100m }
            }
        });

        Assert.Equal(100m, invoice.SubTotal);
        Assert.Equal(10m, invoice.TaxAmount);
        Assert.Equal(105m, invoice.TotalAmount);
        Assert.Equal(InvoiceStatus.Pending, invoice.Status);
    }

    [Fact]
    public async Task CreateAsync_with_appointment_adds_consultation_fee()
    {
        var scenario = await SeedScenarioAsync();
        var appointment = await TestData.SeedAppointmentAsync(
            Uow, scenario.DoctorId, scenario.PatientId,
            scenario.FutureBookingDate, scenario.DefaultSlotStart, AppointmentStatus.Completed);

        CurrentUser.As(UserRole.Receptionist, scenario.ReceptionistUserId);
        var sut = CreateSut();

        var invoice = await sut.CreateAsync(new CreateInvoiceRequest
        {
            PatientId = scenario.PatientId,
            AppointmentId = appointment.Id,
            Items =
            {
                new InvoiceItemRequest { Description = "Medicine", Quantity = 1, UnitPrice = 50m }
            }
        });

        Assert.Equal(2, invoice.Items.Count);
        Assert.Contains(invoice.Items, i => i.Description.Contains("Consultation"));
        Assert.Equal(550m, invoice.SubTotal);
    }

    [Fact]
    public async Task CreateAsync_empty_items_throws_bad_request()
    {
        var scenario = await SeedScenarioAsync();
        CurrentUser.As(UserRole.Receptionist, scenario.ReceptionistUserId);
        var sut = CreateSut();

        await Assert.ThrowsAsync<BadRequestException>(() => sut.CreateAsync(new CreateInvoiceRequest
        {
            PatientId = scenario.PatientId,
            Items = new List<InvoiceItemRequest>()
        }));
    }

    [Fact]
    public async Task CreateAsync_discount_exceeds_total_throws_bad_request()
    {
        var scenario = await SeedScenarioAsync();
        CurrentUser.As(UserRole.Receptionist, scenario.ReceptionistUserId);
        var sut = CreateSut();

        await Assert.ThrowsAsync<BadRequestException>(() => sut.CreateAsync(new CreateInvoiceRequest
        {
            PatientId = scenario.PatientId,
            DiscountAmount = 9999m,
            Items =
            {
                new InvoiceItemRequest { Description = "Item", Quantity = 1, UnitPrice = 10m }
            }
        }));
    }

    [Fact]
    public async Task UpdateAsync_pending_invoice_updates_totals()
    {
        var scenario = await SeedScenarioAsync();
        var seeded = await TestData.SeedInvoiceAsync(Uow, scenario.PatientId, 100m);

        CurrentUser.As(UserRole.Receptionist, scenario.ReceptionistUserId);
        var sut = CreateSut();

        var updated = await sut.UpdateAsync(seeded.Id, new UpdateInvoiceRequest
        {
            TaxPercent = 0m,
            DiscountAmount = 0m,
            Items =
            {
                new InvoiceItemRequest { Description = "Updated item", Quantity = 2, UnitPrice = 75m }
            }
        });

        Assert.Equal(150m, updated.SubTotal);
        Assert.Equal(150m, updated.TotalAmount);
    }

    [Fact]
    public async Task UpdateAsync_paid_invoice_throws_conflict()
    {
        var scenario = await SeedScenarioAsync();
        var seeded = await TestData.SeedInvoiceAsync(Uow, scenario.PatientId, 100m, InvoiceStatus.Paid);

        CurrentUser.As(UserRole.Receptionist, scenario.ReceptionistUserId);
        var sut = CreateSut();

        await Assert.ThrowsAsync<ConflictException>(() => sut.UpdateAsync(seeded.Id, new UpdateInvoiceRequest
        {
            Items = { new InvoiceItemRequest { Description = "X", Quantity = 1, UnitPrice = 10m } }
        }));
    }

    [Fact]
    public async Task AddPaymentAsync_partial_payment_sets_partially_paid()
    {
        var scenario = await SeedScenarioAsync();
        var seeded = await TestData.SeedInvoiceAsync(Uow, scenario.PatientId, 200m);

        CurrentUser.As(UserRole.Receptionist, scenario.ReceptionistUserId);
        var sut = CreateSut();

        var invoice = await sut.AddPaymentAsync(seeded.Id, new AddPaymentRequest
        {
            Amount = 80m,
            PaymentMethod = PaymentMethod.Cash
        });

        Assert.Equal(InvoiceStatus.PartiallyPaid, invoice.Status);
        Assert.Equal(80m, invoice.AmountPaid);
        Assert.Equal(120m, invoice.BalanceDue);
    }

    [Fact]
    public async Task AddPaymentAsync_full_payment_sets_paid()
    {
        var scenario = await SeedScenarioAsync();
        var seeded = await TestData.SeedInvoiceAsync(Uow, scenario.PatientId, 150m);

        CurrentUser.As(UserRole.Receptionist, scenario.ReceptionistUserId);
        var sut = CreateSut();

        var invoice = await sut.AddPaymentAsync(seeded.Id, new AddPaymentRequest
        {
            Amount = 150m,
            PaymentMethod = PaymentMethod.Upi
        });

        Assert.Equal(InvoiceStatus.Paid, invoice.Status);
        Assert.Equal(0m, invoice.BalanceDue);
        Assert.NotNull(invoice.PaidAtUtc);
    }

    [Fact]
    public async Task AddPaymentAsync_exceeds_balance_throws_bad_request()
    {
        var scenario = await SeedScenarioAsync();
        var seeded = await TestData.SeedInvoiceAsync(Uow, scenario.PatientId, 100m);

        CurrentUser.As(UserRole.Receptionist, scenario.ReceptionistUserId);
        var sut = CreateSut();

        await Assert.ThrowsAsync<BadRequestException>(() => sut.AddPaymentAsync(seeded.Id, new AddPaymentRequest
        {
            Amount = 150m,
            PaymentMethod = PaymentMethod.Cash
        }));
    }

    [Fact]
    public async Task AddPaymentAsync_patient_can_pay_own_invoice_with_card()
    {
        var scenario = await SeedScenarioAsync();
        var seeded = await TestData.SeedInvoiceAsync(Uow, scenario.PatientId, 120m);

        CurrentUser.As(UserRole.Patient, scenario.PatientUserId);
        var sut = CreateSut();

        var invoice = await sut.AddPaymentAsync(seeded.Id, new AddPaymentRequest
        {
            Amount = 120m,
            PaymentMethod = PaymentMethod.Card
        });

        Assert.Equal(InvoiceStatus.Paid, invoice.Status);
        Assert.Equal(0m, invoice.BalanceDue);
    }

    [Fact]
    public async Task AddPaymentAsync_patient_cash_payment_throws_bad_request()
    {
        var scenario = await SeedScenarioAsync();
        var seeded = await TestData.SeedInvoiceAsync(Uow, scenario.PatientId, 80m);

        CurrentUser.As(UserRole.Patient, scenario.PatientUserId);
        var sut = CreateSut();

        await Assert.ThrowsAsync<BadRequestException>(() => sut.AddPaymentAsync(seeded.Id, new AddPaymentRequest
        {
            Amount = 80m,
            PaymentMethod = PaymentMethod.Cash
        }));
    }

    [Fact]
    public async Task CancelAsync_pending_invoice_succeeds()
    {
        var scenario = await SeedScenarioAsync();
        var seeded = await TestData.SeedInvoiceAsync(Uow, scenario.PatientId, 100m);

        CurrentUser.As(UserRole.Receptionist, scenario.ReceptionistUserId);
        var sut = CreateSut();

        var invoice = await sut.CancelAsync(seeded.Id);

        Assert.Equal(InvoiceStatus.Cancelled, invoice.Status);
    }
}
