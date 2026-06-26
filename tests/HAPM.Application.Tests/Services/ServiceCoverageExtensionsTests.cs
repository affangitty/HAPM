using HAPM.Application.Common;
using HAPM.Application.DTOs;
using HAPM.Application.Services;
using HAPM.Application.Tests.Infrastructure;
using HAPM.Domain.Enums;

namespace HAPM.Application.Tests.Services;

/// <summary>Additional tests covering remaining branches in partially-tested services.</summary>
public class ServiceCoverageExtensionsTests : ServiceTestBase
{
    [Fact]
    public async Task AuthService_logout_revokes_refresh_token()
    {
        await SeedScenarioAsync();
        var sut = new AuthService(Uow, TokenService, PasswordHasher, CurrentUser, TokenHasher, EmailSender, FrontendOptions);
        var login = await sut.LoginAsync(new LoginRequest
        {
            Email = "patient@test.local",
            Password = TestData.DefaultPassword
        });

        CurrentUser.As(UserRole.Patient, login.User.Id);
        await sut.LogoutAsync(new RefreshTokenRequest { RefreshToken = login.RefreshToken });

        await Assert.ThrowsAsync<UnauthorizedException>(() =>
            sut.RefreshTokenAsync(new RefreshTokenRequest { RefreshToken = login.RefreshToken }));
    }

    [Fact]
    public async Task AuthService_refresh_deactivated_user_throws_unauthorized()
    {
        var scenario = await SeedScenarioAsync();
        var sut = new AuthService(Uow, TokenService, PasswordHasher, CurrentUser, TokenHasher, EmailSender, FrontendOptions);
        var login = await sut.LoginAsync(new LoginRequest
        {
            Email = "patient@test.local",
            Password = TestData.DefaultPassword
        });

        var user = await Uow.Users.GetByIdAsync(scenario.PatientUserId);
        user!.IsActive = false;
        await Uow.SaveChangesAsync();

        await Assert.ThrowsAsync<UnauthorizedException>(() =>
            sut.RefreshTokenAsync(new RefreshTokenRequest { RefreshToken = login.RefreshToken }));
    }

    [Fact]
    public async Task AuthService_get_current_user_unauthorized_when_anonymous()
    {
        await SeedScenarioAsync();
        var sut = new AuthService(Uow, TokenService, PasswordHasher, CurrentUser, TokenHasher, EmailSender, FrontendOptions);
        await Assert.ThrowsAsync<UnauthorizedException>(() => sut.GetCurrentUserAsync());
    }

    [Fact]
    public async Task AppointmentService_get_paged_and_by_id()
    {
        var scenario = await SeedScenarioAsync();
        await TestData.SeedAppointmentAsync(
            Uow, scenario.DoctorId, scenario.PatientId,
            scenario.FutureBookingDate, scenario.DefaultSlotStart, AppointmentStatus.Pending);

        CurrentUser.As(UserRole.Patient, scenario.PatientUserId);
        var sut = new AppointmentService(Uow, CurrentUser, Notifications, Board);

        var paged = await sut.GetPagedAsync(new AppointmentQueryParams { Search = "Test", SortDescending = true });
        var byId = await sut.GetByIdAsync(paged.Items[0].Id);

        Assert.Single(paged.Items);
        Assert.Equal(byId.Id, paged.Items[0].Id);
    }

    [Fact]
    public async Task AppointmentService_staff_books_for_patient()
    {
        var scenario = await SeedScenarioAsync();
        CurrentUser.As(UserRole.Receptionist, scenario.ReceptionistUserId);
        var sut = new AppointmentService(Uow, CurrentUser, Notifications, Board);

        var result = await sut.BookAsync(new BookAppointmentRequest
        {
            DoctorId = scenario.DoctorId,
            PatientId = scenario.SecondPatientId,
            AppointmentDate = scenario.FutureBookingDate,
            StartTime = scenario.DefaultSlotStart.AddMinutes(30),
            Reason = "Staff booking"
        });

        Assert.Equal(scenario.SecondPatientId, result.PatientId);
    }

    [Fact]
    public async Task AppointmentService_book_on_leave_throws_bad_request()
    {
        var scenario = await SeedScenarioAsync();
        await Uow.DoctorLeaves.AddAsync(new Domain.Entities.DoctorLeave
        {
            DoctorId = scenario.DoctorId,
            StartDate = scenario.FutureBookingDate,
            EndDate = scenario.FutureBookingDate,
            Reason = "Leave"
        });
        await Uow.SaveChangesAsync();

        CurrentUser.As(UserRole.Patient, scenario.PatientUserId);
        var sut = new AppointmentService(Uow, CurrentUser, Notifications, Board);

        await Assert.ThrowsAsync<BadRequestException>(() => sut.BookAsync(new BookAppointmentRequest
        {
            DoctorId = scenario.DoctorId,
            AppointmentDate = scenario.FutureBookingDate,
            StartTime = scenario.DefaultSlotStart,
            Reason = "Visit"
        }));
    }

    [Fact]
    public async Task AppointmentService_complete_from_confirmed()
    {
        var scenario = await SeedScenarioAsync();
        var appointment = await TestData.SeedAppointmentAsync(
            Uow, scenario.DoctorId, scenario.PatientId,
            scenario.FutureBookingDate, scenario.DefaultSlotStart, AppointmentStatus.Confirmed);

        CurrentUser.As(UserRole.Doctor, scenario.DoctorUserId);
        var sut = new AppointmentService(Uow, CurrentUser, Notifications, Board);

        var result = await sut.CompleteAsync(appointment.Id, new CompleteAppointmentRequest());
        Assert.Equal(AppointmentStatus.Completed, result.Status);
    }

    [Fact]
    public async Task AppointmentService_cancel_completed_throws_conflict()
    {
        var scenario = await SeedScenarioAsync();
        var appointment = await TestData.SeedAppointmentAsync(
            Uow, scenario.DoctorId, scenario.PatientId,
            scenario.FutureBookingDate, scenario.DefaultSlotStart, AppointmentStatus.Completed);

        CurrentUser.As(UserRole.Patient, scenario.PatientUserId);
        var sut = new AppointmentService(Uow, CurrentUser, Notifications, Board);

        await Assert.ThrowsAsync<ConflictException>(() =>
            sut.CancelAsync(appointment.Id, new CancelAppointmentRequest { Reason = "Too late" }));
    }

    [Fact]
    public async Task BillingService_get_paged_get_by_id_and_payments()
    {
        var scenario = await SeedScenarioAsync();
        var invoice = await TestData.SeedInvoiceAsync(Uow, scenario.PatientId, 100m);
        CurrentUser.As(UserRole.Patient, scenario.PatientUserId);
        var sut = new BillingService(Uow, CurrentUser, Notifications);

        var paged = await sut.GetPagedAsync(new InvoiceQueryParams
        {
            PatientId = scenario.PatientId,
            Status = InvoiceStatus.Pending,
            FromDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1)),
            ToDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)),
            Search = invoice.InvoiceNumber,
            SortBy = "total",
            SortDescending = false
        });
        var byId = await sut.GetByIdAsync(invoice.Id);
        var payments = await sut.GetPaymentsAsync(invoice.Id);

        Assert.Single(paged.Items);
        Assert.Equal(invoice.Id, byId.Id);
        Assert.Empty(payments);
    }

    [Fact]
    public async Task PrescriptionService_get_paged_get_by_id_and_by_appointment()
    {
        var scenario = await SeedScenarioAsync();
        var appointment = await TestData.SeedAppointmentAsync(
            Uow, scenario.DoctorId, scenario.PatientId,
            scenario.FutureBookingDate, scenario.DefaultSlotStart, AppointmentStatus.CheckedIn);

        CurrentUser.As(UserRole.Doctor, scenario.DoctorUserId);
        var sut = new PrescriptionService(Uow, CurrentUser, Notifications);
        var created = await sut.CreateAsync(new CreatePrescriptionRequest
        {
            AppointmentId = appointment.Id,
            Diagnosis = "Flu",
            Items = new List<PrescriptionItemRequest> { TestData.SamplePrescriptionItem() }
        });

        CurrentUser.As(UserRole.Patient, scenario.PatientUserId);
        var paged = await sut.GetPagedAsync(new PrescriptionQueryParams
        {
            PatientId = scenario.PatientId,
            DoctorId = scenario.DoctorId,
            FromDate = scenario.FutureBookingDate.AddDays(-1),
            ToDate = scenario.FutureBookingDate.AddDays(1),
            Search = "Flu",
            SortDescending = false
        });
        var byId = await sut.GetByIdAsync(created.Id);
        var byAppointment = await sut.GetByAppointmentAsync(appointment.Id);

        Assert.Single(paged.Items);
        Assert.Equal(created.Id, byId.Id);
        Assert.Equal(created.Id, byAppointment.Id);
    }

    [Fact]
    public async Task VitalSignService_get_paged_and_get_by_id()
    {
        var scenario = await SeedScenarioAsync();
        var appointment = await TestData.SeedAppointmentAsync(
            Uow, scenario.DoctorId, scenario.PatientId,
            scenario.FutureBookingDate, scenario.DefaultSlotStart, AppointmentStatus.Confirmed);

        CurrentUser.As(UserRole.Doctor, scenario.DoctorUserId);
        var sut = new VitalSignService(Uow, CurrentUser);
        var recorded = await sut.RecordAsync(new RecordVitalSignRequest
        {
            AppointmentId = appointment.Id,
            TemperatureCelsius = 37.0m,
            PulseBpm = 72,
            SystolicBpMmHg = 120,
            DiastolicBpMmHg = 80
        });

        CurrentUser.As(UserRole.Patient, scenario.PatientUserId);
        var paged = await sut.GetPagedAsync(new VitalSignQueryParams
        {
            PatientId = scenario.PatientId,
            AppointmentId = appointment.Id
        });
        var byId = await sut.GetByIdAsync(recorded.Id);

        Assert.Single(paged.Items);
        Assert.Equal(recorded.Id, byId.Id);
    }

    [Fact]
    public async Task ReviewService_get_paged()
    {
        var scenario = await SeedScenarioAsync();
        var appointment = await TestData.SeedAppointmentAsync(
            Uow, scenario.DoctorId, scenario.PatientId,
            HospitalClock.Today.AddDays(-1), new TimeOnly(10, 0), AppointmentStatus.Completed);

        CurrentUser.As(UserRole.Patient, scenario.PatientUserId);
        var sut = new ReviewService(Uow, CurrentUser);
        await sut.CreateAsync(new CreateReviewRequest
        {
            AppointmentId = appointment.Id,
            Rating = 4,
            Comment = "Good care"
        });

        var paged = await sut.GetPagedAsync(new ReviewQueryParams
        {
            DoctorId = scenario.DoctorId,
            MinRating = 4,
            Search = "Good",
            SortDescending = false
        });

        Assert.Single(paged.Items);
    }

    [Fact]
    public async Task WaitlistService_get_paged_staff_join_and_cancel_paths()
    {
        var scenario = await SeedScenarioAsync();
        CurrentUser.As(UserRole.Receptionist, scenario.ReceptionistUserId);
        var sut = new WaitlistService(Uow, CurrentUser);

        await sut.JoinAsync(new JoinWaitlistRequest
        {
            DoctorId = scenario.DoctorId,
            PatientId = scenario.PatientId,
            PreferredDate = scenario.FutureBookingDate,
            Notes = "Need slot"
        });

        var paged = await sut.GetPagedAsync(new WaitlistQueryParams
        {
            DoctorId = scenario.DoctorId,
            PreferredDate = scenario.FutureBookingDate,
            Status = WaitlistStatus.Active
        });

        await sut.CancelAsync(paged.Items[0].Id);
        await Assert.ThrowsAsync<ConflictException>(() => sut.CancelAsync(paged.Items[0].Id));
    }

    [Fact]
    public async Task WaitlistService_join_without_patient_id_throws_bad_request()
    {
        var scenario = await SeedScenarioAsync();
        CurrentUser.As(UserRole.Receptionist, scenario.ReceptionistUserId);
        var sut = new WaitlistService(Uow, CurrentUser);

        await Assert.ThrowsAsync<BadRequestException>(() => sut.JoinAsync(new JoinWaitlistRequest
        {
            DoctorId = scenario.DoctorId,
            PreferredDate = scenario.FutureBookingDate
        }));
    }

    [Fact]
    public async Task UserService_get_paged()
    {
        await SeedScenarioAsync();
        var sut = new UserService(Uow, PasswordHasher, CurrentUser);

        var paged = await sut.GetPagedAsync(new UserQueryParams
        {
            Search = "admin",
            Role = UserRole.Admin,
            IsActive = true,
            SortBy = "name",
            SortDescending = false
        });

        Assert.Single(paged.Items);
    }

    [Fact]
    public async Task DoctorLeaveService_get_delete_admin_and_conflict_paths()
    {
        var scenario = await SeedScenarioAsync();
        CurrentUser.As(UserRole.Admin, scenario.AdminUserId);
        var sut = new DoctorLeaveService(Uow, CurrentUser);

        var leave = await sut.CreateAsync(scenario.DoctorId, new CreateDoctorLeaveRequest
        {
            StartDate = scenario.FutureBookingDate.AddDays(10),
            EndDate = scenario.FutureBookingDate.AddDays(12),
            Reason = "Vacation"
        });

        var list = await sut.GetForDoctorAsync(scenario.DoctorId);
        Assert.Single(list);

        await sut.DeleteAsync(scenario.DoctorId, leave.Id);
        Assert.Empty(await sut.GetForDoctorAsync(scenario.DoctorId));
    }

    [Fact]
    public async Task DoctorLeaveService_create_with_active_appointments_throws_conflict()
    {
        var scenario = await SeedScenarioAsync();
        await TestData.SeedAppointmentAsync(
            Uow, scenario.DoctorId, scenario.PatientId,
            scenario.FutureBookingDate, scenario.DefaultSlotStart, AppointmentStatus.Confirmed);

        CurrentUser.As(UserRole.Doctor, scenario.DoctorUserId);
        var sut = new DoctorLeaveService(Uow, CurrentUser);

        await Assert.ThrowsAsync<ConflictException>(() => sut.CreateAsync(scenario.DoctorId, new CreateDoctorLeaveRequest
        {
            StartDate = scenario.FutureBookingDate,
            EndDate = scenario.FutureBookingDate,
            Reason = "Blocked"
        }));
    }

    [Fact]
    public async Task DoctorLeaveService_forbidden_for_non_owner()
    {
        var scenario = await SeedScenarioAsync();
        CurrentUser.As(UserRole.Patient, scenario.PatientUserId);
        var sut = new DoctorLeaveService(Uow, CurrentUser);

        await Assert.ThrowsAsync<ForbiddenException>(() => sut.CreateAsync(scenario.DoctorId, new CreateDoctorLeaveRequest
        {
            StartDate = scenario.FutureBookingDate.AddDays(20),
            EndDate = scenario.FutureBookingDate.AddDays(21),
            Reason = "Nope"
        }));
    }
}
