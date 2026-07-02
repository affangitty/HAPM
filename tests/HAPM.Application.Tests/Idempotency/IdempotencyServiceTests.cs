using HAPM.Application.Idempotency;
using HAPM.Domain.Enums;
using HAPM.Infrastructure.Idempotency;
using HAPM.Infrastructure.Persistence;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;

namespace HAPM.Application.Tests.Idempotency;

public class IdempotencyServiceTests : IDisposable
{
  private readonly SqliteConnection _connection;
  private readonly AppDbContext _db;
  private readonly IdempotencyService _service;

  public IdempotencyServiceTests()
  {
    _connection = new SqliteConnection("DataSource=:memory:");
    _connection.Open();

    var options = new DbContextOptionsBuilder<AppDbContext>()
      .UseSqlite(_connection)
      .Options;
    _db = new AppDbContext(options);
    _db.Database.EnsureCreated();
    _service = new IdempotencyService(_db, NullLogger<IdempotencyService>.Instance);
  }

  [Fact]
  public async Task Begin_replays_completed_response()
  {
    var first = await _service.BeginAsync("key-1", 7, "POST", "/api/appointments", "hash-a");
    await _service.CompleteAsync(first.RecordId!.Value, 201, """{"id":1}""", "application/json");

    var second = await _service.BeginAsync("key-1", 7, "POST", "/api/appointments", "hash-a");

    Assert.Equal(IdempotencyBeginKind.Replay, second.Kind);
    Assert.Equal(201, second.ReplayStatusCode);
    Assert.Equal("""{"id":1}""", second.ReplayBody);
  }

  [Fact]
  public async Task Begin_returns_payload_mismatch_for_same_key_different_body()
  {
    await _service.BeginAsync("key-2", 1, "POST", "/api/patients", "hash-a");

    var result = await _service.BeginAsync("key-2", 1, "POST", "/api/patients", "hash-b");

    Assert.Equal(IdempotencyBeginKind.PayloadMismatch, result.Kind);
  }

  [Fact]
  public async Task Complete_marks_failed_for_server_errors_so_retry_can_proceed()
  {
    var begin = await _service.BeginAsync("key-3", 2, "POST", "/api/invoices", "hash-a");
    await _service.CompleteAsync(begin.RecordId!.Value, 500, null, null);

    var retry = await _service.BeginAsync("key-3", 2, "POST", "/api/invoices", "hash-a");

    Assert.Equal(IdempotencyBeginKind.Proceed, retry.Kind);
  }

  [Fact]
  public async Task PurgeExpired_removes_old_records()
  {
    _db.IdempotencyRecords.Add(new Domain.Entities.IdempotencyRecord
    {
      IdempotencyKey = "old",
      UserScope = 0,
      HttpMethod = "POST",
      RequestPath = "/api/auth/register",
      RequestBodyHash = "abc",
      Status = IdempotencyStatus.Completed,
      ExpiresAtUtc = DateTime.UtcNow.AddHours(-1),
    });
    await _db.SaveChangesAsync();

    var removed = await _service.PurgeExpiredAsync();

    Assert.Equal(1, removed);
    Assert.Empty(await _db.IdempotencyRecords.ToListAsync());
  }

  public void Dispose()
  {
    _db.Dispose();
    _connection.Dispose();
  }
}
