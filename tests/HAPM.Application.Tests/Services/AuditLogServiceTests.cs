using HAPM.Application.DTOs;
using HAPM.Application.Services;
using HAPM.Application.Tests.Infrastructure;
using HAPM.Domain.Entities;
using HAPM.Domain.Enums;

namespace HAPM.Application.Tests.Services;

public class AuditLogServiceTests : ServiceTestBase
{
    private AuditLogService CreateSut() => new(Uow);

    [Fact]
    public async Task GetPagedAsync_applies_all_filters()
    {
        var scenario = await SeedScenarioAsync();
        await Uow.AuditLogs.AddAsync(new AuditLog
        {
            UserId = scenario.AdminUserId,
            UserEmail = "admin@test.local",
            EntityName = "Patient",
            EntityId = "1",
            Action = AuditAction.Updated,
            ChangesJson = "{}",
            CreatedAtUtc = DateTime.UtcNow
        });
        await Uow.AuditLogs.AddAsync(new AuditLog
        {
            UserId = scenario.ReceptionistUserId,
            UserEmail = "reception@test.local",
            EntityName = "Appointment",
            EntityId = "2",
            Action = AuditAction.Created,
            ChangesJson = "{}",
            CreatedAtUtc = DateTime.UtcNow.AddDays(-2)
        });
        await Uow.SaveChangesAsync();

        var sut = CreateSut();
        var result = await sut.GetPagedAsync(new AuditLogQueryParams
        {
            EntityName = "Patient",
            Action = AuditAction.Updated,
            UserId = scenario.AdminUserId,
            FromDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1)),
            ToDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)),
            Search = "admin",
            Page = 1,
            PageSize = 10
        });

        Assert.Single(result.Items);
        Assert.Equal("Patient", result.Items[0].EntityName);
    }
}
