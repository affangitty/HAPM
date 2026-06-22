using HAPM.Application.Interfaces;
using HAPM.Application.Realtime;
using HAPM.Application.Services;
using HAPM.Application.Tests.Infrastructure.Fakes;
using HAPM.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HAPM.Application.Tests.Infrastructure;

public abstract class ServiceTestBase : IDisposable
{
    private readonly AppDbContext _context;

    protected UnitOfWork Uow { get; }
    protected FakeCurrentUser CurrentUser { get; } = new();
    protected FakeNotificationService Notifications { get; } = new();
    protected NullAppointmentBoardDispatcher Board { get; } = new();
    protected NullRealtimeNotificationDispatcher Realtime { get; } = new();
    protected FakePasswordHasher PasswordHasher { get; } = new();
    protected FakeTokenService TokenService { get; } = new();
    protected FakeFileStorageService FileStorage { get; } = new();

    protected ServiceTestBase()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"hapm-tests-{Guid.NewGuid():N}")
            .Options;

        _context = new AppDbContext(options);
        Uow = new UnitOfWork(_context);
    }

    protected async Task<TestScenario> SeedScenarioAsync(CancellationToken ct = default) =>
        await TestData.SeedStandardScenarioAsync(Uow, ct);

    public void Dispose()
    {
        _context.Dispose();
        GC.SuppressFinalize(this);
    }
}
