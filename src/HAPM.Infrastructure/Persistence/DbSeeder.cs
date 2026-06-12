using HAPM.Application.Interfaces;
using HAPM.Domain.Entities;
using HAPM.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace HAPM.Infrastructure.Persistence;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext context, IPasswordHasher hasher, ILogger logger)
    {
        await context.Database.MigrateAsync();

        if (await context.Users.AnyAsync())
            return;

        logger.LogInformation("Seeding initial data...");

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

        var weekdays = new[] { DayOfWeek.Monday, DayOfWeek.Tuesday, DayOfWeek.Wednesday, DayOfWeek.Thursday, DayOfWeek.Friday };

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

        logger.LogInformation("Seed data created (admin@hapm.local / Admin@12345).");
    }
}
