using HAPM.Application.Common;
using HAPM.Application.DTOs;
using HAPM.Application.Services;
using HAPM.Application.Tests.Infrastructure;
using HAPM.Domain.Enums;

namespace HAPM.Application.Tests.Services;

public class PatientServiceTests : ServiceTestBase
{
    private PatientService CreateSut() => new(Uow, PasswordHasher, CurrentUser);

    [Fact]
    public async Task GetPagedAsync_filters_and_sorts()
    {
        await SeedScenarioAsync();
        var sut = CreateSut();

        var result = await sut.GetPagedAsync(new PatientQueryParams
        {
            Search = "Test Patient",
            Gender = Gender.Male,
            BloodGroup = "O+",
            SortBy = "name",
            SortDescending = false,
            Page = 1,
            PageSize = 10
        });

        Assert.Single(result.Items);
    }

    [Fact]
    public async Task GetPagedAsync_supports_mrn_and_default_sort()
    {
        await SeedScenarioAsync();
        var sut = CreateSut();

        var byMrn = await sut.GetPagedAsync(new PatientQueryParams { SortBy = "mrn", SortDescending = true });
        var byRegistered = await sut.GetPagedAsync(new PatientQueryParams { SortBy = "registeredat", SortDescending = false });

        Assert.Equal(2, byMrn.TotalCount);
        Assert.Equal(2, byRegistered.TotalCount);
    }

    [Fact]
    public async Task GetByIdAsync_staff_can_access_any_patient()
    {
        var scenario = await SeedScenarioAsync();
        CurrentUser.As(UserRole.Receptionist, scenario.ReceptionistUserId);
        var sut = CreateSut();

        var patient = await sut.GetByIdAsync(scenario.PatientId);
        Assert.Equal("Test Patient", patient.FullName);
    }

    [Fact]
    public async Task GetByIdAsync_patient_cannot_access_other_record()
    {
        var scenario = await SeedScenarioAsync();
        CurrentUser.As(UserRole.Patient, scenario.PatientUserId);
        var sut = CreateSut();

        await Assert.ThrowsAsync<ForbiddenException>(() => sut.GetByIdAsync(scenario.SecondPatientId));
    }

    [Fact]
    public async Task GetMyProfileAsync_returns_current_patient()
    {
        var scenario = await SeedScenarioAsync();
        CurrentUser.As(UserRole.Patient, scenario.PatientUserId);
        var sut = CreateSut();

        var profile = await sut.GetMyProfileAsync();
        Assert.Equal(scenario.PatientId, profile.Id);
    }

    [Fact]
    public async Task GetMyProfileAsync_unauthenticated_throws_unauthorized()
    {
        await SeedScenarioAsync();
        var sut = CreateSut();
        await Assert.ThrowsAsync<UnauthorizedException>(() => sut.GetMyProfileAsync());
    }

    [Fact]
    public async Task CreateAsync_creates_patient_with_mrn()
    {
        await SeedScenarioAsync();
        var sut = CreateSut();

        var created = await sut.CreateAsync(new CreatePatientRequest
        {
            Email = "walkin@test.local",
            Password = TestData.DefaultPassword,
            FullName = "Walk In Patient",
            PhoneNumber = "+19997776655",
            DateOfBirth = new DateOnly(1988, 2, 2),
            Gender = Gender.Female,
            BloodGroup = "A+",
            Address = "123 Street"
        });

        Assert.StartsWith("MRN-", created.MedicalRecordNumber);
    }

    [Fact]
    public async Task CreateAsync_duplicate_email_throws_conflict()
    {
        await SeedScenarioAsync();
        var sut = CreateSut();

        await Assert.ThrowsAsync<ConflictException>(() => sut.CreateAsync(new CreatePatientRequest
        {
            Email = "patient@test.local",
            Password = TestData.DefaultPassword,
            FullName = "Dup",
            PhoneNumber = "+19997776655",
            DateOfBirth = new DateOnly(1988, 2, 2),
            Gender = Gender.Female
        }));
    }

    [Fact]
    public async Task UpdateAsync_patient_updates_own_record()
    {
        var scenario = await SeedScenarioAsync();
        CurrentUser.As(UserRole.Patient, scenario.PatientUserId);
        var sut = CreateSut();

        var updated = await sut.UpdateAsync(scenario.PatientId, new UpdatePatientRequest
        {
            FullName = "Updated Patient",
            PhoneNumber = "+19997776600",
            DateOfBirth = new DateOnly(1990, 5, 15),
            Gender = Gender.Male,
            BloodGroup = "O+",
            Address = "New address",
            EmergencyContactName = "Contact",
            EmergencyContactPhone = "+19997776601",
            Allergies = "None",
            ChronicConditions = "None"
        });

        Assert.Equal("Updated Patient", updated.FullName);
    }

    [Fact]
    public async Task DeactivateAsync_sets_user_inactive()
    {
        var scenario = await SeedScenarioAsync();
        var sut = CreateSut();

        await sut.DeactivateAsync(scenario.SecondPatientId);

        var patient = await Uow.Patients.GetByIdAsync(scenario.SecondPatientId);
        var user = await Uow.Users.GetByIdAsync(patient!.UserId);
        Assert.False(user!.IsActive);
    }

    [Fact]
    public async Task GetMedicalHistoryAsync_returns_related_records()
    {
        var scenario = await SeedScenarioAsync();
        CurrentUser.As(UserRole.Receptionist, scenario.ReceptionistUserId);
        await TestData.SeedAppointmentAsync(
            Uow, scenario.DoctorId, scenario.PatientId,
            scenario.FutureBookingDate, scenario.DefaultSlotStart, AppointmentStatus.Confirmed);

        var sut = CreateSut();
        var history = await sut.GetMedicalHistoryAsync(scenario.PatientId);

        Assert.Equal(scenario.PatientId, history.Patient.Id);
        Assert.Single(history.Appointments);
    }
}
