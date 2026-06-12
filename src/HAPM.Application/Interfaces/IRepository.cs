using HAPM.Domain.Common;
using HAPM.Domain.Entities;

namespace HAPM.Application.Interfaces;

public interface IRepository<T> where T : BaseEntity
{
    /// <summary>Returns a no-tracking queryable for reads.</summary>
    IQueryable<T> Query();

    /// <summary>Returns a tracking queryable for updates.</summary>
    IQueryable<T> QueryTracked();

    Task<T?> GetByIdAsync(int id, CancellationToken ct = default);
    Task AddAsync(T entity, CancellationToken ct = default);
    void Update(T entity);
    void Remove(T entity);
}

public interface IUnitOfWork
{
    IRepository<User> Users { get; }
    IRepository<RefreshToken> RefreshTokens { get; }
    IRepository<Doctor> Doctors { get; }
    IRepository<DoctorSchedule> DoctorSchedules { get; }
    IRepository<Patient> Patients { get; }
    IRepository<Appointment> Appointments { get; }
    IRepository<Prescription> Prescriptions { get; }
    IRepository<LabReport> LabReports { get; }
    IRepository<Invoice> Invoices { get; }
    IRepository<Notification> Notifications { get; }
    IRepository<VitalSign> VitalSigns { get; }
    IRepository<DoctorLeave> DoctorLeaves { get; }
    IRepository<DoctorReview> DoctorReviews { get; }
    IRepository<WaitlistEntry> WaitlistEntries { get; }
    IRepository<Payment> Payments { get; }
    IRepository<AuditLog> AuditLogs { get; }
    IRepository<PrescriptionTemplate> PrescriptionTemplates { get; }

    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
