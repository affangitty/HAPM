using HAPM.Domain.Common;

namespace HAPM.Domain.Entities;

/// <summary>Weekly recurring availability window for a doctor.</summary>
public class DoctorSchedule : BaseEntity
{
    public int DoctorId { get; set; }
    public Doctor Doctor { get; set; } = null!;

    public DayOfWeek DayOfWeek { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public int SlotDurationMinutes { get; set; } = 30;
}
