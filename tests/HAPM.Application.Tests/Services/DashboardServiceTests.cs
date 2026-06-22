using System.Text;
using HAPM.Application.Common;
using HAPM.Application.Services;
using HAPM.Application.Tests.Infrastructure;
using HAPM.Domain.Entities;
using HAPM.Domain.Enums;

namespace HAPM.Application.Tests.Services;

public class DashboardServiceTests : ServiceTestBase
{
    private DashboardService CreateSut() => new(Uow);

    [Fact]
    public async Task GetStatsAsync_returns_aggregated_counts()
    {
        var scenario = await SeedScenarioAsync();
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var appointment = await TestData.SeedAppointmentAsync(
            Uow, scenario.DoctorId, scenario.PatientId,
            today, scenario.DefaultSlotStart, AppointmentStatus.Confirmed);
        var invoice = await TestData.SeedInvoiceAsync(Uow, scenario.PatientId, 100m, appointmentId: appointment.Id);
        await Uow.Payments.AddAsync(new Payment
        {
            InvoiceId = invoice.Id,
            ReceiptNumber = "RCP-TEST-001",
            Amount = 50m,
            Method = PaymentMethod.Cash,
            ReceivedByUserId = scenario.AdminUserId
        });
        await Uow.SaveChangesAsync();

        var sut = CreateSut();
        var stats = await sut.GetStatsAsync();

        Assert.True(stats.TotalDoctors >= 1);
        Assert.True(stats.TotalPatients >= 2);
        Assert.True(stats.TotalAppointments >= 1);
        Assert.True(stats.AppointmentsToday >= 1);
        Assert.True(stats.TotalRevenue >= 50m);
        Assert.NotEmpty(stats.AppointmentsByStatus);
        Assert.NotEmpty(stats.TopSpecializations);
    }

    [Fact]
    public async Task GetPeakHoursAsync_groups_by_day_and_hour()
    {
        var scenario = await SeedScenarioAsync();
        await TestData.SeedAppointmentAsync(
            Uow, scenario.DoctorId, scenario.PatientId,
            scenario.FutureBookingDate, new TimeOnly(10, 0), AppointmentStatus.Confirmed);

        var sut = CreateSut();
        var cells = await sut.GetPeakHoursAsync(scenario.FutureBookingDate, scenario.FutureBookingDate);

        Assert.NotEmpty(cells);
        Assert.Contains(cells, c => c.Hour == 10);
    }

    [Fact]
    public async Task GetRevenueBySpecializationAsync_returns_totals()
    {
        var scenario = await SeedScenarioAsync();
        var appointment = await TestData.SeedAppointmentAsync(
            Uow, scenario.DoctorId, scenario.PatientId,
            HospitalClock.Today.AddDays(-1), new TimeOnly(11, 0), AppointmentStatus.Completed);
        var invoice = await TestData.SeedInvoiceAsync(Uow, scenario.PatientId, 200m, appointmentId: appointment.Id);
        await Uow.Payments.AddAsync(new Payment
        {
            InvoiceId = invoice.Id,
            ReceiptNumber = "RCP-TEST-002",
            Amount = 200m,
            Method = PaymentMethod.Card,
            ReceivedByUserId = scenario.AdminUserId
        });
        await Uow.SaveChangesAsync();

        var sut = CreateSut();
        var rows = await sut.GetRevenueBySpecializationAsync();

        Assert.Contains(rows, r => r.Specialization == "Cardiology" && r.TotalRevenue == 200m);
    }
}
