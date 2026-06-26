using System.Net;
using System.Net.Mail;
using HAPM.Application.Interfaces;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace HAPM.Infrastructure.Email;

public sealed class SmtpEmailSender : IEmailSender
{
    private readonly EmailSettings _settings;
    private readonly IHostEnvironment _environment;
    private readonly ILogger<SmtpEmailSender> _logger;

    public SmtpEmailSender(
        IOptions<EmailSettings> settings,
        IHostEnvironment environment,
        ILogger<SmtpEmailSender> logger)
    {
        _settings = settings.Value;
        _environment = environment;
        _logger = logger;
    }

    public async Task SendAsync(string to, string subject, string plainTextBody, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_settings.SmtpHost))
        {
            if (_environment.IsDevelopment())
            {
                _logger.LogInformation(
                    "Email not configured (dev). To={To} Subject={Subject}\n{Body}",
                    to, subject, plainTextBody);
                return;
            }

            throw new InvalidOperationException(
                "Email is not configured. Set Email__SmtpHost and related environment variables.");
        }

        using var message = new MailMessage
        {
            From = new MailAddress(_settings.FromAddress, _settings.FromName),
            Subject = subject,
            Body = plainTextBody,
            IsBodyHtml = false,
        };
        message.To.Add(to);

        using var client = new SmtpClient(_settings.SmtpHost, _settings.SmtpPort)
        {
            EnableSsl = _settings.UseSsl,
            Credentials = string.IsNullOrWhiteSpace(_settings.SmtpUser)
                ? CredentialCache.DefaultNetworkCredentials
                : new NetworkCredential(_settings.SmtpUser, _settings.SmtpPassword),
        };

        await client.SendMailAsync(message, ct);
    }
}
