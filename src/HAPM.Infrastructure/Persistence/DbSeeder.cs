using HAPM.Application.Common;
using HAPM.Application.Interfaces;
using HAPM.Domain.Entities;
using HAPM.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace HAPM.Infrastructure.Persistence;

public static class DbSeeder
{
    private const int DemoDataAppointmentTarget = 120;

    public static async Task SeedAsync(AppDbContext context, IPasswordHasher hasher, ILogger logger, bool isDevelopment = false)
    {
        await SeedCoreUsersAsync(context, hasher, logger);

        var appointmentCount = await context.Appointments.CountAsync();
        if (appointmentCount < DemoDataAppointmentTarget)
            await SeedDemoDataAsync(context, hasher, logger, appointmentCount);
        else
            logger.LogInformation("Appointment volume at target ({Count}). Skipping volume seed.", appointmentCount);

        await SeedClinicalBackfillAsync(context, logger);

        if (isDevelopment)
            await SeedBackdateTrendDataAsync(context, logger);
    }

    private static async Task SeedCoreUsersAsync(AppDbContext context, IPasswordHasher hasher, ILogger logger)
    {
        if (await context.Users.AnyAsync())
            return;

        logger.LogInformation("Seeding core user accounts...");

        var weekdays = new[] { DayOfWeek.Monday, DayOfWeek.Tuesday, DayOfWeek.Wednesday, DayOfWeek.Thursday, DayOfWeek.Friday };

        var admin = new User
        {
            Email = "admin@hapm.local",
            PasswordHash = hasher.Hash("Admin@12345"),
            FullName = "System Administrator",
            PhoneNumber = "+910000000000",
            Role = UserRole.Admin
        };

        var receptionist = new User
        {
            Email = "reception@hapm.local",
            PasswordHash = hasher.Hash("Reception@12345"),
            FullName = "Front Desk",
            PhoneNumber = "+910000000001",
            Role = UserRole.Receptionist
        };

        var doctor1 = new Doctor
        {
            User = new User
            {
                Email = "dr.sharma@hapm.local",
                PasswordHash = hasher.Hash("Doctor@12345"),
                FullName = "Anil Sharma",
                PhoneNumber = "+910000000002",
                Role = UserRole.Doctor
            },
            Specialization = "Cardiology",
            Qualification = "MBBS, MD (Cardiology)",
            LicenseNumber = "MCI-CARD-1001",
            ExperienceYears = 15,
            ConsultationFee = 1200,
            RoomNumber = "C-101",
            Biography = "Senior consultant cardiologist.",
            Schedules = weekdays.Select(d => new DoctorSchedule
            {
                DayOfWeek = d,
                StartTime = new TimeOnly(9, 0),
                EndTime = new TimeOnly(13, 0),
                SlotDurationMinutes = 30
            }).ToList()
        };

        var doctor2 = new Doctor
        {
            User = new User
            {
                Email = "dr.iyer@hapm.local",
                PasswordHash = hasher.Hash("Doctor@12345"),
                FullName = "Meera Iyer",
                PhoneNumber = "+910000000003",
                Role = UserRole.Doctor
            },
            Specialization = "Dermatology",
            Qualification = "MBBS, MD (Dermatology)",
            LicenseNumber = "MCI-DERM-2002",
            ExperienceYears = 9,
            ConsultationFee = 800,
            RoomNumber = "D-204",
            Biography = "Dermatologist specialising in clinical and cosmetic dermatology.",
            Schedules = weekdays.Select(d => new DoctorSchedule
            {
                DayOfWeek = d,
                StartTime = new TimeOnly(14, 0),
                EndTime = new TimeOnly(18, 0),
                SlotDurationMinutes = 20
            }).ToList()
        };

        var patient = new Patient
        {
            User = new User
            {
                Email = "patient@hapm.local",
                PasswordHash = hasher.Hash("Patient@12345"),
                FullName = "Rahul Verma",
                PhoneNumber = "+910000000004",
                Role = UserRole.Patient
            },
            MedicalRecordNumber = $"MRN-{DateTime.UtcNow.Year}-000001",
            DateOfBirth = new DateOnly(1992, 4, 18),
            Gender = Gender.Male,
            BloodGroup = "O+",
            Address = "42 Lake View Road, Pune"
        };

        context.Users.AddRange(admin, receptionist);
        context.Doctors.AddRange(doctor1, doctor2);
        context.Patients.Add(patient);
        await context.SaveChangesAsync();

        logger.LogInformation("Core accounts created (admin@hapm.local / Admin@12345).");
    }

    private static async Task SeedDemoDataAsync(AppDbContext context, IPasswordHasher hasher, ILogger logger, int existingAppointments)
    {
        logger.LogInformation("Seeding demo clinical & billing dataset (existing appointments: {Count})...", existingAppointments);

        var admin = await context.Users.FirstAsync(u => u.Role == UserRole.Admin);
        var receptionist = await context.Users.FirstAsync(u => u.Role == UserRole.Receptionist);
        var doctors = await context.Doctors.Include(d => d.Schedules).Include(d => d.User).ToListAsync();
        var patients = await context.Patients.Include(p => p.User).ToListAsync();

        if (!doctors.Any(d => d.Specialization == "Orthopedics"))
        {
            var ortho = new Doctor
            {
                User = new User
                {
                    Email = "dr.khan@hapm.local",
                    PasswordHash = hasher.Hash("Doctor@12345"),
                    FullName = "Omar Khan",
                    PhoneNumber = "+910000000010",
                    Role = UserRole.Doctor
                },
                Specialization = "Orthopedics",
                Qualification = "MBBS, MS (Orthopedics)",
                LicenseNumber = "MCI-ORTH-3003",
                ExperienceYears = 12,
                ConsultationFee = 1000,
                RoomNumber = "O-305",
                Biography = "Orthopedic surgeon focused on sports injuries and joint care.",
                Schedules = Enum.GetValues<DayOfWeek>()
                    .Where(d => d is >= DayOfWeek.Monday and <= DayOfWeek.Friday)
                    .Select(d => new DoctorSchedule
                    {
                        DayOfWeek = d,
                        StartTime = new TimeOnly(10, 0),
                        EndTime = new TimeOnly(16, 0),
                        SlotDurationMinutes = 30
                    }).ToList()
            };
            context.Doctors.Add(ortho);
            await context.SaveChangesAsync();
            doctors = await context.Doctors.Include(d => d.Schedules).Include(d => d.User).ToListAsync();
        }

        var extraPatients = new (string Name, string Email, Gender Gender, int Age)[]
        {
            ("Priya Nair", "priya.nair@demo.local", Gender.Female, 34),
            ("Amit Patel", "amit.patel@demo.local", Gender.Male, 45),
            ("Sneha Reddy", "sneha.reddy@demo.local", Gender.Female, 28),
            ("Vikram Singh", "vikram.singh@demo.local", Gender.Male, 52),
            ("Kavita Joshi", "kavita.joshi@demo.local", Gender.Female, 39),
            ("Arjun Mehta", "arjun.mehta@demo.local", Gender.Male, 31),
            ("Deepa Iyer", "deepa.iyer@demo.local", Gender.Female, 41),
            ("Sanjay Gupta", "sanjay.gupta@demo.local", Gender.Male, 58),
            ("Neha Kapoor", "neha.kapoor@demo.local", Gender.Female, 26),
        };

        var mrnSeq = patients.Count + 1;
        foreach (var (name, email, gender, age) in extraPatients)
        {
            if (await context.Users.AnyAsync(u => u.Email == email))
                continue;

            var dob = DateOnly.FromDateTime(DateTime.UtcNow.AddYears(-age));
            patients.Add(new Patient
            {
                User = new User
                {
                    Email = email,
                    PasswordHash = hasher.Hash("Patient@12345"),
                    FullName = name,
                    PhoneNumber = $"+91000000{mrnSeq:D4}",
                    Role = UserRole.Patient,
                    CreatedAtUtc = DateTime.UtcNow.AddDays(-Random.Shared.Next(5, 120))
                },
                MedicalRecordNumber = $"MRN-{DateTime.UtcNow.Year}-{mrnSeq:D6}",
                DateOfBirth = dob,
                Gender = gender,
                BloodGroup = mrnSeq % 2 == 0 ? "A+" : "B+",
                Address = $"{mrnSeq} Demo Street, Pune"
            });
            mrnSeq++;
        }

        if (context.ChangeTracker.HasChanges())
        {
            context.Patients.AddRange(patients.Where(p => p.Id == 0));
            await context.SaveChangesAsync();
        }

        patients = await context.Patients.Include(p => p.User).OrderBy(p => p.Id).ToListAsync();
        doctors = await context.Doctors.Include(d => d.Schedules).Include(d => d.User).OrderBy(d => d.Id).ToListAsync();

        if (patients.Count < 3 || doctors.Count < 1)
        {
            logger.LogWarning("Not enough patients/doctors to seed appointments.");
            return;
        }

        var rand = new Random(42);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var occupied = new HashSet<(int DoctorId, DateOnly Date, TimeOnly Start)>(
            await context.Appointments
                .Select(a => new ValueTuple<int, DateOnly, TimeOnly>(a.DoctorId, a.AppointmentDate, a.StartTime))
                .ToListAsync());
        var appointments = new List<Appointment>();
        var statuses = new[] { AppointmentStatus.Completed, AppointmentStatus.Completed, AppointmentStatus.Confirmed, AppointmentStatus.Pending, AppointmentStatus.Cancelled, AppointmentStatus.NoShow };

        Appointment? MakeAppointment(Doctor doctor, Patient pat, DateOnly date, TimeOnly start, AppointmentStatus status, string reason, DateTime createdAt)
        {
            if (pat.Id == 0) return null;
            var schedule = doctor.Schedules.FirstOrDefault(s => s.DayOfWeek == date.DayOfWeek);
            if (schedule is null) return null;
            var key = (doctor.Id, date, start);
            if (!occupied.Add(key)) return null;
            var end = start.AddMinutes(schedule.SlotDurationMinutes);
            if (end > schedule.EndTime) return null;

            return new Appointment
            {
                DoctorId = doctor.Id,
                PatientId = pat.Id,
                AppointmentDate = date,
                StartTime = start,
                EndTime = end,
                Status = status,
                Reason = reason,
                CreatedAtUtc = createdAt
            };
        }

        var cardDoc = doctors.First(d => d.Specialization == "Cardiology");
        var dermDoc = doctors.FirstOrDefault(d => d.Specialization == "Dermatology") ?? doctors[0];

        if (existingAppointments < 80)
        {
        // Historical appointments (peak hours + revenue trends)
        for (var daysAgo = 90; daysAgo >= 1; daysAgo--)
        {
            var date = today.AddDays(-daysAgo);
            if (date.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday) continue;

            foreach (var doctor in doctors)
            {
                var schedule = doctor.Schedules.FirstOrDefault(s => s.DayOfWeek == date.DayOfWeek);
                if (schedule is null) continue;

                var slotCount = rand.Next(2, 5);
                var slot = schedule.StartTime;
                for (var i = 0; i < slotCount && slot < schedule.EndTime; i++)
                {
                    var patient = patients[rand.Next(patients.Count)];
                    var status = statuses[rand.Next(statuses.Length)];
                    var apt = MakeAppointment(doctor, patient, date, slot, status,
                        status == AppointmentStatus.Completed ? "Follow-up consultation" : "General consultation",
                        date.ToDateTime(slot).ToUniversalTime());
                    if (apt is not null) appointments.Add(apt);
                    slot = slot.AddMinutes(schedule.SlotDurationMinutes);
                }
            }
        }

        // Today's schedule — dashboards & reception queue
        var primaryPatient = patients.FirstOrDefault(p => p.User.Email == "patient@hapm.local") ?? patients[0];

        var todayPlan = new (Doctor Doc, Patient Pat, TimeOnly Time, AppointmentStatus Status, string Reason)[]
        {
            (cardDoc, primaryPatient, new TimeOnly(9, 0), AppointmentStatus.CheckedIn, "Chest discomfort review"),
            (cardDoc, patients[Math.Min(1, patients.Count - 1)], new TimeOnly(9, 30), AppointmentStatus.Confirmed, "ECG follow-up"),
            (cardDoc, patients[Math.Min(2, patients.Count - 1)], new TimeOnly(10, 0), AppointmentStatus.Completed, "Hypertension management"),
            (cardDoc, patients[Math.Min(3, patients.Count - 1)], new TimeOnly(10, 30), AppointmentStatus.Pending, "Routine cardiac screening"),
            (dermDoc, patients[Math.Min(4, patients.Count - 1)], new TimeOnly(14, 0), AppointmentStatus.CheckedIn, "Skin allergy"),
            (dermDoc, patients[Math.Min(5, patients.Count - 1)], new TimeOnly(14, 20), AppointmentStatus.Confirmed, "Acne treatment"),
            (dermDoc, patients[Math.Min(6, patients.Count - 1)], new TimeOnly(14, 40), AppointmentStatus.Completed, "Dermatology consult"),
        };

        foreach (var (doc, pat, time, status, reason) in todayPlan)
        {
            var apt = MakeAppointment(doc, pat, today, time, status, reason, DateTime.UtcNow.AddDays(-2));
            if (apt is not null) appointments.Add(apt);
        }

        // Upcoming appointments
        for (var daysAhead = 1; daysAhead <= 14; daysAhead++)
        {
            var date = today.AddDays(daysAhead);
            if (date.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday) continue;
            var doctor = doctors[daysAhead % doctors.Count];
            var patient = patients[(daysAhead + 2) % patients.Count];
            var schedule = doctor.Schedules.FirstOrDefault(s => s.DayOfWeek == date.DayOfWeek);
            if (schedule is null) continue;
            var apt = MakeAppointment(doctor, patient, date, schedule.StartTime, AppointmentStatus.Confirmed, "Scheduled visit",
                DateTime.UtcNow.AddDays(-daysAhead));
            if (apt is not null) appointments.Add(apt);
        }

        context.Appointments.AddRange(appointments);
        await context.SaveChangesAsync();
        }

        if (!await context.WaitlistEntries.AnyAsync())
        {
            context.WaitlistEntries.AddRange(
                new WaitlistEntry
                {
                    DoctorId = cardDoc.Id,
                    PatientId = patients[Math.Min(7, patients.Count - 1)].Id,
                    PreferredDate = today.AddDays(3),
                    Status = WaitlistStatus.Active,
                    Notes = "Prefer morning slot"
                },
                new WaitlistEntry
                {
                    DoctorId = dermDoc.Id,
                    PatientId = patients[Math.Min(8, patients.Count - 1)].Id,
                    PreferredDate = today.AddDays(5),
                    Status = WaitlistStatus.Active
                });
        }

        if (await context.Notifications.CountAsync() < 8)
        {
            var demoPatientUser = patients.FirstOrDefault(p => p.User.Email == "patient@hapm.local")?.User ?? patients[0].User;
            foreach (var user in new[] { admin, receptionist, cardDoc.User, demoPatientUser })
            {
                context.Notifications.AddRange(
                    new Notification
                    {
                        UserId = user.Id,
                        Type = NotificationType.General,
                        Title = "HAPM demo dataset loaded",
                        Message = "Sample appointments, invoices, and lab reports are available for exploration.",
                        CreatedAtUtc = DateTime.UtcNow.AddHours(-2)
                    },
                    new Notification
                    {
                        UserId = user.Id,
                        Type = NotificationType.AppointmentReminder,
                        Title = "Appointment reminder",
                        Message = "You have visits scheduled today. Review the dashboard for details.",
                        CreatedAtUtc = DateTime.UtcNow.AddHours(-5)
                    });
            }
        }

        if (await context.AuditLogs.CountAsync() < 5)
        {
            context.AuditLogs.AddRange(
                new AuditLog
                {
                    UserId = admin.Id,
                    UserEmail = admin.Email,
                    EntityName = "Appointment",
                    EntityId = "1",
                    Action = AuditAction.Created,
                    ChangesJson = """{"patient":"Rahul Verma","doctor":"Anil Sharma"}""",
                    CreatedAtUtc = DateTime.UtcNow.AddDays(-1)
                },
                new AuditLog
                {
                    UserId = receptionist.Id,
                    UserEmail = receptionist.Email,
                    EntityName = "Invoice",
                    EntityId = "1",
                    Action = AuditAction.Created,
                    ChangesJson = """{"totalAmount":1260.00,"status":"Pending"}""",
                    CreatedAtUtc = DateTime.UtcNow.AddHours(-6)
                },
                new AuditLog
                {
                    UserId = admin.Id,
                    UserEmail = admin.Email,
                    EntityName = "Patient",
                    EntityId = "2",
                    Action = AuditAction.Updated,
                    ChangesJson = """{"address":"Updated during registration"}""",
                    CreatedAtUtc = DateTime.UtcNow.AddHours(-12)
                });
        }

        if (context.ChangeTracker.HasChanges())
            await context.SaveChangesAsync();

        logger.LogInformation("Appointment volume seed complete ({Count} total).", await context.Appointments.CountAsync());
    }

    private static async Task SeedClinicalBackfillAsync(AppDbContext context, ILogger logger)
    {
        var pendingRx = await context.Appointments
            .Where(a => a.Status == AppointmentStatus.Completed)
            .Where(a => !context.Prescriptions.Any(p => p.AppointmentId == a.Id))
            .CountAsync();

        if (pendingRx == 0 && await context.LabReports.CountAsync() >= 25)
        {
            logger.LogInformation("Clinical backfill already satisfied.");
            return;
        }

        logger.LogInformation("Running clinical backfill ({Pending} completed visits without prescriptions)...", pendingRx);

        var receptionist = await context.Users.FirstAsync(u => u.Role == UserRole.Receptionist);
        var rand = new Random(77);

        var completed = await context.Appointments
            .Where(a => a.Status == AppointmentStatus.Completed)
            .Where(a => !context.Prescriptions.Any(p => p.AppointmentId == a.Id))
            .Include(a => a.Doctor).ThenInclude(d => d.User)
            .Include(a => a.Patient).ThenInclude(p => p.User)
            .Take(80)
            .ToListAsync();

        var invoiceSeq = await context.Invoices.CountAsync() + 1;
        var receiptSeq = await context.Payments.CountAsync() + 1;

        foreach (var apt in completed)
        {
            if (await context.Invoices.AnyAsync(i => i.AppointmentId == apt.Id && i.Status != InvoiceStatus.Cancelled))
                continue;

            var items = new List<InvoiceItem>
            {
                new()
                {
                    Description = $"Consultation - Dr. {apt.Doctor.User.FullName} ({apt.Doctor.Specialization})",
                    Quantity = 1,
                    UnitPrice = apt.Doctor.ConsultationFee,
                    Amount = apt.Doctor.ConsultationFee
                }
            };

            if (rand.NextDouble() > 0.4)
            {
                var labFee = 450m + rand.Next(0, 4) * 100m;
                items.Add(new InvoiceItem
                {
                    Description = "Laboratory panel",
                    Quantity = 1,
                    UnitPrice = labFee,
                    Amount = labFee
                });
            }

            var taxPercent = 5m;
            var discount = rand.Next(0, 4) == 0 ? 100m : 0m;
            var (subTotal, taxAmount, total) = InvoiceMath.Calculate(items.Select(i => i.Amount), taxPercent, discount);
            var createdAt = apt.AppointmentDate.ToDateTime(apt.StartTime).ToUniversalTime().AddHours(1);
            if (rand.NextDouble() > 0.35)
                createdAt = createdAt.AddDays(-rand.Next(15, 90));

            var paidRatio = rand.NextDouble();
            InvoiceStatus invStatus;
            decimal amountPaid = 0;
            if (paidRatio > 0.2)
            {
                amountPaid = paidRatio > 0.8 ? total : Math.Round(total * 0.5m, 2);
                invStatus = amountPaid >= total ? InvoiceStatus.Paid : InvoiceStatus.PartiallyPaid;
            }
            else
            {
                invStatus = InvoiceStatus.Pending;
            }

            var invoice = new Invoice
            {
                InvoiceNumber = $"INV-{createdAt.Year}-{invoiceSeq:D6}",
                PatientId = apt.PatientId,
                AppointmentId = apt.Id,
                SubTotal = subTotal,
                TaxPercent = taxPercent,
                TaxAmount = taxAmount,
                DiscountAmount = discount,
                TotalAmount = total,
                Status = invStatus,
                PaidAtUtc = invStatus == InvoiceStatus.Paid ? createdAt.AddDays(1) : null,
                Items = items,
                CreatedAtUtc = createdAt
            };
            invoiceSeq++;

            if (amountPaid > 0)
            {
                var paidAt = createdAt.AddHours(2);
                invoice.Payments.Add(new Payment
                {
                    ReceiptNumber = $"RCP-{paidAt.Year}-{receiptSeq:D6}",
                    Amount = amountPaid,
                    Method = (PaymentMethod)(rand.Next(1, 5)),
                    ReceivedByUserId = receptionist.Id,
                    CreatedAtUtc = paidAt
                });
                receiptSeq++;
            }

            context.Invoices.Add(invoice);

            context.Prescriptions.Add(new Prescription
            {
                AppointmentId = apt.Id,
                DoctorId = apt.DoctorId,
                PatientId = apt.PatientId,
                Diagnosis = apt.Doctor.Specialization switch
                {
                    "Cardiology" => "Stable angina — continue current regimen",
                    "Dermatology" => "Contact dermatitis",
                    "Orthopedics" => "Musculoskeletal strain",
                    _ => "General follow-up"
                },
                Notes = "Follow lifestyle advice and return if symptoms worsen.",
                Items =
                [
                    new PrescriptionItem { MedicineName = "Atorvastatin", Dosage = "10 mg", Frequency = "0-0-1", DurationDays = 30, Instructions = "After dinner" },
                    new PrescriptionItem { MedicineName = "Paracetamol", Dosage = "500 mg", Frequency = "1-1-1", DurationDays = 5, Instructions = "As needed for pain" }
                ],
                CreatedAtUtc = createdAt
            });

            context.VitalSigns.Add(new VitalSign
            {
                AppointmentId = apt.Id,
                PatientId = apt.PatientId,
                RecordedByUserId = receptionist.Id,
                SystolicBpMmHg = 118 + rand.Next(-8, 12),
                DiastolicBpMmHg = 76 + rand.Next(-6, 8),
                PulseBpm = 72 + rand.Next(-10, 15),
                TemperatureCelsius = 36.6m + (decimal)rand.NextDouble() * 0.8m,
                OxygenSaturationPercent = 97 + rand.Next(0, 3),
                HeightCm = 165 + rand.Next(0, 20),
                WeightKg = 60 + rand.Next(0, 25),
                CreatedAtUtc = createdAt.AddMinutes(-15)
            });

            if (invoiceSeq % 2 == 0 && !await context.DoctorReviews.AnyAsync(r => r.AppointmentId == apt.Id))
            {
                context.DoctorReviews.Add(new DoctorReview
                {
                    DoctorId = apt.DoctorId,
                    PatientId = apt.PatientId,
                    AppointmentId = apt.Id,
                    Rating = 3 + rand.Next(0, 3),
                    Comment = rand.NextDouble() > 0.3 ? "Professional and thorough consultation." : null,
                    CreatedAtUtc = createdAt.AddDays(1)
                });
            }
        }

        // Vitals for completed visits that already have prescriptions
        var needsVitals = await context.Appointments
            .Where(a => a.Status == AppointmentStatus.Completed)
            .Where(a => !context.VitalSigns.Any(v => v.AppointmentId == a.Id))
            .Take(40)
            .ToListAsync();

        foreach (var apt in needsVitals)
        {
            var recorded = apt.AppointmentDate.ToDateTime(apt.StartTime).ToUniversalTime();
            context.VitalSigns.Add(new VitalSign
            {
                AppointmentId = apt.Id,
                PatientId = apt.PatientId,
                RecordedByUserId = receptionist.Id,
                SystolicBpMmHg = 120 + rand.Next(-5, 10),
                DiastolicBpMmHg = 78 + rand.Next(-5, 8),
                PulseBpm = 75 + rand.Next(-8, 12),
                TemperatureCelsius = 36.7m,
                OxygenSaturationPercent = 98,
                HeightCm = 170,
                WeightKg = 70,
                CreatedAtUtc = recorded
            });
        }

        // Lab reports — prefer pending-review status for doctor dashboards
        var needsLabs = await context.Appointments
            .Where(a => a.Status == AppointmentStatus.Completed)
            .Where(a => !context.LabReports.Any(l => l.AppointmentId == a.Id))
            .Include(a => a.Patient).ThenInclude(p => p.User)
            .Take(30)
            .ToListAsync();

        foreach (var apt in needsLabs)
        {
            var uploaded = apt.AppointmentDate.ToDateTime(apt.StartTime).ToUniversalTime();
            context.LabReports.Add(new LabReport
            {
                PatientId = apt.PatientId,
                DoctorId = apt.DoctorId,
                AppointmentId = apt.Id,
                ReportType = apt.Id % 2 == 0 ? "Blood Test" : "Imaging",
                Title = $"{apt.Patient.User.FullName} — lab panel #{apt.Id}",
                FileName = "lab-panel.pdf",
                StoredFilePath = "seed/demo-lab.pdf",
                ContentType = "application/pdf",
                FileSizeBytes = 48_000,
                Status = apt.Id % 3 == 0 ? LabReportStatus.Uploaded : LabReportStatus.Reviewed,
                ReviewRemarks = apt.Id % 3 == 0 ? null : "Within normal limits.",
                UploadedByUserId = receptionist.Id,
                CreatedAtUtc = uploaded
            });
        }

        await context.SaveChangesAsync();
        logger.LogInformation("Clinical backfill done: {Rx} prescriptions, {Labs} lab reports total.",
            await context.Prescriptions.CountAsync(), await context.LabReports.CountAsync());
    }

    private static async Task SeedBackdateTrendDataAsync(AppDbContext context, ILogger logger)
    {
        var now = DateTime.UtcNow;
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var lastMonthStart = monthStart.AddMonths(-1);

        var lastMonthRevenue = await context.Payments
            .Where(p => p.CreatedAtUtc >= lastMonthStart && p.CreatedAtUtc < monthStart)
            .SumAsync(p => (decimal?)p.Amount) ?? 0m;

        if (lastMonthRevenue < 500m)
        {
            var toShift = await context.Payments
                .Where(p => p.CreatedAtUtc >= monthStart)
                .OrderBy(p => p.Id)
                .Take(20)
                .ToListAsync();

            var rand = new Random(99);
            foreach (var payment in toShift)
            {
                payment.CreatedAtUtc = lastMonthStart.AddDays(rand.Next(1, 27)).AddHours(rand.Next(9, 18));
            }

            if (toShift.Count > 0)
            {
                await context.SaveChangesAsync();
                logger.LogInformation("Backdated {Count} payments into prior month for revenue trends.", toShift.Count);
            }
        }

        var patientsLastMonth = await context.Patients.CountAsync(p => p.CreatedAtUtc >= lastMonthStart && p.CreatedAtUtc < monthStart);
        if (patientsLastMonth < 3)
        {
            var toShift = await context.Patients
                .Where(p => p.CreatedAtUtc >= monthStart)
                .OrderBy(p => p.Id)
                .Take(8)
                .ToListAsync();

            var rand = new Random(101);
            foreach (var patient in toShift)
                patient.CreatedAtUtc = lastMonthStart.AddDays(rand.Next(1, 25));

            if (toShift.Count > 0)
            {
                await context.SaveChangesAsync();
                logger.LogInformation("Backdated {Count} patient registrations for growth trends.", toShift.Count);
            }
        }
    }
}
