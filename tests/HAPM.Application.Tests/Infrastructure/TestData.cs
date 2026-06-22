using HAPM.Application.Common;
using HAPM.Application.DTOs;
using HAPM.Domain.Entities;
using HAPM.Domain.Enums;
using HAPM.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HAPM.Application.Tests.Infrastructure;

public sealed class TestScenario
{
    public required int AdminUserId { get; init; }
    public required int ReceptionistUserId { get; init; }
    public required int DoctorUserId { get; init; }
    public required int DoctorId { get; init; }
    public required int PatientUserId { get; init; }
    public required int PatientId { get; init; }
    public required int SecondPatientUserId { get; init; }
    public required int SecondPatientId { get; init; }
    /// <summary>A date guaranteed to be in the future with doctor schedule coverage.</summary>
    public required DateOnly FutureBookingDate { get; init; }
    public required TimeOnly DefaultSlotStart { get; init; }
}

public static class TestData
{
    public const string DefaultPassword = "Test@12345";

    public static async Task<TestScenario> SeedStandardScenarioAsync(UnitOfWork uow, CancellationToken ct = default)
    {
        var admin = new User
        {
            Email = "admin@test.local",
            PasswordHash = $"hash:{DefaultPassword}",
            FullName = "Test Admin",
            PhoneNumber = "+10000000001",
            Role = UserRole.Admin
        };

        var receptionist = new User
        {
            Email = "reception@test.local",
            PasswordHash = $"hash:{DefaultPassword}",
            FullName = "Test Receptionist",
            PhoneNumber = "+10000000002",
            Role = UserRole.Receptionist
        };

        var doctorUser = new User
        {
            Email = "doctor@test.local",
            PasswordHash = $"hash:{DefaultPassword}",
            FullName = "Dr Test Sharma",
            PhoneNumber = "+10000000003",
            Role = UserRole.Doctor
        };

        var doctor = new Doctor
        {
            User = doctorUser,
            Specialization = "Cardiology",
            Qualification = "MBBS, MD",
            LicenseNumber = "LIC-TEST-001",
            ExperienceYears = 10,
            ConsultationFee = 500m,
            RoomNumber = "101",
            IsAvailable = true
        };

        var patientUser = new User
        {
            Email = "patient@test.local",
            PasswordHash = $"hash:{DefaultPassword}",
            FullName = "Test Patient",
            PhoneNumber = "+10000000004",
            Role = UserRole.Patient
        };

        var patient = new Patient
        {
            User = patientUser,
            MedicalRecordNumber = "MRN-TEST-000001",
            DateOfBirth = new DateOnly(1990, 5, 15),
            Gender = Gender.Male,
            BloodGroup = "O+"
        };

        var secondPatientUser = new User
        {
            Email = "patient2@test.local",
            PasswordHash = $"hash:{DefaultPassword}",
            FullName = "Second Patient",
            PhoneNumber = "+10000000005",
            Role = UserRole.Patient
        };

        var secondPatient = new Patient
        {
            User = secondPatientUser,
            MedicalRecordNumber = "MRN-TEST-000002",
            DateOfBirth = new DateOnly(1985, 3, 20),
            Gender = Gender.Female
        };

        await uow.Users.AddAsync(admin, ct);
        await uow.Users.AddAsync(receptionist, ct);
        await uow.Doctors.AddAsync(doctor, ct);
        await uow.Patients.AddAsync(patient, ct);
        await uow.Patients.AddAsync(secondPatient, ct);
        await uow.SaveChangesAsync(ct);

        var futureDate = NextBookableDate(HospitalClock.Today.AddDays(14));
        foreach (DayOfWeek day in Enum.GetValues<DayOfWeek>())
        {
            if (day == DayOfWeek.Sunday)
                continue;

            await uow.DoctorSchedules.AddAsync(new DoctorSchedule
            {
                DoctorId = doctor.Id,
                DayOfWeek = day,
                StartTime = new TimeOnly(9, 0),
                EndTime = new TimeOnly(17, 0),
                SlotDurationMinutes = 30
            }, ct);
        }

        await uow.SaveChangesAsync(ct);

        return new TestScenario
        {
            AdminUserId = admin.Id,
            ReceptionistUserId = receptionist.Id,
            DoctorUserId = doctorUser.Id,
            DoctorId = doctor.Id,
            PatientUserId = patientUser.Id,
            PatientId = patient.Id,
            SecondPatientUserId = secondPatientUser.Id,
            SecondPatientId = secondPatient.Id,
            FutureBookingDate = futureDate,
            DefaultSlotStart = new TimeOnly(10, 0)
        };
    }

    /// <summary>Advances past Sunday because the seeded doctor does not consult on Sundays.</summary>
    private static DateOnly NextBookableDate(DateOnly date)
    {
        while (date.DayOfWeek == DayOfWeek.Sunday)
            date = date.AddDays(1);
        return date;
    }

    public static async Task<Appointment> SeedAppointmentAsync(
        UnitOfWork uow,
        int doctorId,
        int patientId,
        DateOnly date,
        TimeOnly start,
        AppointmentStatus status,
        CancellationToken ct = default)
    {
        var appointment = new Appointment
        {
            DoctorId = doctorId,
            PatientId = patientId,
            AppointmentDate = date,
            StartTime = start,
            EndTime = start.AddMinutes(30),
            Reason = "Test visit",
            Status = status
        };

        await uow.Appointments.AddAsync(appointment, ct);
        await uow.SaveChangesAsync(ct);
        return appointment;
    }

    public static async Task<Invoice> SeedInvoiceAsync(
        UnitOfWork uow,
        int patientId,
        decimal total,
        InvoiceStatus status = InvoiceStatus.Pending,
        int? appointmentId = null,
        CancellationToken ct = default)
    {
        var invoice = new Invoice
        {
            InvoiceNumber = $"INV-TEST-{Guid.NewGuid():N}"[..20],
            PatientId = patientId,
            AppointmentId = appointmentId,
            SubTotal = total,
            TaxPercent = 0,
            TaxAmount = 0,
            DiscountAmount = 0,
            TotalAmount = total,
            Status = status,
            Items =
            {
                new InvoiceItem
                {
                    Description = "Test service",
                    Quantity = 1,
                    UnitPrice = total,
                    Amount = total
                }
            }
        };

        await uow.Invoices.AddAsync(invoice, ct);
        await uow.SaveChangesAsync(ct);
        return invoice;
    }

    public static PrescriptionItemRequest SamplePrescriptionItem() => new()
    {
        MedicineName = "Paracetamol",
        Dosage = "500mg",
        Frequency = "Twice daily",
        DurationDays = 5,
        Instructions = "After meals"
    };

    public static CreateDoctorRequest SampleCreateDoctorRequest(string email) => new()
    {
        Email = email,
        Password = DefaultPassword,
        FullName = "Dr New Test",
        PhoneNumber = "+19998887766",
        Specialization = "Neurology",
        Qualification = "MBBS",
        LicenseNumber = $"LIC-{Guid.NewGuid():N}"[..16],
        ExperienceYears = 5,
        ConsultationFee = 600m,
        RoomNumber = "202"
    };
}
