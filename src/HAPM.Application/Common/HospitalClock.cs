namespace HAPM.Application.Common;

/// <summary>
/// Single source of truth for hospital-local wall-clock time.
/// Appointment dates and slot times are stored without timezone offsets and are
/// interpreted in the hospital's local timezone (server local time).
/// </summary>
public static class HospitalClock
{
    public static DateTime Now => DateTime.Now;

    public static DateOnly Today => DateOnly.FromDateTime(Now);

    public static TimeOnly CurrentTime => TimeOnly.FromDateTime(Now);
}
