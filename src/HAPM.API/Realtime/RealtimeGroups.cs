namespace HAPM.API.Realtime;

public static class RealtimeGroups
{
    public static string ForUser(int userId) => $"user-{userId}";
    public static string StaffBoard => "staff-board";
    public static string DoctorRoom(int doctorId) => $"doctor-{doctorId}";
    public static string StaffBroadcast => "staff-broadcast";
}
