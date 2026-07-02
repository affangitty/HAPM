using HAPM.Application.Common;
using HAPM.Application.DTOs;
using HAPM.Application.Services;
using HAPM.Application.Tests.Infrastructure;
using HAPM.Domain.Enums;

namespace HAPM.Application.Tests.Services;

public class PrescriptionTemplateServiceTests : ServiceTestBase
{
    private PrescriptionTemplateService CreateSut() => new(Uow, CurrentUser);

    [Fact]
    public async Task GetMineAsync_returns_doctor_templates()
    {
        var scenario = await SeedScenarioAsync();
        CurrentUser.As(UserRole.Doctor, scenario.DoctorUserId);
        var sut = CreateSut();

        await sut.CreateAsync(SampleRequest("Cold Pack"));

        var templates = await sut.GetMineAsync();
        Assert.Single(templates);
    }

    [Fact]
    public async Task GetByIdAsync_returns_template()
    {
        var scenario = await SeedScenarioAsync();
        CurrentUser.As(UserRole.Doctor, scenario.DoctorUserId);
        var sut = CreateSut();
        var created = await sut.CreateAsync(SampleRequest("Fever Pack"));

        var template = await sut.GetByIdAsync(created.Id);
        Assert.Equal("Fever Pack", template.Name);
    }

    [Fact]
    public async Task CreateAsync_duplicate_name_throws_conflict()
    {
        var scenario = await SeedScenarioAsync();
        CurrentUser.As(UserRole.Doctor, scenario.DoctorUserId);
        var sut = CreateSut();
        await sut.CreateAsync(SampleRequest("Duplicate"));

        await Assert.ThrowsAsync<ConflictException>(() => sut.CreateAsync(SampleRequest("duplicate")));
    }

    [Fact]
    public async Task PatchAsync_updates_template()
    {
        var scenario = await SeedScenarioAsync();
        CurrentUser.As(UserRole.Doctor, scenario.DoctorUserId);
        var sut = CreateSut();
        var created = await sut.CreateAsync(SampleRequest("Original"));

        var updated = await sut.PatchAsync(created.Id, new PatchPrescriptionTemplateRequest { Name = "Updated" });
        Assert.Equal("Updated", updated.Name);
    }

    [Fact]
    public async Task DeleteAsync_removes_template()
    {
        var scenario = await SeedScenarioAsync();
        CurrentUser.As(UserRole.Doctor, scenario.DoctorUserId);
        var sut = CreateSut();
        var created = await sut.CreateAsync(SampleRequest("To Delete"));

        await sut.DeleteAsync(created.Id);

        await Assert.ThrowsAsync<NotFoundException>(() => sut.GetByIdAsync(created.Id));
    }

    [Fact]
    public async Task Non_doctor_forbidden()
    {
        var scenario = await SeedScenarioAsync();
        CurrentUser.As(UserRole.Patient, scenario.PatientUserId);
        var sut = CreateSut();

        await Assert.ThrowsAsync<ForbiddenException>(() => sut.GetMineAsync());
    }

    private static SavePrescriptionTemplateRequest SampleRequest(string name) => new()
    {
        Name = name,
        Diagnosis = "Common cold",
        Notes = "Rest well",
        Items = new List<PrescriptionItemRequest> { TestData.SamplePrescriptionItem() }
    };
}
