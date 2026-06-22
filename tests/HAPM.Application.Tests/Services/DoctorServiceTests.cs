using HAPM.Application.Common;
using HAPM.Application.DTOs;
using HAPM.Application.Services;
using HAPM.Application.Tests.Infrastructure;
using HAPM.Domain.Entities;
using HAPM.Domain.Enums;

namespace HAPM.Application.Tests.Services;

public class DoctorServiceTests : ServiceTestBase
{
    private DoctorService CreateSut() => new(Uow, PasswordHasher, CurrentUser);

    [Fact]
    public async Task GetPagedAsync_filters_search_and_specialization()
    {
        var scenario = await SeedScenarioAsync();
        var sut = CreateSut();

        var result = await sut.GetPagedAsync(new DoctorQueryParams
        {
            Search = "Sharma",
            Specialization = "Cardiology",
            IsAvailable = true,
            SortBy = "fee",
            SortDescending = true,
            Page = 1,
            PageSize = 10
        });

        Assert.Single(result.Items);
        Assert.Equal(scenario.DoctorId, result.Items[0].Id);
    }

    [Fact]
    public async Task GetPagedAsync_supports_all_sort_options()
    {
        await SeedScenarioAsync();
        var sut = CreateSut();

        foreach (var sort in new[] { ("name", true), ("experience", false), ("specialization", true), (null, false) })
        {
            var result = await sut.GetPagedAsync(new DoctorQueryParams { SortBy = sort.Item1, SortDescending = sort.Item2 });
            Assert.NotEmpty(result.Items);
        }
    }

    [Fact]
    public async Task GetByIdAsync_returns_doctor()
    {
        var scenario = await SeedScenarioAsync();
        var sut = CreateSut();

        var doctor = await sut.GetByIdAsync(scenario.DoctorId);

        Assert.Equal("Dr Test Sharma", doctor.FullName);
    }

    [Fact]
    public async Task GetByIdAsync_missing_throws_not_found()
    {
        await SeedScenarioAsync();
        var sut = CreateSut();
        await Assert.ThrowsAsync<NotFoundException>(() => sut.GetByIdAsync(9999));
    }

    [Fact]
    public async Task CreateAsync_creates_doctor()
    {
        await SeedScenarioAsync();
        var sut = CreateSut();

        var created = await sut.CreateAsync(TestData.SampleCreateDoctorRequest("new.doctor@test.local"));

        Assert.Equal("Neurology", created.Specialization);
        Assert.StartsWith("hash:", (await Uow.Users.GetByIdAsync(created.UserId))!.PasswordHash);
    }

    [Fact]
    public async Task CreateAsync_duplicate_email_throws_conflict()
    {
        await SeedScenarioAsync();
        var sut = CreateSut();

        await Assert.ThrowsAsync<ConflictException>(() =>
            sut.CreateAsync(TestData.SampleCreateDoctorRequest("doctor@test.local")));
    }

    [Fact]
    public async Task CreateAsync_duplicate_license_throws_conflict()
    {
        await SeedScenarioAsync();
        var sut = CreateSut();
        var request = TestData.SampleCreateDoctorRequest("unique@test.local");
        request.LicenseNumber = "LIC-TEST-001";

        await Assert.ThrowsAsync<ConflictException>(() => sut.CreateAsync(request));
    }

    [Fact]
    public async Task UpdateAsync_updates_doctor()
    {
        var scenario = await SeedScenarioAsync();
        var sut = CreateSut();

        var updated = await sut.UpdateAsync(scenario.DoctorId, new UpdateDoctorRequest
        {
            FullName = "Dr Updated",
            PhoneNumber = "+10000000099",
            Specialization = "Cardiology",
            Qualification = "MD",
            ExperienceYears = 12,
            ConsultationFee = 700m,
            RoomNumber = "303",
            Biography = "Updated bio",
            IsAvailable = true
        });

        Assert.Equal("Dr Updated", updated.FullName);
    }

    [Fact]
    public async Task UpdateOwnProfileAsync_doctor_updates_self()
    {
        var scenario = await SeedScenarioAsync();
        CurrentUser.As(UserRole.Doctor, scenario.DoctorUserId);
        var sut = CreateSut();

        var updated = await sut.UpdateOwnProfileAsync(scenario.DoctorId, new UpdateOwnDoctorProfileRequest
        {
            FullName = "Dr Self Updated",
            PhoneNumber = "+10000000088",
            RoomNumber = "105",
            Biography = "Self bio"
        });

        Assert.Equal("Dr Self Updated", updated.FullName);
    }

    [Fact]
    public async Task UpdateOwnProfileAsync_non_doctor_throws_forbidden()
    {
        var scenario = await SeedScenarioAsync();
        CurrentUser.As(UserRole.Patient, scenario.PatientUserId);
        var sut = CreateSut();

        await Assert.ThrowsAsync<ForbiddenException>(() => sut.UpdateOwnProfileAsync(scenario.DoctorId, new UpdateOwnDoctorProfileRequest
        {
            FullName = "X",
            PhoneNumber = "+10000000001"
        }));
    }

    [Fact]
    public async Task UpdateOwnProfileAsync_other_doctor_throws_forbidden()
    {
        var scenario = await SeedScenarioAsync();
        CurrentUser.As(UserRole.Doctor, scenario.DoctorUserId);

        var other = await CreateOtherDoctorAsync();
        var sut = CreateSut();

        await Assert.ThrowsAsync<ForbiddenException>(() => sut.UpdateOwnProfileAsync(other.Id, new UpdateOwnDoctorProfileRequest
        {
            FullName = "X",
            PhoneNumber = "+10000000001"
        }));
    }

    private async Task<Doctor> CreateOtherDoctorAsync()
    {
        var user = new User
        {
            Email = "other.doctor@test.local",
            PasswordHash = "hash",
            FullName = "Other Doctor",
            PhoneNumber = "+10000000077",
            Role = UserRole.Doctor
        };
        var doctor = new Doctor
        {
            User = user,
            Specialization = "ENT",
            Qualification = "MBBS",
            LicenseNumber = "LIC-OTHER-001",
            ConsultationFee = 400m
        };
        await Uow.Doctors.AddAsync(doctor);
        await Uow.SaveChangesAsync();
        return doctor;
    }

    [Fact]
    public async Task DeactivateAsync_without_upcoming_succeeds()
    {
        var scenario = await SeedScenarioAsync();
        var sut = CreateSut();

        await sut.DeactivateAsync(scenario.DoctorId);

        var doctor = await Uow.Doctors.GetByIdAsync(scenario.DoctorId);
        Assert.False(doctor!.IsAvailable);
        Assert.False((await Uow.Users.GetByIdAsync(scenario.DoctorUserId))!.IsActive);
    }

    [Fact]
    public async Task DeactivateAsync_with_upcoming_throws_conflict()
    {
        var scenario = await SeedScenarioAsync();
        await TestData.SeedAppointmentAsync(
            Uow, scenario.DoctorId, scenario.PatientId,
            scenario.FutureBookingDate, scenario.DefaultSlotStart, AppointmentStatus.Confirmed);

        var sut = CreateSut();
        await Assert.ThrowsAsync<ConflictException>(() => sut.DeactivateAsync(scenario.DoctorId));
    }

    [Fact]
    public async Task SetSchedulesAsync_replaces_schedule()
    {
        var scenario = await SeedScenarioAsync();
        var sut = CreateSut();

        var schedules = await sut.SetSchedulesAsync(scenario.DoctorId, new List<ScheduleSlotRequest>
        {
            new() { DayOfWeek = DayOfWeek.Monday, StartTime = new TimeOnly(8, 0), EndTime = new TimeOnly(12, 0), SlotDurationMinutes = 30 }
        });

        Assert.Single(schedules);
    }

    [Fact]
    public async Task SetSchedulesAsync_invalid_times_throw_bad_request()
    {
        var scenario = await SeedScenarioAsync();
        var sut = CreateSut();

        await Assert.ThrowsAsync<BadRequestException>(() => sut.SetSchedulesAsync(scenario.DoctorId, new List<ScheduleSlotRequest>
        {
            new() { DayOfWeek = DayOfWeek.Monday, StartTime = new TimeOnly(12, 0), EndTime = new TimeOnly(8, 0), SlotDurationMinutes = 30 }
        }));
    }

    [Fact]
    public async Task SetSchedulesAsync_overlapping_windows_throw_bad_request()
    {
        var scenario = await SeedScenarioAsync();
        var sut = CreateSut();

        await Assert.ThrowsAsync<BadRequestException>(() => sut.SetSchedulesAsync(scenario.DoctorId, new List<ScheduleSlotRequest>
        {
            new() { DayOfWeek = DayOfWeek.Monday, StartTime = new TimeOnly(8, 0), EndTime = new TimeOnly(12, 0), SlotDurationMinutes = 30 },
            new() { DayOfWeek = DayOfWeek.Monday, StartTime = new TimeOnly(11, 0), EndTime = new TimeOnly(13, 0), SlotDurationMinutes = 30 }
        }));
    }

    [Fact]
    public async Task GetSchedulesAsync_returns_slots()
    {
        var scenario = await SeedScenarioAsync();
        var sut = CreateSut();

        var schedules = await sut.GetSchedulesAsync(scenario.DoctorId);
        Assert.NotEmpty(schedules);
    }

    [Fact]
    public async Task GetAvailableSlotsAsync_returns_open_slots()
    {
        var scenario = await SeedScenarioAsync();
        var sut = CreateSut();

        var slots = await sut.GetAvailableSlotsAsync(scenario.DoctorId, scenario.FutureBookingDate);
        Assert.NotEmpty(slots);
    }

    [Fact]
    public async Task GetAvailableSlotsAsync_past_date_throws_bad_request()
    {
        var scenario = await SeedScenarioAsync();
        var sut = CreateSut();

        await Assert.ThrowsAsync<BadRequestException>(() =>
            sut.GetAvailableSlotsAsync(scenario.DoctorId, HospitalClock.Today.AddDays(-1)));
    }

    [Fact]
    public async Task GetAvailableSlotsAsync_unavailable_doctor_returns_empty()
    {
        var scenario = await SeedScenarioAsync();
        var doctor = await Uow.Doctors.GetByIdAsync(scenario.DoctorId);
        doctor!.IsAvailable = false;
        await Uow.SaveChangesAsync();

        var sut = CreateSut();
        var slots = await sut.GetAvailableSlotsAsync(scenario.DoctorId, scenario.FutureBookingDate);
        Assert.Empty(slots);
    }

    [Fact]
    public async Task GetAvailableSlotsAsync_on_leave_returns_empty()
    {
        var scenario = await SeedScenarioAsync();
        await Uow.DoctorLeaves.AddAsync(new DoctorLeave
        {
            DoctorId = scenario.DoctorId,
            StartDate = scenario.FutureBookingDate,
            EndDate = scenario.FutureBookingDate,
            Reason = "Leave"
        });
        await Uow.SaveChangesAsync();

        var sut = CreateSut();
        var slots = await sut.GetAvailableSlotsAsync(scenario.DoctorId, scenario.FutureBookingDate);
        Assert.Empty(slots);
    }

    [Fact]
    public async Task GetSpecializationsAsync_returns_distinct_list()
    {
        await SeedScenarioAsync();
        var sut = CreateSut();

        var specs = await sut.GetSpecializationsAsync();
        Assert.Contains("Cardiology", specs);
    }

    [Fact]
    public async Task GetPerformanceAsync_admin_sees_metrics()
    {
        var scenario = await SeedScenarioAsync();
        var appointment = await TestData.SeedAppointmentAsync(
            Uow, scenario.DoctorId, scenario.PatientId,
            HospitalClock.Today.AddDays(-3), new TimeOnly(10, 0), AppointmentStatus.Completed);
        await Uow.DoctorReviews.AddAsync(new DoctorReview
        {
            DoctorId = scenario.DoctorId,
            PatientId = scenario.PatientId,
            AppointmentId = appointment.Id,
            Rating = 5,
            Comment = "Great"
        });
        await Uow.SaveChangesAsync();

        CurrentUser.As(UserRole.Admin, scenario.AdminUserId);
        var sut = CreateSut();

        var perf = await sut.GetPerformanceAsync(scenario.DoctorId);
        Assert.Equal(1, perf.CompletedAppointments);
        Assert.Equal(5, perf.AverageRating);
    }

    [Fact]
    public async Task GetPerformanceAsync_doctor_cannot_view_other_doctor()
    {
        var scenario = await SeedScenarioAsync();
        var other = await CreateOtherDoctorAsync();
        CurrentUser.As(UserRole.Doctor, scenario.DoctorUserId);
        var sut = CreateSut();

        await Assert.ThrowsAsync<ForbiddenException>(() => sut.GetPerformanceAsync(other.Id));
    }
}
