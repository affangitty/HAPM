using HAPM.Application.Common;
using HAPM.Domain.Enums;
using HAPM.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace HAPM.Infrastructure.BackgroundJobs;

/// <summary>
/// Periodically creates in-app reminder notifications for confirmed appointments
/// happening within the next 24 hours, and for prescription follow-ups due within 2 days.
/// </summary>
public class AppointmentReminderService : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(5);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<AppointmentReminderService> _logger;

    public AppointmentReminderService(IServiceScopeFactory scopeFactory, ILogger<AppointmentReminderService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await SendDueRemindersAsync(stoppingToken);
                await SendFollowUpRemindersAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Appointment reminder job failed.");
            }

            await Task.Delay(Interval, stoppingToken);
        }
    }

    private async Task SendDueRemindersAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var now = HospitalClock.Now;
        var windowEnd = now.AddHours(24);
        var today = HospitalClock.Today;
        var windowEndDate = DateOnly.FromDateTime(windowEnd);

        var due = await context.Appointments
            .Include(a => a.Patient)
            .Include(a => a.Doctor).ThenInclude(d => d.User)
            .Where(a => !a.ReminderSent &&
                        a.Status == AppointmentStatus.Confirmed &&
                        a.AppointmentDate >= today &&
                        a.AppointmentDate <= windowEndDate)
            .ToListAsync(ct);

        var sent = 0;
        foreach (var appointment in due)
        {
            var slotStart = appointment.AppointmentDate.ToDateTime(appointment.StartTime);
            if (slotStart <= now || slotStart > windowEnd)
                continue;

            context.Notifications.Add(new Domain.Entities.Notification
            {
                UserId = appointment.Patient.UserId,
                Type = NotificationType.AppointmentReminder,
                Title = "Appointment reminder",
                Message = $"Reminder: you have an appointment with Dr. {appointment.Doctor.User.FullName} " +
                          $"on {appointment.AppointmentDate:yyyy-MM-dd} at {appointment.StartTime:HH\\:mm}."
            });

            appointment.ReminderSent = true;
            sent++;
        }

        if (sent > 0)
        {
            await context.SaveChangesAsync(ct);
            _logger.LogInformation("Sent {Count} appointment reminder(s).", sent);
        }
    }

    private async Task SendFollowUpRemindersAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var today = HospitalClock.Today;
        var windowEnd = today.AddDays(2);

        var due = await context.Prescriptions
            .Include(p => p.Patient)
            .Include(p => p.Doctor).ThenInclude(d => d.User)
            .Where(p => !p.FollowUpReminderSent &&
                        p.FollowUpDate != null &&
                        p.FollowUpDate >= today &&
                        p.FollowUpDate <= windowEnd)
            .ToListAsync(ct);

        foreach (var prescription in due)
        {
            context.Notifications.Add(new Domain.Entities.Notification
            {
                UserId = prescription.Patient.UserId,
                Type = NotificationType.FollowUpDue,
                Title = "Follow-up due soon",
                Message = $"Your follow-up with Dr. {prescription.Doctor.User.FullName} is due on " +
                          $"{prescription.FollowUpDate:yyyy-MM-dd}. Please book an appointment."
            });

            prescription.FollowUpReminderSent = true;
        }

        if (due.Count > 0)
        {
            await context.SaveChangesAsync(ct);
            _logger.LogInformation("Sent {Count} follow-up reminder(s).", due.Count);
        }
    }
}
