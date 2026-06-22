using System.Text;
using HAPM.Application.Services;
using HAPM.Application.Tests.Infrastructure;
using HAPM.Domain.Enums;

namespace HAPM.Application.Tests.Services;

public class ExportServiceTests : ServiceTestBase
{
    private ExportService CreateSut() => new(Uow);

    [Fact]
    public async Task ExportAppointmentsAsync_generates_csv_with_filters()
    {
        var scenario = await SeedScenarioAsync();
        await TestData.SeedAppointmentAsync(
            Uow, scenario.DoctorId, scenario.PatientId,
            scenario.FutureBookingDate, scenario.DefaultSlotStart, AppointmentStatus.Confirmed);

        var sut = CreateSut();
        var export = await sut.ExportAppointmentsAsync(scenario.FutureBookingDate, scenario.FutureBookingDate);

        var text = Encoding.UTF8.GetString(export.Content);
        Assert.StartsWith("Id,Date", text);
        Assert.Contains("Confirmed", text);
        Assert.EndsWith(".csv", export.FileName);
    }

    [Fact]
    public async Task ExportPatientsAsync_generates_csv_and_escapes_commas()
    {
        var scenario = await SeedScenarioAsync();
        var patient = await Uow.Patients.GetByIdAsync(scenario.PatientId);
        var user = await Uow.Users.GetByIdAsync(patient!.UserId);
        user!.FullName = "Patient, With Comma";
        await Uow.SaveChangesAsync();

        var sut = CreateSut();
        var export = await sut.ExportPatientsAsync();

        var text = Encoding.UTF8.GetString(export.Content);
        Assert.Contains("\"Patient, With Comma\"", text);
    }

    [Fact]
    public async Task ExportInvoicesAsync_generates_csv_with_date_filters()
    {
        var scenario = await SeedScenarioAsync();
        await TestData.SeedInvoiceAsync(Uow, scenario.PatientId, 150m);

        var sut = CreateSut();
        var export = await sut.ExportInvoicesAsync(
            DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1)),
            DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)));

        var text = Encoding.UTF8.GetString(export.Content);
        Assert.Contains("InvoiceNumber", text);
        Assert.Contains("150", text);
    }
}
