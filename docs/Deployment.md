# Deployment Guide - HAPM API

> **Manual UI testing:** After the app is running, follow **[Frontend_Flow_Testing.md](Frontend_Flow_Testing.md)** for a click-by-click walkthrough of every screen, role, and action.

## Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [PostgreSQL 13+](https://www.postgresql.org/download/) (15 recommended)
- Git

---

## Local Development Setup

### 1. Clone / open the project

```bash
cd HAPM
```

### 2. Configure PostgreSQL

Create the database (or let any superuser-owned DB name work - migrations create all tables):

```sql
CREATE DATABASE hapm_db;
```

Optionally create a dedicated user:

```sql
CREATE USER hapm_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE hapm_db TO hapm_user;
```

### 3. Update the connection string

Edit `src/HAPM.API/appsettings.json` (or `appsettings.Development.json`):

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=hapm_db;Username=postgres;Password=yourpassword"
  }
}
```

### 4. Restore, build, and restore EF tooling

```bash
dotnet restore HAPM.slnx
dotnet build HAPM.slnx
dotnet tool restore        # installs dotnet-ef 8.0.11 from dotnet-tools.json
```

### 5. Run the API

```bash
dotnet run --project src/HAPM.API --urls http://localhost:5168
cd "frontend/hapm-web" && npm start
```

On startup the app automatically:

1. Applies all EF Core migrations (`InitialCreate`, `AddClinicalAndOpsFeatures`, `AddTemplatesFollowUpAndAnalytics`)
2. Seeds default accounts and doctor schedules (first run only)

Useful locations:

- Swagger UI: `http://localhost:5168/swagger`
- Health check: `http://localhost:5168/health`
- Logs: `src/HAPM.API/logs/hapm-YYYYMMDD.txt`
- Lab report files: `src/HAPM.API/uploads/lab-reports/`

### 6. Verify

```bash
curl http://localhost:5168/health

curl -X POST http://localhost:5168/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hapm.local","password":"Admin@12345"}'
```

Seeded accounts (login at [http://localhost:4200/auth/login](http://localhost:4200/auth/login) in development — use **show password** or the table below):


| Role                 | Email                  | Password          |
| -------------------- | ---------------------- | ----------------- |
| Admin                | `admin@hapm.local`     | `Admin@12345`     |
| Receptionist         | `reception@hapm.local` | `Reception@12345` |
| Doctor (Cardiology)  | `dr.sharma@hapm.local` | `Doctor@12345`    |
| Doctor (Dermatology) | `dr.iyer@hapm.local`   | `Doctor@12345`    |
| Doctor (Orthopedics) | `dr.khan@hapm.local`   | `Doctor@12345`    |
| Patient              | `patient@hapm.local`   | `Patient@12345`   |


### 7. Run the smoke tests (optional)

With the API running on `http://localhost:5168`:

```powershell
./smoke-test.ps1       # core flows: auth, booking, prescriptions, billing, dashboard
./smoke-test-v2.ps1    # vitals, reviews, leave, waitlist, partial payments, exports, audit, rate limiting
./smoke-test-v3.ps1    # prescription templates, follow-up reminders, analytics, doctor performance
./smoke-test-v4.ps1    # doctor self-profile, complete notification, invoice/lab update
```

---

## EF Core Migrations (manual)

Migrations run automatically at startup, but can be managed by hand:

```bash
# add a new migration
dotnet ef migrations add MyMigration \
  --project src/HAPM.Infrastructure --startup-project src/HAPM.API

# apply migrations
dotnet ef database update \
  --project src/HAPM.Infrastructure --startup-project src/HAPM.API

# generate idempotent SQL script (for DBA-managed environments)
dotnet ef migrations script --idempotent -o migrate.sql \
  --project src/HAPM.Infrastructure --startup-project src/HAPM.API
```

---

## Production Deployment

### 1. Publish

```bash
dotnet publish src/HAPM.API -c Release -o ./publish
```

### 2. Environment variables

Set these in the hosting environment (do **not** commit secrets):


| Variable                               | Description                                                   |
| -------------------------------------- | ------------------------------------------------------------- |
| `ConnectionStrings__DefaultConnection` | PostgreSQL connection string                                  |
| `Jwt__Key`                             | Random secret, 64+ characters (HMAC-SHA256 signing key)       |
| `Jwt__Issuer` / `Jwt__Audience`        | Token issuer/audience (defaults: `HAPM.API` / `HAPM.Clients`) |
| `Cors__AllowedOrigins__0`              | Frontend origin, e.g. `https://app.example.com`               |
| `FileStorage__RootPath`                | Upload directory (mount persistent storage)                   |
| `ASPNETCORE_ENVIRONMENT`               | `Production`                                                  |
| `ASPNETCORE_URLS`                      | e.g. `http://0.0.0.0:8080`                                    |


> The seeded `Jwt:Key` in `appsettings.json` is a placeholder - it **must** be replaced in production.

### 3. Run

```bash
cd publish
dotnet HAPM.API.dll
# migrations + seeding run automatically on startup
```

Recommended setup:

- Run behind a reverse proxy (Nginx / IIS / Azure App Service) terminating TLS
- Point a load-balancer health probe at `/health/live`; readiness at `/health` (includes DB)
- Persist the `uploads/` and `logs/` directories outside the publish folder
- Swagger is Development-only by default; the rate limiter (300 req/min global, 10 req/min auth, per IP) is always on
- `UseHttpsRedirection()` is enabled automatically when `ASPNETCORE_ENVIRONMENT` is not `Development` - terminate TLS at your reverse proxy or App Service

### 4. systemd example (Linux)

```ini
[Unit]
Description=HAPM API
After=network.target postgresql.service

[Service]
WorkingDirectory=/opt/hapm
ExecStart=/usr/bin/dotnet HAPM.API.dll
Restart=always
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=ASPNETCORE_URLS=http://0.0.0.0:8080
EnvironmentFile=/etc/hapm/secrets.env

[Install]
WantedBy=multi-user.target
```

---

## Background Jobs & Notifications

- In-app notifications are stored in PostgreSQL and read via `/api/notifications`
- `AppointmentReminderService` (hosted service) runs every 5 minutes and creates:
  - reminders for confirmed appointments starting within 24 hours (deduplicated via `Appointment.ReminderSent`)
  - follow-up reminders for prescriptions whose follow-up date is within 2 days (deduplicated via `Prescription.FollowUpReminderSent`)
- No external broker/scheduler is required - the job lives inside the API process

---

## Azure Migration Path (future)


| Concern            | Today                                  | Azure target                                                            |
| ------------------ | -------------------------------------- | ----------------------------------------------------------------------- |
| File storage       | `LocalFileStorageService` (`uploads/`) | Implement `IFileStorageService` over Blob Storage; swap DI registration |
| Secrets            | appsettings / environment variables    | Azure Key Vault via `AddAzureKeyVault`                                  |
| Push notifications | In-app only (DB rows)                  | Azure Notification Hub invoked from `NotificationService`               |
| Database           | Self-hosted PostgreSQL                 | Azure Database for PostgreSQL (connection string change only)           |


---

## Project Structure

```
HAPM/
├── HAPM.slnx
├── dotnet-tools.json            # pinned dotnet-ef tool
├── src/
│   ├── HAPM.API/                # Web API entry point, controllers, middleware
│   ├── HAPM.Application/        # Services, DTOs, projections, interfaces
│   ├── HAPM.Infrastructure/     # EF Core, migrations, JWT, files, jobs
│   └── HAPM.Domain/             # Entities, enums
├── docs/
│   ├── Requirements_Document.md
│   ├── Architecture_And_Flow.md
│   ├── ER_Diagram.md
│   ├── API_Documentation.md
│   └── Deployment.md
├── smoke-test.ps1
├── smoke-test-v2.ps1
├── smoke-test-v3.ps1
└── smoke-test-v4.ps1
```

