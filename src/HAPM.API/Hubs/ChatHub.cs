using HAPM.API.Realtime;
using HAPM.API.Security;
using HAPM.Domain.Enums;
using HAPM.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace HAPM.API.Hubs;

/// <summary>
/// Internal staff messaging — reception/admin to doctors, admin broadcast to all staff.
/// No patient access.
/// </summary>
[Authorize(Roles = Roles.Clinical)]
public class ChatHub : Hub
{
    private readonly AppDbContext _db;

    public ChatHub(AppDbContext db) => _db = db;

    public override async Task OnConnectedAsync()
    {
        var role = Context.GetRole();
        var userId = Context.GetUserId();

        if (role is UserRole.Admin or UserRole.Receptionist)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, RealtimeGroups.StaffBroadcast);
        }
        else if (role == UserRole.Doctor && userId.HasValue)
        {
            var doctorId = await _db.Doctors
                .Where(d => d.UserId == userId.Value)
                .Select(d => d.Id)
                .FirstOrDefaultAsync();

            if (doctorId > 0)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, RealtimeGroups.DoctorRoom(doctorId));
                await Groups.AddToGroupAsync(Context.ConnectionId, RealtimeGroups.StaffBroadcast);
            }
        }

        await base.OnConnectedAsync();
    }
}
