using HAPM.Application.ChangeLog;
using HAPM.Domain.Enums;

namespace HAPM.Application.Tests.ChangeLog;

public class ChangeLogJsonTests
{
    [Fact]
    public void Serialize_updated_fields_use_old_new_pairs()
    {
        var json = ChangeLogJson.Serialize(
            AuditAction.Updated,
            new Dictionary<string, object?> { ["Address"] = "Old St" },
            new Dictionary<string, object?> { ["Address"] = "New St" });

        Assert.Contains("\"Address\"", json);
        Assert.Contains("\"old\":\"Old St\"", json);
        Assert.Contains("\"new\":\"New St\"", json);
    }
}
