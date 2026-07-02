namespace HAPM.Application.Configuration;

public class AuditSettings
{
    public const string SectionName = "Audit";

    /// <summary>Move audit rows older than this to the archive table.</summary>
    public int ArchiveAfterDays { get; set; } = 90;

    /// <summary>Delete archived rows older than this (0 = keep forever).</summary>
    public int PurgeArchiveAfterDays { get; set; } = 365;

    /// <summary>How often the archive job runs.</summary>
    public int ArchiveIntervalHours { get; set; } = 24;
}
