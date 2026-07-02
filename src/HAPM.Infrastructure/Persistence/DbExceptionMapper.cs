using Microsoft.EntityFrameworkCore;

namespace HAPM.Infrastructure.Persistence;

public static class DbExceptionMapper
{
  public static bool IsUniqueViolation(DbUpdateException exception)
  {
    var message = exception.InnerException?.Message ?? string.Empty;
    return message.Contains("23505", StringComparison.Ordinal) ||
           message.Contains("duplicate key", StringComparison.OrdinalIgnoreCase) ||
           message.Contains("unique constraint", StringComparison.OrdinalIgnoreCase);
  }

  public static string UniqueViolationMessage(DbUpdateException exception)
  {
    var entry = exception.Entries.FirstOrDefault();
    if (entry is null)
      return "A record with the same unique value already exists.";

    return $"{entry.Metadata.ClrType.Name} conflicts with an existing record.";
  }
}
