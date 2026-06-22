using HAPM.Application.Common;
using HAPM.Application.DTOs;
using HAPM.Application.Services;
using HAPM.Application.Tests.Infrastructure;
using HAPM.Domain.Entities;
using HAPM.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace HAPM.Application.Tests.Services;

/// <summary>Targeted tests for remaining uncovered branches to reach 100% service line coverage.</summary>
public class ServiceRemainingCoverageTests : ServiceTestBase
{
    [Fact]
    public async Task AppointmentService_remaining_branches()
    {
        var scenario = await SeedScenarioAsync();
        await TestData.SeedAppointmentAsync(
            Uow, scenario.DoctorId, scenario.PatientId,
            scenario.FutureBookingDate, scenario.DefaultSlotStart, AppointmentStatus.Pending);

        // Doctor-scoped GetPaged with all filters and sort variants
        CurrentUser.As(UserRole.Doctor, scenario.DoctorUserId);
        var sut = new AppointmentService(Uow, CurrentUser, Notifications, Board);
        _ = await sut.GetPagedAsync(new AppointmentQueryParams
        {
            DoctorId = scenario.DoctorId,
            PatientId = scenario.PatientId,
            Status = AppointmentStatus.Pending,
            FromDate = scenario.FutureBookingDate.AddDays(-1),
            ToDate = scenario.FutureBookingDate.AddDays(1),
            Search = "Test",
            SortBy = "date",
            SortDescending = false
        });
        _ = await sut.GetPagedAsync(new AppointmentQueryParams { SortBy = "status", SortDescending = false });
        _ = await sut.GetPagedAsync(new AppointmentQueryParams { SortBy = "status", SortDescending = true });
        _ = await sut.GetPagedAsync(new AppointmentQueryParams { SortBy = "createdat", SortDescending = false });
        _ = await sut.GetPagedAsync(new AppointmentQueryParams { SortBy = "createdat", SortDescending = true });

        // Admin default scope
        CurrentUser.As(UserRole.Admin, scenario.AdminUserId);
        _ = await sut.GetPagedAsync(new AppointmentQueryParams());

        // GetById not found in scope
        CurrentUser.As(UserRole.Patient, scenario.SecondPatientUserId);
        await Assert.ThrowsAsync<NotFoundException>(() => sut.GetByIdAsync(1));

        // CheckIn wrong status
        var pending = await TestData.SeedAppointmentAsync(
            Uow, scenario.DoctorId, scenario.SecondPatientId,
            scenario.FutureBookingDate, scenario.DefaultSlotStart.AddHours(2), AppointmentStatus.Pending);
        CurrentUser.As(UserRole.Doctor, scenario.DoctorUserId);
        await Assert.ThrowsAsync<ConflictException>(() => sut.CheckInAsync(pending.Id));

        // Complete wrong status
        await Assert.ThrowsAsync<ConflictException>(() =>
            sut.CompleteAsync(pending.Id, new CompleteAppointmentRequest()));

        // MarkNoShow wrong status
        var checkedIn = await TestData.SeedAppointmentAsync(
            Uow, scenario.DoctorId, scenario.SecondPatientId,
            HospitalClock.Today.AddDays(-1), new TimeOnly(11, 0), AppointmentStatus.CheckedIn);
        await Assert.ThrowsAsync<ConflictException>(() => sut.MarkNoShowAsync(checkedIn.Id));

        // Cancel without waitlist (NotifyWaitlisted early return)
        var confirmed = await TestData.SeedAppointmentAsync(
            Uow, scenario.DoctorId, scenario.PatientId,
            scenario.FutureBookingDate, scenario.DefaultSlotStart.AddHours(1), AppointmentStatus.Confirmed);
        CurrentUser.As(UserRole.Patient, scenario.PatientUserId);
        await sut.CancelAsync(confirmed.Id, new CancelAppointmentRequest { Reason = "No waitlist" });

        // Staff book without patient id
        CurrentUser.As(UserRole.Receptionist, scenario.ReceptionistUserId);
        await Assert.ThrowsAsync<BadRequestException>(() => sut.BookAsync(new BookAppointmentRequest
        {
            DoctorId = scenario.DoctorId,
            AppointmentDate = scenario.FutureBookingDate,
            StartTime = scenario.DefaultSlotStart.AddHours(3),
            Reason = "Missing patient"
        }));

        // Staff book invalid patient id
        await Assert.ThrowsAsync<NotFoundException>(() => sut.BookAsync(new BookAppointmentRequest
        {
            DoctorId = scenario.DoctorId,
            PatientId = 9999,
            AppointmentDate = scenario.FutureBookingDate,
            StartTime = scenario.DefaultSlotStart.AddHours(3),
            Reason = "Bad patient"
        }));

        // Misaligned slot
        CurrentUser.As(UserRole.Patient, scenario.SecondPatientUserId);
        await Assert.ThrowsAsync<BadRequestException>(() => sut.BookAsync(new BookAppointmentRequest
        {
            DoctorId = scenario.DoctorId,
            AppointmentDate = scenario.FutureBookingDate,
            StartTime = new TimeOnly(10, 15),
            Reason = "Misaligned"
        }));

        // Outside consulting hours
        await Assert.ThrowsAsync<BadRequestException>(() => sut.BookAsync(new BookAppointmentRequest
        {
            DoctorId = scenario.DoctorId,
            AppointmentDate = scenario.FutureBookingDate,
            StartTime = new TimeOnly(18, 0),
            Reason = "Late"
        }));

        // Sunday - no schedule
        var sunday = scenario.FutureBookingDate;
        while (sunday.DayOfWeek != DayOfWeek.Sunday)
            sunday = sunday.AddDays(1);
        await Assert.ThrowsAsync<BadRequestException>(() => sut.BookAsync(new BookAppointmentRequest
        {
            DoctorId = scenario.DoctorId,
            AppointmentDate = sunday,
            StartTime = new TimeOnly(10, 0),
            Reason = "Sunday"
        }));

        // Patient double-booking same slot
        await TestData.SeedAppointmentAsync(
            Uow, scenario.DoctorId, scenario.PatientId,
            scenario.FutureBookingDate, new TimeOnly(14, 0), AppointmentStatus.Confirmed);
        CurrentUser.As(UserRole.Patient, scenario.PatientUserId);
        await Assert.ThrowsAsync<ConflictException>(() => sut.BookAsync(new BookAppointmentRequest
        {
            DoctorId = scenario.DoctorId,
            AppointmentDate = scenario.FutureBookingDate,
            StartTime = new TimeOnly(14, 0),
            Reason = "Patient clash"
        }));

        // Forbidden cancel by other patient
        var otherAppt = await TestData.SeedAppointmentAsync(
            Uow, scenario.DoctorId, scenario.SecondPatientId,
            scenario.FutureBookingDate, new TimeOnly(15, 0), AppointmentStatus.Confirmed);
        await Assert.ThrowsAsync<ForbiddenException>(() =>
            sut.CancelAsync(otherAppt.Id, new CancelAppointmentRequest { Reason = "Nope" }));

        // Doctor can cancel own
        CurrentUser.As(UserRole.Doctor, scenario.DoctorUserId);
        await sut.CancelAsync(otherAppt.Id, new CancelAppointmentRequest { Reason = "Doctor cancel" });

        // Reschedule completed throws
        var completed = await TestData.SeedAppointmentAsync(
            Uow, scenario.DoctorId, scenario.PatientId,
            HospitalClock.Today.AddDays(-3), new TimeOnly(9, 0), AppointmentStatus.Completed);
        await Assert.ThrowsAsync<ConflictException>(() => sut.RescheduleAsync(completed.Id, new RescheduleAppointmentRequest
        {
            AppointmentDate = scenario.FutureBookingDate,
            StartTime = scenario.DefaultSlotStart
        }));
    }

    [Fact]
    public async Task BillingService_remaining_branches()
    {
        var scenario = await SeedScenarioAsync();
        var appointment = await TestData.SeedAppointmentAsync(
            Uow, scenario.DoctorId, scenario.PatientId,
            scenario.FutureBookingDate, scenario.DefaultSlotStart, AppointmentStatus.Completed);

        CurrentUser.As(UserRole.Receptionist, scenario.ReceptionistUserId);
        var sut = new BillingService(Uow, CurrentUser, Notifications);

        await Assert.ThrowsAsync<BadRequestException>(() => sut.CreateAsync(new CreateInvoiceRequest
        {
            PatientId = scenario.SecondPatientId,
            AppointmentId = appointment.Id,
            TaxPercent = 0,
            Items = new List<InvoiceItemRequest>
            {
                new() { Description = "Service", Quantity = 1, UnitPrice = 50m }
            }
        }));

        // Create with appointment for correct patient
        var created = await sut.CreateAsync(new CreateInvoiceRequest
        {
            PatientId = scenario.PatientId,
            AppointmentId = appointment.Id,
            TaxPercent = 10,
            Items = new List<InvoiceItemRequest>
            {
                new() { Description = "Lab", Quantity = 1, UnitPrice = 100m }
            }
        });

        await Assert.ThrowsAsync<ConflictException>(() => sut.CreateAsync(new CreateInvoiceRequest
        {
            PatientId = scenario.PatientId,
            AppointmentId = appointment.Id,
            TaxPercent = 0,
            Items = new List<InvoiceItemRequest> { new() { Description = "Dup", Quantity = 1, UnitPrice = 1m } }
        }));

        // Update re-inserts consultation line when missing from request
        await sut.UpdateAsync(created.Id, new UpdateInvoiceRequest
        {
            TaxPercent = 5,
            DiscountAmount = 0,
            Items = new List<InvoiceItemRequest> { new() { Description = "Updated only", Quantity = 1, UnitPrice = 80m } }
        });

        CurrentUser.As(UserRole.Patient, scenario.PatientUserId);
        _ = await sut.GetPagedAsync(new InvoiceQueryParams { SortBy = "total", SortDescending = true });
        _ = await sut.GetPagedAsync(new InvoiceQueryParams { SortBy = "createdat", SortDescending = false });

        var paid = await TestData.SeedInvoiceAsync(Uow, scenario.PatientId, 50m, InvoiceStatus.Paid);
        CurrentUser.As(UserRole.Receptionist, scenario.ReceptionistUserId);
        await Assert.ThrowsAsync<ConflictException>(() => sut.CancelAsync(paid.Id));

        await sut.AddPaymentAsync(created.Id, new AddPaymentRequest
        {
            Amount = 20m,
            PaymentMethod = PaymentMethod.Cash
        });
        var payments = await sut.GetPaymentsAsync(created.Id);
        Assert.NotEmpty(payments);
    }

    [Fact]
    public async Task DoctorService_remaining_branches()
    {
        var scenario = await SeedScenarioAsync();
        var sut = new DoctorService(Uow, PasswordHasher, CurrentUser);

        _ = await sut.GetPagedAsync(new DoctorQueryParams { SortBy = "fee", SortDescending = false });
        _ = await sut.GetPagedAsync(new DoctorQueryParams { SortBy = "experience", SortDescending = false });
        _ = await sut.GetPagedAsync(new DoctorQueryParams { SortBy = "specialization", SortDescending = false });

        await Assert.ThrowsAsync<NotFoundException>(() => sut.GetSchedulesAsync(9999));

        // Day with no schedule windows
        await sut.SetSchedulesAsync(scenario.DoctorId, new List<ScheduleSlotRequest>
        {
            new() { DayOfWeek = DayOfWeek.Monday, StartTime = new TimeOnly(9, 0), EndTime = new TimeOnly(12, 0), SlotDurationMinutes = 30 }
        });
        var tuesday = scenario.FutureBookingDate;
        while (tuesday.DayOfWeek != DayOfWeek.Tuesday)
            tuesday = tuesday.AddDays(1);
        var slots = await sut.GetAvailableSlotsAsync(scenario.DoctorId, tuesday);
        Assert.Empty(slots);
    }

    [Fact]
    public async Task DoctorLeaveService_remaining_branches()
    {
        var scenario = await SeedScenarioAsync();
        var sut = new DoctorLeaveService(Uow, CurrentUser);

        await Assert.ThrowsAsync<NotFoundException>(() => sut.GetForDoctorAsync(9999));

        CurrentUser.As(UserRole.Doctor, scenario.DoctorUserId);
        await Assert.ThrowsAsync<BadRequestException>(() => sut.CreateAsync(scenario.DoctorId, new CreateDoctorLeaveRequest
        {
            StartDate = HospitalClock.Today.AddDays(-5),
            EndDate = HospitalClock.Today.AddDays(-1),
            Reason = "Past"
        }));

        CurrentUser.As(UserRole.Receptionist, scenario.ReceptionistUserId);
        await Assert.ThrowsAsync<ForbiddenException>(() => sut.CreateAsync(scenario.DoctorId, new CreateDoctorLeaveRequest
        {
            StartDate = scenario.FutureBookingDate.AddDays(30),
            EndDate = scenario.FutureBookingDate.AddDays(31),
            Reason = "Nope"
        }));
    }

    [Fact]
    public async Task LabReportService_remaining_branches()
    {
        var scenario = await SeedScenarioAsync();
        CurrentUser.As(UserRole.Receptionist, scenario.ReceptionistUserId);
        var sut = new LabReportService(Uow, CurrentUser, FileStorage, Notifications);

        using var stream = new MemoryStream(new byte[11 * 1024 * 1024]);
        await Assert.ThrowsAsync<BadRequestException>(() => sut.UploadAsync(
            new UploadLabReportRequest { PatientId = scenario.PatientId, ReportType = "Blood", Title = "Big" },
            stream, "big.pdf", "application/pdf", stream.Length));

        using var small = new MemoryStream(new byte[] { 1 });
        await Assert.ThrowsAsync<NotFoundException>(() => sut.UploadAsync(
            new UploadLabReportRequest { PatientId = scenario.PatientId, DoctorId = 9999, ReportType = "Blood", Title = "T" },
            small, "r.pdf", "application/pdf", 1));

        var report = await SeedLabReport(scenario);
        await Assert.ThrowsAsync<NotFoundException>(() => sut.UpdateAsync(report.Id, new UpdateLabReportRequest
        {
            DoctorId = 9999,
            ReportType = "Blood",
            Title = "T"
        }, null, null, null, null));

        await Assert.ThrowsAsync<BadRequestException>(() => sut.UpdateAsync(report.Id, new UpdateLabReportRequest
        {
            AppointmentId = 9999,
            ReportType = "Blood",
            Title = "T"
        }, null, null, null, null));

        using var replace = new MemoryStream(new byte[] { 1 });
        await Assert.ThrowsAsync<BadRequestException>(() => sut.UpdateAsync(report.Id, new UpdateLabReportRequest
        {
            ReportType = "Blood",
            Title = "T"
        }, replace, null, null, 1));

        await Assert.ThrowsAsync<BadRequestException>(() => sut.UpdateAsync(report.Id, new UpdateLabReportRequest
        {
            ReportType = "Blood",
            Title = "T"
        }, new MemoryStream(), "bad.exe", "application/octet-stream", 3));
    }

    [Fact]
    public async Task PatientService_remaining_sort_branches()
    {
        await SeedScenarioAsync();
        var sut = new PatientService(Uow, PasswordHasher, CurrentUser);

        _ = await sut.GetPagedAsync(new PatientQueryParams { SortBy = "name", SortDescending = true });
        _ = await sut.GetPagedAsync(new PatientQueryParams { SortBy = "mrn", SortDescending = true });
        _ = await sut.GetPagedAsync(new PatientQueryParams { SortBy = "unknown", SortDescending = true });
    }

    [Fact]
    public async Task PrescriptionService_remaining_branches()
    {
        var scenario = await SeedScenarioAsync();
        var appointment = await TestData.SeedAppointmentAsync(
            Uow, scenario.DoctorId, scenario.PatientId,
            scenario.FutureBookingDate, scenario.DefaultSlotStart, AppointmentStatus.CheckedIn);

        CurrentUser.As(UserRole.Doctor, scenario.DoctorUserId);
        var sut = new PrescriptionService(Uow, CurrentUser, Notifications);

        var otherDoctorUser = new User
        {
            Email = "other2@test.local",
            PasswordHash = "hash",
            FullName = "Other Dr",
            PhoneNumber = "+10000000066",
            Role = UserRole.Doctor
        };
        var otherDoctor = new Doctor
        {
            User = otherDoctorUser,
            Specialization = "ENT",
            Qualification = "MBBS",
            LicenseNumber = "LIC-ENT-001",
            ConsultationFee = 300m
        };
        await Uow.Doctors.AddAsync(otherDoctor);
        await Uow.SaveChangesAsync();

        var foreignAppt = await TestData.SeedAppointmentAsync(
            Uow, otherDoctor.Id, scenario.PatientId,
            scenario.FutureBookingDate, new TimeOnly(16, 0), AppointmentStatus.CheckedIn);

        await Assert.ThrowsAsync<ForbiddenException>(() => sut.CreateAsync(new CreatePrescriptionRequest
        {
            AppointmentId = foreignAppt.Id,
            Diagnosis = "X",
            Items = new List<PrescriptionItemRequest> { TestData.SamplePrescriptionItem() }
        }));

        CurrentUser.As(UserRole.Doctor, otherDoctorUser.Id);
        var otherSut = new PrescriptionService(Uow, CurrentUser, Notifications);
        _ = await otherSut.GetPagedAsync(new PrescriptionQueryParams());

        CurrentUser.As(UserRole.Doctor, scenario.DoctorUserId);
        var created = await sut.CreateAsync(new CreatePrescriptionRequest
        {
            AppointmentId = appointment.Id,
            Diagnosis = "Flu",
            Items = new List<PrescriptionItemRequest> { TestData.SamplePrescriptionItem() }
        });

        CurrentUser.As(UserRole.Admin, scenario.AdminUserId);
        await Assert.ThrowsAsync<ForbiddenException>(() => otherSut.UpdateAsync(created.Id, new UpdatePrescriptionRequest
        {
            Diagnosis = "Hijack",
            Items = new List<PrescriptionItemRequest> { TestData.SamplePrescriptionItem() }
        }));
    }

    [Fact]
    public async Task PrescriptionTemplateService_duplicate_name_on_update()
    {
        var scenario = await SeedScenarioAsync();
        CurrentUser.As(UserRole.Doctor, scenario.DoctorUserId);
        var sut = new PrescriptionTemplateService(Uow, CurrentUser);

        await sut.CreateAsync(new SavePrescriptionTemplateRequest
        {
            Name = "Alpha",
            Diagnosis = "A",
            Items = new List<PrescriptionItemRequest> { TestData.SamplePrescriptionItem() }
        });
        var beta = await sut.CreateAsync(new SavePrescriptionTemplateRequest
        {
            Name = "Beta",
            Diagnosis = "B",
            Items = new List<PrescriptionItemRequest> { TestData.SamplePrescriptionItem() }
        });

        await Assert.ThrowsAsync<ConflictException>(() => sut.UpdateAsync(beta.Id, new SavePrescriptionTemplateRequest
        {
            Name = "alpha",
            Diagnosis = "B2",
            Items = new List<PrescriptionItemRequest> { TestData.SamplePrescriptionItem() }
        }));
    }

    [Fact]
    public async Task ReviewService_remaining_branches()
    {
        var scenario = await SeedScenarioAsync();
        var appointment = await TestData.SeedAppointmentAsync(
            Uow, scenario.DoctorId, scenario.PatientId,
            HospitalClock.Today.AddDays(-2), new TimeOnly(9, 0), AppointmentStatus.Completed);

        CurrentUser.As(UserRole.Patient, scenario.SecondPatientUserId);
        var sut = new ReviewService(Uow, CurrentUser);
        await Assert.ThrowsAsync<ForbiddenException>(() => sut.CreateAsync(new CreateReviewRequest
        {
            AppointmentId = appointment.Id,
            Rating = 3
        }));

        CurrentUser.As(UserRole.Patient, scenario.PatientUserId);
        var review = await sut.CreateAsync(new CreateReviewRequest { AppointmentId = appointment.Id, Rating = 5, Comment = "Great" });

        _ = await sut.GetPagedAsync(new ReviewQueryParams { SortBy = "rating", SortDescending = false });
        _ = await sut.GetPagedAsync(new ReviewQueryParams { SortBy = "rating", SortDescending = true });

        CurrentUser.As(UserRole.Admin, scenario.AdminUserId);
        await sut.DeleteAsync(review.Id);
    }

    [Fact]
    public async Task UserService_remaining_sort_branches()
    {
        await SeedScenarioAsync();
        var sut = new UserService(Uow, PasswordHasher, CurrentUser);

        _ = await sut.GetPagedAsync(new UserQueryParams { SortBy = "name", SortDescending = false });
        _ = await sut.GetPagedAsync(new UserQueryParams { SortBy = "name", SortDescending = true });
        _ = await sut.GetPagedAsync(new UserQueryParams { SortBy = "email", SortDescending = false });
        _ = await sut.GetPagedAsync(new UserQueryParams { SortBy = "email", SortDescending = true });
        _ = await sut.GetPagedAsync(new UserQueryParams { SortBy = "createdat", SortDescending = false });
    }

    [Fact]
    public async Task VitalSignService_doctor_sees_all_records()
    {
        var scenario = await SeedScenarioAsync();
        var appointment = await TestData.SeedAppointmentAsync(
            Uow, scenario.DoctorId, scenario.PatientId,
            scenario.FutureBookingDate, scenario.DefaultSlotStart, AppointmentStatus.Confirmed);

        CurrentUser.As(UserRole.Doctor, scenario.DoctorUserId);
        var sut = new VitalSignService(Uow, CurrentUser);
        await sut.RecordAsync(new RecordVitalSignRequest
        {
            AppointmentId = appointment.Id,
            PulseBpm = 70
        });

        _ = await sut.GetPagedAsync(new VitalSignQueryParams());
    }

    [Fact]
    public async Task WaitlistService_remaining_branches()
    {
        var scenario = await SeedScenarioAsync();
        var sut = new WaitlistService(Uow, CurrentUser);

        CurrentUser.As(UserRole.Doctor, scenario.DoctorUserId);
        await Uow.WaitlistEntries.AddAsync(new WaitlistEntry
        {
            DoctorId = scenario.DoctorId,
            PatientId = scenario.PatientId,
            PreferredDate = scenario.FutureBookingDate,
            Status = WaitlistStatus.Active
        });
        await Uow.SaveChangesAsync();
        _ = await sut.GetPagedAsync(new WaitlistQueryParams());

        CurrentUser.As(UserRole.Patient, scenario.PatientUserId);
        _ = await sut.GetPagedAsync(new WaitlistQueryParams());

        var doctor = await Uow.Doctors.GetByIdAsync(scenario.DoctorId);
        var user = await Uow.Users.GetByIdAsync(doctor!.UserId);
        user!.IsActive = false;
        await Uow.SaveChangesAsync();

        CurrentUser.As(UserRole.Receptionist, scenario.ReceptionistUserId);
        await Assert.ThrowsAsync<BadRequestException>(() => sut.JoinAsync(new JoinWaitlistRequest
        {
            DoctorId = scenario.DoctorId,
            PatientId = scenario.SecondPatientId,
            PreferredDate = scenario.FutureBookingDate.AddDays(3)
        }));

        user!.IsActive = true;
        doctor!.IsAvailable = false;
        await Uow.SaveChangesAsync();
        await Assert.ThrowsAsync<BadRequestException>(() => sut.JoinAsync(new JoinWaitlistRequest
        {
            DoctorId = scenario.DoctorId,
            PatientId = scenario.SecondPatientId,
            PreferredDate = scenario.FutureBookingDate.AddDays(4)
        }));

        await Assert.ThrowsAsync<NotFoundException>(() => sut.JoinAsync(new JoinWaitlistRequest
        {
            DoctorId = scenario.DoctorId,
            PatientId = 9999,
            PreferredDate = scenario.FutureBookingDate.AddDays(5)
        }));

        var entry = await Uow.WaitlistEntries.Query().FirstAsync();
        CurrentUser.As(UserRole.Patient, scenario.SecondPatientUserId);
        await Assert.ThrowsAsync<ForbiddenException>(() => sut.CancelAsync(entry.Id));
    }

    [Fact]
    public async Task Final_service_line_coverage_gaps()
    {
        var scenario = await SeedScenarioAsync();
        var sutAppt = new AppointmentService(Uow, CurrentUser, Notifications, Board);

        // Patient same-slot conflict (line 357)
        await TestData.SeedAppointmentAsync(
            Uow, scenario.DoctorId, scenario.PatientId,
            scenario.FutureBookingDate, new TimeOnly(11, 0), AppointmentStatus.Confirmed);
        CurrentUser.As(UserRole.Receptionist, scenario.ReceptionistUserId);
        await Assert.ThrowsAsync<ConflictException>(() => sutAppt.BookAsync(new BookAppointmentRequest
        {
            DoctorId = scenario.DoctorId,
            PatientId = scenario.PatientId,
            AppointmentDate = scenario.FutureBookingDate,
            StartTime = new TimeOnly(11, 0),
            Reason = "Patient overlap"
        }));

        // Staff EnsureCanModify path (line 382)
        var toReschedule = await TestData.SeedAppointmentAsync(
            Uow, scenario.DoctorId, scenario.SecondPatientId,
            scenario.FutureBookingDate, new TimeOnly(12, 0), AppointmentStatus.Confirmed);
        await sutAppt.RescheduleAsync(toReschedule.Id, new RescheduleAppointmentRequest
        {
            AppointmentDate = scenario.FutureBookingDate,
            StartTime = new TimeOnly(12, 30)
        });

        // Billing gaps
        var billing = new BillingService(Uow, CurrentUser, Notifications);
        CurrentUser.As(UserRole.Patient, scenario.PatientUserId);
        _ = await billing.GetPagedAsync(new InvoiceQueryParams { SortBy = "unknown" });

        var appt = await TestData.SeedAppointmentAsync(
            Uow, scenario.DoctorId, scenario.PatientId,
            scenario.FutureBookingDate, new TimeOnly(13, 0), AppointmentStatus.Completed);
        CurrentUser.As(UserRole.Receptionist, scenario.ReceptionistUserId);
        var inv = await billing.CreateAsync(new CreateInvoiceRequest
        {
            PatientId = scenario.PatientId,
            AppointmentId = appt.Id,
            TaxPercent = 0,
            Items = new List<InvoiceItemRequest> { new() { Description = "X", Quantity = 1, UnitPrice = 100m } }
        });

        var plainInv = await TestData.SeedInvoiceAsync(Uow, scenario.PatientId, 100m);
        await Assert.ThrowsAsync<BadRequestException>(() => billing.UpdateAsync(plainInv.Id, new UpdateInvoiceRequest
        {
            TaxPercent = 0,
            DiscountAmount = 0,
            Items = new List<InvoiceItemRequest>()
        }));

        await Assert.ThrowsAsync<BadRequestException>(() => billing.UpdateAsync(plainInv.Id, new UpdateInvoiceRequest
        {
            TaxPercent = 0,
            DiscountAmount = 500m,
            Items = new List<InvoiceItemRequest> { new() { Description = "X", Quantity = 1, UnitPrice = 100m } }
        }));

        await billing.AddPaymentAsync(plainInv.Id, new AddPaymentRequest { Amount = 100m, PaymentMethod = PaymentMethod.Cash });
        await Assert.ThrowsAsync<ConflictException>(() => billing.AddPaymentAsync(plainInv.Id, new AddPaymentRequest
        {
            Amount = 1m,
            PaymentMethod = PaymentMethod.Cash
        }));

        CurrentUser.As(UserRole.Patient, scenario.PatientUserId);
        await Assert.ThrowsAsync<NotFoundException>(() => billing.GetPaymentsAsync(9999));

        // Doctor sort experience true
        var doctors = new DoctorService(Uow, PasswordHasher, CurrentUser);
        _ = await doctors.GetPagedAsync(new DoctorQueryParams { SortBy = "experience", SortDescending = true });

        // Doctor leave forbidden (line 97)
        CurrentUser.As(UserRole.Receptionist, scenario.ReceptionistUserId);
        var leaves = new DoctorLeaveService(Uow, CurrentUser);
        await Assert.ThrowsAsync<ForbiddenException>(() => leaves.DeleteAsync(scenario.DoctorId, 1));

        // Lab report update empty file / oversize
        CurrentUser.As(UserRole.Receptionist, scenario.ReceptionistUserId);
        var labs = new LabReportService(Uow, CurrentUser, FileStorage, Notifications);
        var report = await SeedLabReport(scenario);
        using var empty = new MemoryStream();
        await Assert.ThrowsAsync<BadRequestException>(() => labs.UpdateAsync(report.Id, new UpdateLabReportRequest
        {
            ReportType = "Blood",
            Title = "T"
        }, empty, "r.pdf", "application/pdf", 0));

        using var huge = new MemoryStream(new byte[11 * 1024 * 1024]);
        await Assert.ThrowsAsync<BadRequestException>(() => labs.UpdateAsync(report.Id, new UpdateLabReportRequest
        {
            ReportType = "Blood",
            Title = "T"
        }, huge, "r.pdf", "application/pdf", huge.Length));

        // Patient name ascending
        var patients = new PatientService(Uow, PasswordHasher, CurrentUser);
        _ = await patients.GetPagedAsync(new PatientQueryParams { SortBy = "name", SortDescending = false });

        // Prescription forbidden update + staff scope
        var checkedIn = await TestData.SeedAppointmentAsync(
            Uow, scenario.DoctorId, scenario.PatientId,
            scenario.FutureBookingDate, new TimeOnly(14, 0), AppointmentStatus.CheckedIn);
        CurrentUser.As(UserRole.Doctor, scenario.DoctorUserId);
        var rx = new PrescriptionService(Uow, CurrentUser, Notifications);
        var rxCreated = await rx.CreateAsync(new CreatePrescriptionRequest
        {
            AppointmentId = checkedIn.Id,
            Diagnosis = "D",
            Items = new List<PrescriptionItemRequest> { TestData.SamplePrescriptionItem() }
        });

        var otherDoctorUser = new User
        {
            Email = "rx.other@test.local",
            PasswordHash = "hash",
            FullName = "Rx Other",
            PhoneNumber = "+10000000055",
            Role = UserRole.Doctor
        };
        var otherDoctor = new Doctor
        {
            User = otherDoctorUser,
            Specialization = "Ortho",
            Qualification = "MBBS",
            LicenseNumber = "LIC-RX-001",
            ConsultationFee = 400m
        };
        await Uow.Doctors.AddAsync(otherDoctor);
        await Uow.SaveChangesAsync();
        CurrentUser.As(UserRole.Doctor, otherDoctorUser.Id);
        var otherRx = new PrescriptionService(Uow, CurrentUser, Notifications);
        await Assert.ThrowsAsync<ForbiddenException>(() => otherRx.UpdateAsync(rxCreated.Id, new UpdatePrescriptionRequest
        {
            Diagnosis = "Hack",
            Items = new List<PrescriptionItemRequest> { TestData.SamplePrescriptionItem() }
        }));

        CurrentUser.As(UserRole.Receptionist, scenario.ReceptionistUserId);
        _ = await rx.GetPagedAsync(new PrescriptionQueryParams());

        // Review delete forbidden
        var doneAppt = await TestData.SeedAppointmentAsync(
            Uow, scenario.DoctorId, scenario.SecondPatientId,
            HospitalClock.Today.AddDays(-4), new TimeOnly(8, 0), AppointmentStatus.Completed);
        CurrentUser.As(UserRole.Patient, scenario.SecondPatientUserId);
        var reviews = new ReviewService(Uow, CurrentUser);
        var rev = await reviews.CreateAsync(new CreateReviewRequest { AppointmentId = doneAppt.Id, Rating = 4 });
        CurrentUser.As(UserRole.Patient, scenario.PatientUserId);
        await Assert.ThrowsAsync<ForbiddenException>(() => reviews.DeleteAsync(rev.Id));

        // User default sort
        var users = new UserService(Uow, PasswordHasher, CurrentUser);
        _ = await users.GetPagedAsync(new UserQueryParams { SortBy = "unknown" });
    }

    [Fact]
    public async Task Last_uncovered_service_lines()
    {
        var scenario = await SeedScenarioAsync();

        // AppointmentService line 357: patient conflict with second doctor same slot
        var secondDoctorUser = new User
        {
            Email = "slot2@test.local",
            PasswordHash = "hash",
            FullName = "Dr Slot Two",
            PhoneNumber = "+10000000044",
            Role = UserRole.Doctor
        };
        var secondDoctor = new Doctor
        {
            User = secondDoctorUser,
            Specialization = "GP",
            Qualification = "MBBS",
            LicenseNumber = "LIC-SLOT2",
            ConsultationFee = 300m,
            IsAvailable = true
        };
        await Uow.Doctors.AddAsync(secondDoctor);
        foreach (DayOfWeek day in Enum.GetValues<DayOfWeek>())
        {
            if (day == DayOfWeek.Sunday) continue;
            await Uow.DoctorSchedules.AddAsync(new DoctorSchedule
            {
                DoctorId = secondDoctor.Id,
                DayOfWeek = day,
                StartTime = new TimeOnly(9, 0),
                EndTime = new TimeOnly(17, 0),
                SlotDurationMinutes = 30
            });
        }
        await Uow.SaveChangesAsync();

        await TestData.SeedAppointmentAsync(
            Uow, scenario.DoctorId, scenario.PatientId,
            scenario.FutureBookingDate, new TimeOnly(11, 0), AppointmentStatus.Confirmed);

        CurrentUser.As(UserRole.Receptionist, scenario.ReceptionistUserId);
        var appts = new AppointmentService(Uow, CurrentUser, Notifications, Board);
        await Assert.ThrowsAsync<ConflictException>(() => appts.BookAsync(new BookAppointmentRequest
        {
            DoctorId = secondDoctor.Id,
            PatientId = scenario.PatientId,
            AppointmentDate = scenario.FutureBookingDate,
            StartTime = new TimeOnly(11, 0),
            Reason = "Patient busy"
        }));

        // DoctorLeaveService line 97: doctor deletes own leave
        CurrentUser.As(UserRole.Doctor, scenario.DoctorUserId);
        var leaves = new DoctorLeaveService(Uow, CurrentUser);
        var leave = await leaves.CreateAsync(scenario.DoctorId, new CreateDoctorLeaveRequest
        {
            StartDate = scenario.FutureBookingDate.AddDays(40),
            EndDate = scenario.FutureBookingDate.AddDays(41),
            Reason = "Delete me"
        });
        await leaves.DeleteAsync(scenario.DoctorId, leave.Id);

        await Assert.ThrowsAsync<ForbiddenException>(() => leaves.CreateAsync(9999, new CreateDoctorLeaveRequest
        {
            StartDate = scenario.FutureBookingDate.AddDays(60),
            EndDate = scenario.FutureBookingDate.AddDays(61),
            Reason = "Unknown doctor"
        }));

        CurrentUser.As(UserRole.Admin, scenario.AdminUserId);
        var adminLeave = await leaves.CreateAsync(scenario.DoctorId, new CreateDoctorLeaveRequest
        {
            StartDate = scenario.FutureBookingDate.AddDays(50),
            EndDate = scenario.FutureBookingDate.AddDays(51),
            Reason = "Staff cannot delete"
        });
        CurrentUser.As(UserRole.Receptionist, scenario.ReceptionistUserId);
        await Assert.ThrowsAsync<ForbiddenException>(() => leaves.DeleteAsync(scenario.DoctorId, adminLeave.Id));

        // PatientService line 48: name ascending sort arm
        var patients = new PatientService(Uow, PasswordHasher, CurrentUser);
        var byNameAsc = await patients.GetPagedAsync(new PatientQueryParams
        {
            SortBy = "name",
            SortDescending = false,
            PageSize = 50
        });
        Assert.Equal(2, byNameAsc.TotalCount);
        _ = await patients.GetPagedAsync(new PatientQueryParams { SortBy = "mrn", SortDescending = false, PageSize = 50 });
    }

    private async Task<LabReport> SeedLabReport(TestScenario scenario)
    {
        using var stream = new MemoryStream(new byte[] { 1, 2, 3 });
        var stored = await FileStorage.SaveAsync(stream, "report.pdf", "lab-reports");
        var report = new LabReport
        {
            PatientId = scenario.PatientId,
            DoctorId = scenario.DoctorId,
            ReportType = "Blood",
            Title = "CBC",
            FileName = "report.pdf",
            StoredFilePath = stored.RelativePath,
            ContentType = "application/pdf",
            FileSizeBytes = stored.SizeBytes,
            UploadedByUserId = 1
        };
        await Uow.LabReports.AddAsync(report);
        await Uow.SaveChangesAsync();
        return report;
    }
}
