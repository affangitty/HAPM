namespace HAPM.API.Security;

/// <summary>Role name constants matching <see cref="HAPM.Domain.Enums.UserRole"/>.</summary>
public static class Roles
{
    public const string Admin = "Admin";
    public const string Doctor = "Doctor";
    public const string Patient = "Patient";
    public const string Receptionist = "Receptionist";

    public const string Staff = Admin + "," + Receptionist;
    public const string Clinical = Admin + "," + Receptionist + "," + Doctor;
}
