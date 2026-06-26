namespace HAPM.Application.Interfaces;

public interface IEmailSender
{
    Task SendAsync(string to, string subject, string plainTextBody, CancellationToken ct = default);
}
