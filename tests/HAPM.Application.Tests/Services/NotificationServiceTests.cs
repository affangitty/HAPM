using HAPM.Application.Common;
using HAPM.Application.DTOs;
using HAPM.Application.Services;
using HAPM.Application.Tests.Infrastructure;
using HAPM.Domain.Entities;
using HAPM.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace HAPM.Application.Tests.Services;

public class NotificationServiceTests : ServiceTestBase
{
    private NotificationService CreateSut() => new(Uow, CurrentUser, Realtime);

    [Fact]
    public async Task NotifyAsync_persists_notification()
    {
        var scenario = await SeedScenarioAsync();
        var sut = CreateSut();

        await sut.NotifyAsync(scenario.PatientUserId, NotificationType.AppointmentBooked, "Title", "Message");

        var count = await Uow.Notifications.Query().CountAsync();
        Assert.Equal(1, count);
    }

    [Fact]
    public async Task GetMyNotificationsAsync_returns_paged_results()
    {
        var scenario = await SeedScenarioAsync();
        CurrentUser.As(UserRole.Patient, scenario.PatientUserId);
        var sut = CreateSut();

        await sut.NotifyAsync(scenario.PatientUserId, NotificationType.AppointmentBooked, "A", "One");
        await sut.NotifyAsync(scenario.PatientUserId, NotificationType.AppointmentConfirmed, "B", "Two");

        var all = await sut.GetMyNotificationsAsync(new PaginationParams(), unreadOnly: false);
        var unread = await sut.GetMyNotificationsAsync(new PaginationParams(), unreadOnly: true);

        Assert.Equal(2, all.TotalCount);
        Assert.Equal(2, unread.TotalCount);
    }

    [Fact]
    public async Task GetMyNotificationsAsync_unauthenticated_throws_unauthorized()
    {
        await SeedScenarioAsync();
        var sut = CreateSut();
        await Assert.ThrowsAsync<UnauthorizedException>(() =>
            sut.GetMyNotificationsAsync(new PaginationParams(), unreadOnly: false));
    }

    [Fact]
    public async Task GetUnreadCountAsync_counts_unread_only()
    {
        var scenario = await SeedScenarioAsync();
        CurrentUser.As(UserRole.Patient, scenario.PatientUserId);
        var sut = CreateSut();

        await Uow.Notifications.AddAsync(new Notification
        {
            UserId = scenario.PatientUserId,
            Type = NotificationType.AppointmentBooked,
            Title = "Read",
            Message = "Msg",
            IsRead = true
        });
        await sut.NotifyAsync(scenario.PatientUserId, NotificationType.AppointmentBooked, "Unread", "Msg");
        await Uow.SaveChangesAsync();

        var count = await sut.GetUnreadCountAsync();
        Assert.Equal(1, count);
    }

    [Fact]
    public async Task MarkAsReadAsync_marks_single_notification()
    {
        var scenario = await SeedScenarioAsync();
        CurrentUser.As(UserRole.Patient, scenario.PatientUserId);
        var sut = CreateSut();
        await sut.NotifyAsync(scenario.PatientUserId, NotificationType.AppointmentBooked, "Title", "Message");

        var notification = await Uow.Notifications.Query().FirstAsync();
        await sut.MarkAsReadAsync(notification.Id);

        var updated = await Uow.Notifications.GetByIdAsync(notification.Id);
        Assert.True(updated!.IsRead);
        Assert.NotNull(updated.ReadAtUtc);
    }

    [Fact]
    public async Task MarkAsReadAsync_already_read_is_noop()
    {
        var scenario = await SeedScenarioAsync();
        CurrentUser.As(UserRole.Patient, scenario.PatientUserId);
        var notification = new Notification
        {
            UserId = scenario.PatientUserId,
            Type = NotificationType.AppointmentBooked,
            Title = "Read",
            Message = "Msg",
            IsRead = true,
            ReadAtUtc = DateTime.UtcNow.AddMinutes(-5)
        };
        await Uow.Notifications.AddAsync(notification);
        await Uow.SaveChangesAsync();

        var sut = CreateSut();
        await sut.MarkAsReadAsync(notification.Id);

        var updated = await Uow.Notifications.GetByIdAsync(notification.Id);
        Assert.True(updated!.IsRead);
    }

    [Fact]
    public async Task MarkAsReadAsync_other_users_notification_throws_not_found()
    {
        var scenario = await SeedScenarioAsync();
        CurrentUser.As(UserRole.Patient, scenario.PatientUserId);
        await Uow.Notifications.AddAsync(new Notification
        {
            UserId = scenario.SecondPatientUserId,
            Type = NotificationType.AppointmentBooked,
            Title = "Other",
            Message = "Msg"
        });
        await Uow.SaveChangesAsync();

        var other = await Uow.Notifications.Query().FirstAsync();
        var sut = CreateSut();
        await Assert.ThrowsAsync<NotFoundException>(() => sut.MarkAsReadAsync(other.Id));
    }

    [Fact]
    public async Task MarkAllAsReadAsync_marks_all_unread()
    {
        var scenario = await SeedScenarioAsync();
        CurrentUser.As(UserRole.Patient, scenario.PatientUserId);
        var sut = CreateSut();

        await sut.NotifyAsync(scenario.PatientUserId, NotificationType.AppointmentBooked, "A", "1");
        await sut.NotifyAsync(scenario.PatientUserId, NotificationType.AppointmentBooked, "B", "2");

        await sut.MarkAllAsReadAsync();

        Assert.Equal(0, await sut.GetUnreadCountAsync());
    }
}
