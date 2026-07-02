using System.Security.Claims;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using HAPM.API;
using HAPM.API.Hubs;
using HAPM.API.Middleware;
using HAPM.API.Security;
using HAPM.Application;
using HAPM.Application.Interfaces;
using HAPM.Infrastructure;
using HAPM.Infrastructure.Auth;
using HAPM.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .WriteTo.Console()
    .WriteTo.File("logs/hapm-.txt", rollingInterval: RollingInterval.Day, retainedFileCountLimit: 14)
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog((context, services, configuration) => configuration
        .MinimumLevel.Information()
        .WriteTo.Console()
        .WriteTo.File("logs/hapm-.txt", rollingInterval: RollingInterval.Day, retainedFileCountLimit: 14));

    // Layers
    builder.Services.AddApplication();
    builder.Services.AddInfrastructure(builder.Configuration);
    builder.Services.AddHapmSignalR();

    builder.Services.AddHttpContextAccessor();
    builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();

    builder.Services.AddControllers().AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

    // JWT authentication
    var jwt = builder.Configuration.GetSection(JwtSettings.SectionName).Get<JwtSettings>()
        ?? throw new InvalidOperationException("Missing 'Jwt' configuration section.");

    if (string.IsNullOrWhiteSpace(jwt.Key) || Encoding.UTF8.GetByteCount(jwt.Key) < 32)
        throw new InvalidOperationException("Jwt:Key must be at least 32 bytes for HMAC-SHA256 signing.");

    if (!builder.Environment.IsDevelopment() &&
        jwt.Key.Contains("REPLACE_ME", StringComparison.Ordinal))
    {
        throw new InvalidOperationException(
            "Production requires a secure Jwt:Key. Set the Jwt__Key environment variable (see .env.example).");
    }

    builder.Services
        .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = jwt.Issuer,
                ValidateAudience = true,
                ValidAudience = jwt.Audience,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key)),
                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromSeconds(30)
            };

            options.Events = new JwtBearerEvents
            {
                OnMessageReceived = context =>
                {
                    var path = context.HttpContext.Request.Path;
                    if (!path.StartsWithSegments("/hubs"))
                        return Task.CompletedTask;

                    var authHeader = context.Request.Headers.Authorization.FirstOrDefault();
                    if (!string.IsNullOrEmpty(authHeader) &&
                        authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                    {
                        context.Token = authHeader["Bearer ".Length..].Trim();
                        return Task.CompletedTask;
                    }

                    // WebSocket transports cannot set Authorization headers; fall back to query string.
                    var accessToken = context.Request.Query["access_token"];
                    if (!string.IsNullOrEmpty(accessToken))
                        context.Token = accessToken;

                    return Task.CompletedTask;
                },
                OnTokenValidated = async context =>
                {
                    var userIdClaim = context.Principal?.FindFirstValue(ClaimTypes.NameIdentifier)
                        ?? context.Principal?.FindFirstValue("sub");
                    if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                    {
                        context.Fail("Invalid token subject.");
                        return;
                    }

                    await using var scope = context.HttpContext.RequestServices.CreateAsyncScope();
                    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                    var isActive = await db.Users.AsNoTracking()
                        .AnyAsync(u => u.Id == userId && u.IsActive, context.HttpContext.RequestAborted);
                    if (!isActive)
                        context.Fail("This account has been deactivated.");
                }
            };
        });

    builder.Services.AddAuthorization();

    // Rate limiting: a sane global ceiling per client IP plus a strict policy for
    // credential endpoints (brute-force protection).
    builder.Services.AddRateLimiter(options =>
    {
        options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

        options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
            RateLimitPartition.GetFixedWindowLimiter(
                context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 300,
                    Window = TimeSpan.FromMinutes(1)
                }));

        options.AddPolicy("auth", context =>
            RateLimitPartition.GetFixedWindowLimiter(
                context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 10,
                    Window = TimeSpan.FromMinutes(1)
                }));
    });

    // Health checks for load balancers / orchestrators
    builder.Services.AddHealthChecks()
        .AddDbContextCheck<AppDbContext>("database");

    builder.Services.AddCors(options => options.AddPolicy("Frontend", policy => policy
        .WithOrigins(builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? new[] { "http://localhost:4200" })
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials()));

    // Swagger with JWT support
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(options =>
    {
        options.SwaggerDoc("v1", new OpenApiInfo
        {
            Title = "Hospital Appointment & Patient Management API",
            Version = "v1",
            Description = "Backend API for doctor management, patient registration, appointment booking, prescriptions, lab reports and billing."
        });

        options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            In = ParameterLocation.Header,
            Description = "Paste your JWT access token here."
        });

        options.AddSecurityRequirement(new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
                },
                Array.Empty<string>()
            }
        });

        options.OperationFilter<IdempotencyHeaderOperationFilter>();
    });

    var app = builder.Build();

  // Migrations run when enabled; demo seeding is development-only.
    var applyMigrations = builder.Configuration.GetValue(
        "Database:ApplyMigrationsOnStartup",
        builder.Environment.IsDevelopment());

    using (var scope = app.Services.CreateScope())
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        var isDevelopment = app.Environment.IsDevelopment();
        try
        {
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            if (applyMigrations)
                await context.Database.MigrateAsync();

            if (isDevelopment)
            {
                var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
                await DbSeeder.SeedAsync(context, hasher, logger, isDevelopment: true);
                SeedFileBootstrap.EnsureDemoLabFile(builder.Configuration);
            }
        }
        catch (Exception ex)
        {
            logger.LogCritical(ex, "Database migration/seeding failed. Verify PostgreSQL is running and the connection string is correct.");
            if (!isDevelopment)
                throw;
        }
    }

    app.UseMiddleware<ExceptionHandlingMiddleware>();
    app.UseSerilogRequestLogging();

    if (!app.Environment.IsDevelopment())
        app.UseHttpsRedirection();

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI(options =>
        {
            options.SwaggerEndpoint("/swagger/v1/swagger.json", "HAPM API v1");
            options.DocumentTitle = "HAPM API";
        });
    }

    app.UseCors("Frontend");
    app.UseRateLimiter();
    app.UseAuthentication();
    app.UseAuthorization();
    app.UseMiddleware<IdempotencyMiddleware>();

    app.MapControllers();
    app.MapHapmHubs();
    if (app.Environment.IsDevelopment())
        app.MapGet("/", () => Results.Redirect("/swagger")).ExcludeFromDescription();
    else
        app.MapGet("/", () => Results.Ok(new { name = "HAPM API", health = "/health" })).ExcludeFromDescription();

    // /health verifies database connectivity; /health/live only confirms the process is up.
    app.MapHealthChecks("/health").DisableRateLimiting();
    app.MapHealthChecks("/health/live", new HealthCheckOptions { Predicate = _ => false }).DisableRateLimiting();

    app.Run();
}
catch (Exception ex) when (ex is not HostAbortedException) // thrown by EF design-time tooling
{
    Log.Fatal(ex, "Host terminated unexpectedly.");
}
finally
{
    Log.CloseAndFlush();
}
