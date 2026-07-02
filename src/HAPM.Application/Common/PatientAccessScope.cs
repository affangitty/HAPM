using HAPM.Application.Interfaces;
using HAPM.Domain.Entities;
using HAPM.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace HAPM.Application.Common;

/// <summary>
/// Patient visibility: receptionists and admins see all patients; doctors only see patients they have treated.
/// </summary>
public static class PatientAccessScope
{
    public static async Task<IQueryable<Patient>> ApplyToPatientsAsync(
        IQueryable<Patient> query,
        IUnitOfWork uow,
        ICurrentUserService currentUser,
        CancellationToken ct)
    {
        if (currentUser.Role == UserRole.Doctor)
        {
            var doctorId = await uow.Doctors.Query()
                .Where(d => d.UserId == currentUser.UserId)
                .Select(d => (int?)d.Id)
                .FirstOrDefaultAsync(ct);

            if (doctorId is null)
                return query.Where(_ => false);

            var patientIds = uow.Appointments.Query()
                .Where(a => a.DoctorId == doctorId)
                .Select(a => a.PatientId)
                .Distinct();

            return query.Where(p => patientIds.Contains(p.Id));
        }

        if (currentUser.Role == UserRole.Patient)
        {
            return query.Where(p => p.UserId == currentUser.UserId);
        }

        return query;
    }

    public static async Task EnsureCanAccessPatientAsync(
        int patientId,
        IUnitOfWork uow,
        ICurrentUserService currentUser,
        CancellationToken ct)
    {
        if (currentUser.Role == UserRole.Patient)
        {
            var ownsRecord = await uow.Patients.Query()
                .AnyAsync(p => p.Id == patientId && p.UserId == currentUser.UserId, ct);

            if (!ownsRecord)
                throw new ForbiddenException("Patients can only access their own record.");

            return;
        }

        if (currentUser.Role == UserRole.Doctor)
        {
            var doctorId = await uow.Doctors.Query()
                .Where(d => d.UserId == currentUser.UserId)
                .Select(d => (int?)d.Id)
                .FirstOrDefaultAsync(ct);

            if (doctorId is null)
                throw new ForbiddenException();

            var hasRelationship = await uow.Appointments.Query()
                .AnyAsync(a => a.DoctorId == doctorId && a.PatientId == patientId, ct);

            if (!hasRelationship)
                throw new ForbiddenException("You can only access patients assigned to your care.");

            return;
        }
    }
}
