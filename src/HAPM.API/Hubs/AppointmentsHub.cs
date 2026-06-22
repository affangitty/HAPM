using HAPM.API.Realtime;
using HAPM.Domain.Enums;
using HAPM.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace HAPM.API.Hubs;

/// <summary>
/// Live appointment status board for reception and admin staff.
/// </summary>
[Authorize]
public class AppointmentsHub : Hub
{
    private readonly AppDbContext _db;

    public AppointmentsHub(AppDbContext db) => _db = db;

    public override async Task OnConnectedAsync()
    {
        var role = Context.GetRole();
        if (role is UserRole.Admin or UserRole.Receptionist)
            await Groups.AddToGroupAsync(Context.ConnectionId, RealtimeGroups.StaffBoard);

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var role = Context.GetRole();
        if (role is UserRole.Admin or UserRole.Receptionist)
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, RealtimeGroups.StaffBoard);

        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>Subscribe a doctor to their own appointment queue updates (optional).</summary>
    public async Task JoinDoctorQueue(int doctorId)
    {
        if (Context.GetRole() is not (UserRole.Doctor or UserRole.Admin or UserRole.Receptionist))
            throw new HubException("Forbidden.");

        if (Context.GetRole() == UserRole.Doctor)
        {
            var userId = Context.GetUserId() ?? throw new HubException("Unauthorized.");
            var ownsDoctor = await _db.Doctors.AnyAsync(d => d.Id == doctorId && d.UserId == userId);
            if (!ownsDoctor)
                throw new HubException("Forbidden.");
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, RealtimeGroups.DoctorRoom(doctorId));
    }
}
