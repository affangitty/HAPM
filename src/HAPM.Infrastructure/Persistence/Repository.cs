using HAPM.Application.Interfaces;
using HAPM.Domain.Common;
using HAPM.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace HAPM.Infrastructure.Persistence;

public class Repository<T> : IRepository<T> where T : BaseEntity
{
    private readonly AppDbContext _context;
    private readonly DbSet<T> _set;

    public Repository(AppDbContext context)
    {
        _context = context;
        _set = context.Set<T>();
    }

    public IQueryable<T> Query() => _set.AsNoTracking();

    public IQueryable<T> QueryTracked() => _set;

    public async Task<T?> GetByIdAsync(int id, CancellationToken ct = default) =>
        await _set.FindAsync(new object[] { id }, ct);

    public async Task AddAsync(T entity, CancellationToken ct = default) =>
        await _set.AddAsync(entity, ct);

    public void Update(T entity) => _set.Update(entity);

    public void Remove(T entity) => _set.Remove(entity);
}

public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _context;

    public UnitOfWork(AppDbContext context)
    {
        _context = context;
        Users = new Repository<User>(context);
        RefreshTokens = new Repository<RefreshToken>(context);
        PasswordResetTokens = new Repository<PasswordResetToken>(context);
        Doctors = new Repository<Doctor>(context);
        DoctorSchedules = new Repository<DoctorSchedule>(context);
        Patients = new Repository<Patient>(context);
        Appointments = new Repository<Appointment>(context);
        Prescriptions = new Repository<Prescription>(context);
        LabReports = new Repository<LabReport>(context);
        Invoices = new Repository<Invoice>(context);
        Notifications = new Repository<Notification>(context);
        VitalSigns = new Repository<VitalSign>(context);
        DoctorLeaves = new Repository<DoctorLeave>(context);
        DoctorReviews = new Repository<DoctorReview>(context);
        WaitlistEntries = new Repository<WaitlistEntry>(context);
        Payments = new Repository<Payment>(context);
        AuditLogs = new Repository<AuditLog>(context);
        PrescriptionTemplates = new Repository<PrescriptionTemplate>(context);
        StaffMessages = new Repository<StaffMessage>(context);
    }

    public IRepository<User> Users { get; }
    public IRepository<RefreshToken> RefreshTokens { get; }
    public IRepository<PasswordResetToken> PasswordResetTokens { get; }
    public IRepository<Doctor> Doctors { get; }
    public IRepository<DoctorSchedule> DoctorSchedules { get; }
    public IRepository<Patient> Patients { get; }
    public IRepository<Appointment> Appointments { get; }
    public IRepository<Prescription> Prescriptions { get; }
    public IRepository<LabReport> LabReports { get; }
    public IRepository<Invoice> Invoices { get; }
    public IRepository<Notification> Notifications { get; }
    public IRepository<VitalSign> VitalSigns { get; }
    public IRepository<DoctorLeave> DoctorLeaves { get; }
    public IRepository<DoctorReview> DoctorReviews { get; }
    public IRepository<WaitlistEntry> WaitlistEntries { get; }
    public IRepository<Payment> Payments { get; }
    public IRepository<AuditLog> AuditLogs { get; }
    public IRepository<PrescriptionTemplate> PrescriptionTemplates { get; }
    public IRepository<StaffMessage> StaffMessages { get; }

    public Task<int> SaveChangesAsync(CancellationToken ct = default) => _context.SaveChangesAsync(ct);
}
