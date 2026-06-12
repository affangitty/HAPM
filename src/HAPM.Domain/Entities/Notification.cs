using HAPM.Domain.Common;
using HAPM.Domain.Enums;

namespace HAPM.Domain.Entities;

public class Notification : BaseEntity
{
    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public NotificationType Type { get; set; } = NotificationType.General;
    public string Title { get; set; } = null!;
    public string Message { get; set; } = null!;
    public bool IsRead { get; set; }
    public DateTime? ReadAtUtc { get; set; }
}
