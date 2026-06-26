using HAPM.Application.Interfaces;

namespace HAPM.Application.Tests.Infrastructure.Fakes;

public sealed class FakeEmailSender : IEmailSender
{
    public List<(string To, string Subject, string Body)> Sent { get; } = new();

    public Task SendAsync(string to, string subject, string plainTextBody, CancellationToken ct = default)
    {
        Sent.Add((to, subject, plainTextBody));
        return Task.CompletedTask;
    }
}
