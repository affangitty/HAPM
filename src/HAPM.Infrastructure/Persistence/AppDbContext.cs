using HAPM.Domain.Common;
using HAPM.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace HAPM.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();
    public DbSet<Doctor> Doctors => Set<Doctor>();
    public DbSet<DoctorSchedule> DoctorSchedules => Set<DoctorSchedule>();
    public DbSet<Patient> Patients => Set<Patient>();
    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<Prescription> Prescriptions => Set<Prescription>();
    public DbSet<PrescriptionItem> PrescriptionItems => Set<PrescriptionItem>();
    public DbSet<LabReport> LabReports => Set<LabReport>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<InvoiceItem> InvoiceItems => Set<InvoiceItem>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<VitalSign> VitalSigns => Set<VitalSign>();
    public DbSet<DoctorLeave> DoctorLeaves => Set<DoctorLeave>();
    public DbSet<DoctorReview> DoctorReviews => Set<DoctorReview>();
    public DbSet<WaitlistEntry> WaitlistEntries => Set<WaitlistEntry>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<PrescriptionTemplate> PrescriptionTemplates => Set<PrescriptionTemplate>();
    public DbSet<PrescriptionTemplateItem> PrescriptionTemplateItems => Set<PrescriptionTemplateItem>();
    public DbSet<StaffMessage> StaffMessages => Set<StaffMessage>();
    public DbSet<IdempotencyRecord> IdempotencyRecords => Set<IdempotencyRecord>();
    public DbSet<AuditLogArchive> AuditLogArchives => Set<AuditLogArchive>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(b =>
        {
            b.Property(u => u.Email).HasMaxLength(256).IsRequired();
            b.HasIndex(u => u.Email).IsUnique();
            b.Property(u => u.FullName).HasMaxLength(150).IsRequired();
            b.Property(u => u.PhoneNumber).HasMaxLength(20);
            b.Property(u => u.PasswordHash).IsRequired();
        });

        modelBuilder.Entity<RefreshToken>(b =>
        {
            b.Property(t => t.Token).HasMaxLength(200).IsRequired();
            b.HasIndex(t => t.Token).IsUnique();
            b.HasOne(t => t.User).WithMany(u => u.RefreshTokens).HasForeignKey(t => t.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PasswordResetToken>(b =>
        {
            b.Property(t => t.Token).HasMaxLength(200).IsRequired();
            b.HasIndex(t => t.Token).IsUnique();
            b.HasOne(t => t.User).WithMany(u => u.PasswordResetTokens).HasForeignKey(t => t.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Doctor>(b =>
        {
            b.Property(d => d.Specialization).HasMaxLength(100).IsRequired();
            b.Property(d => d.Qualification).HasMaxLength(200).IsRequired();
            b.Property(d => d.LicenseNumber).HasMaxLength(50).IsRequired();
            b.HasIndex(d => d.LicenseNumber).IsUnique();
            b.Property(d => d.ConsultationFee).HasPrecision(12, 2);
            b.Property(d => d.RoomNumber).HasMaxLength(20);
            b.Property(d => d.Biography).HasMaxLength(2000);
            b.HasIndex(d => d.Specialization);
            b.HasOne(d => d.User).WithOne(u => u.DoctorProfile).HasForeignKey<Doctor>(d => d.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<DoctorSchedule>(b =>
        {
            b.HasOne(s => s.Doctor).WithMany(d => d.Schedules).HasForeignKey(s => s.DoctorId).OnDelete(DeleteBehavior.Cascade);
            b.HasIndex(s => new { s.DoctorId, s.DayOfWeek });
        });

        modelBuilder.Entity<Patient>(b =>
        {
            b.Property(p => p.MedicalRecordNumber).HasMaxLength(30).IsRequired();
            b.HasIndex(p => p.MedicalRecordNumber).IsUnique();
            b.Property(p => p.BloodGroup).HasMaxLength(10);
            b.Property(p => p.Address).HasMaxLength(500);
            b.Property(p => p.EmergencyContactName).HasMaxLength(150);
            b.Property(p => p.EmergencyContactPhone).HasMaxLength(20);
            b.Property(p => p.Allergies).HasMaxLength(1000);
            b.Property(p => p.ChronicConditions).HasMaxLength(1000);
            b.HasOne(p => p.User).WithOne(u => u.PatientProfile).HasForeignKey<Patient>(p => p.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Appointment>(b =>
        {
            b.Property(a => a.Reason).HasMaxLength(500).IsRequired();
            b.Property(a => a.Notes).HasMaxLength(2000);
            b.Property(a => a.CancellationReason).HasMaxLength(500);
            b.HasIndex(a => new { a.DoctorId, a.AppointmentDate });
            b.HasIndex(a => new { a.PatientId, a.AppointmentDate });
            b.HasIndex(a => a.Status);
            b.HasOne(a => a.Patient).WithMany(p => p.Appointments).HasForeignKey(a => a.PatientId).OnDelete(DeleteBehavior.Restrict);
            b.HasOne(a => a.Doctor).WithMany(d => d.Appointments).HasForeignKey(a => a.DoctorId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Prescription>(b =>
        {
            b.Property(p => p.Diagnosis).HasMaxLength(1000).IsRequired();
            b.Property(p => p.Notes).HasMaxLength(2000);
            b.HasIndex(p => p.AppointmentId).IsUnique();
            b.HasOne(p => p.Appointment).WithOne(a => a.Prescription).HasForeignKey<Prescription>(p => p.AppointmentId).OnDelete(DeleteBehavior.Cascade);
            b.HasOne(p => p.Doctor).WithMany().HasForeignKey(p => p.DoctorId).OnDelete(DeleteBehavior.Restrict);
            b.HasOne(p => p.Patient).WithMany().HasForeignKey(p => p.PatientId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<PrescriptionItem>(b =>
        {
            b.Property(i => i.MedicineName).HasMaxLength(200).IsRequired();
            b.Property(i => i.Dosage).HasMaxLength(50).IsRequired();
            b.Property(i => i.Frequency).HasMaxLength(50).IsRequired();
            b.Property(i => i.Instructions).HasMaxLength(300);
            b.HasOne(i => i.Prescription).WithMany(p => p.Items).HasForeignKey(i => i.PrescriptionId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<LabReport>(b =>
        {
            b.Property(r => r.ReportType).HasMaxLength(100).IsRequired();
            b.Property(r => r.Title).HasMaxLength(200).IsRequired();
            b.Property(r => r.FileName).HasMaxLength(260).IsRequired();
            b.Property(r => r.StoredFilePath).HasMaxLength(500).IsRequired();
            b.Property(r => r.ContentType).HasMaxLength(100).IsRequired();
            b.Property(r => r.ReviewRemarks).HasMaxLength(2000);
            b.HasIndex(r => new { r.PatientId, r.ReportType });
            b.HasOne(r => r.Patient).WithMany(p => p.LabReports).HasForeignKey(r => r.PatientId).OnDelete(DeleteBehavior.Cascade);
            b.HasOne(r => r.Doctor).WithMany().HasForeignKey(r => r.DoctorId).OnDelete(DeleteBehavior.SetNull);
            b.HasOne(r => r.Appointment).WithMany().HasForeignKey(r => r.AppointmentId).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Invoice>(b =>
        {
            b.Property(i => i.InvoiceNumber).HasMaxLength(30).IsRequired();
            b.HasIndex(i => i.InvoiceNumber).IsUnique();
            b.Property(i => i.SubTotal).HasPrecision(12, 2);
            b.Property(i => i.TaxPercent).HasPrecision(5, 2);
            b.Property(i => i.TaxAmount).HasPrecision(12, 2);
            b.Property(i => i.DiscountAmount).HasPrecision(12, 2);
            b.Property(i => i.TotalAmount).HasPrecision(12, 2);
            b.Property(i => i.Notes).HasMaxLength(1000);
            b.HasIndex(i => i.Status);
            b.HasOne(i => i.Patient).WithMany(p => p.Invoices).HasForeignKey(i => i.PatientId).OnDelete(DeleteBehavior.Restrict);
            b.HasOne(i => i.Appointment).WithOne(a => a.Invoice).HasForeignKey<Invoice>(i => i.AppointmentId).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<InvoiceItem>(b =>
        {
            b.Property(i => i.Description).HasMaxLength(300).IsRequired();
            b.Property(i => i.UnitPrice).HasPrecision(12, 2);
            b.Property(i => i.Amount).HasPrecision(12, 2);
            b.HasOne(i => i.Invoice).WithMany(inv => inv.Items).HasForeignKey(i => i.InvoiceId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Notification>(b =>
        {
            b.Property(n => n.Title).HasMaxLength(200).IsRequired();
            b.Property(n => n.Message).HasMaxLength(1000).IsRequired();
            b.HasIndex(n => new { n.UserId, n.IsRead });
            b.HasOne(n => n.User).WithMany(u => u.Notifications).HasForeignKey(n => n.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<VitalSign>(b =>
        {
            b.Property(v => v.TemperatureCelsius).HasPrecision(4, 1);
            b.Property(v => v.OxygenSaturationPercent).HasPrecision(4, 1);
            b.Property(v => v.HeightCm).HasPrecision(5, 1);
            b.Property(v => v.WeightKg).HasPrecision(5, 1);
            b.Property(v => v.Notes).HasMaxLength(1000);
            b.HasIndex(v => v.PatientId);
            b.HasOne(v => v.Appointment).WithMany().HasForeignKey(v => v.AppointmentId).OnDelete(DeleteBehavior.Cascade);
            b.HasOne(v => v.Patient).WithMany().HasForeignKey(v => v.PatientId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<DoctorLeave>(b =>
        {
            b.Property(l => l.Reason).HasMaxLength(300).IsRequired();
            b.HasIndex(l => new { l.DoctorId, l.StartDate, l.EndDate });
            b.HasOne(l => l.Doctor).WithMany(d => d.Leaves).HasForeignKey(l => l.DoctorId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<DoctorReview>(b =>
        {
            b.Property(r => r.Comment).HasMaxLength(1000);
            b.HasIndex(r => r.AppointmentId).IsUnique();
            b.HasIndex(r => r.DoctorId);
            b.HasOne(r => r.Doctor).WithMany(d => d.Reviews).HasForeignKey(r => r.DoctorId).OnDelete(DeleteBehavior.Cascade);
            b.HasOne(r => r.Patient).WithMany().HasForeignKey(r => r.PatientId).OnDelete(DeleteBehavior.Cascade);
            b.HasOne(r => r.Appointment).WithMany().HasForeignKey(r => r.AppointmentId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<WaitlistEntry>(b =>
        {
            b.Property(w => w.Notes).HasMaxLength(500);
            b.HasIndex(w => new { w.DoctorId, w.PreferredDate, w.Status });
            b.HasOne(w => w.Doctor).WithMany().HasForeignKey(w => w.DoctorId).OnDelete(DeleteBehavior.Cascade);
            b.HasOne(w => w.Patient).WithMany().HasForeignKey(w => w.PatientId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Payment>(b =>
        {
            b.Property(p => p.ReceiptNumber).HasMaxLength(30).IsRequired();
            b.HasIndex(p => p.ReceiptNumber).IsUnique();
            b.Property(p => p.Amount).HasPrecision(12, 2);
            b.Property(p => p.Notes).HasMaxLength(500);
            b.HasOne(p => p.Invoice).WithMany(i => i.Payments).HasForeignKey(p => p.InvoiceId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PrescriptionTemplate>(b =>
        {
            b.Property(t => t.Name).HasMaxLength(100).IsRequired();
            b.Property(t => t.Diagnosis).HasMaxLength(1000).IsRequired();
            b.Property(t => t.Notes).HasMaxLength(2000);
            b.HasIndex(t => new { t.DoctorId, t.Name }).IsUnique();
            b.HasOne(t => t.Doctor).WithMany().HasForeignKey(t => t.DoctorId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PrescriptionTemplateItem>(b =>
        {
            b.Property(i => i.MedicineName).HasMaxLength(200).IsRequired();
            b.Property(i => i.Dosage).HasMaxLength(50).IsRequired();
            b.Property(i => i.Frequency).HasMaxLength(50).IsRequired();
            b.Property(i => i.Instructions).HasMaxLength(300);
            b.HasOne(i => i.Template).WithMany(t => t.Items).HasForeignKey(i => i.PrescriptionTemplateId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<AuditLog>(b =>
        {
            b.Property(a => a.EntityName).HasMaxLength(100).IsRequired();
            b.Property(a => a.EntityId).HasMaxLength(50).IsRequired();
            b.Property(a => a.UserEmail).HasMaxLength(256);
            b.Property(a => a.ChangesJson).HasColumnType("jsonb").IsRequired();
            b.HasIndex(a => new { a.EntityName, a.EntityId });
            b.HasIndex(a => a.CreatedAtUtc);
        });

        modelBuilder.Entity<StaffMessage>(b =>
        {
            b.Property(m => m.Content).HasMaxLength(2000).IsRequired();
            b.HasIndex(m => new { m.Target, m.DoctorId, m.CreatedAtUtc });
            b.HasOne(m => m.Sender).WithMany().HasForeignKey(m => m.SenderUserId).OnDelete(DeleteBehavior.Restrict);
            b.HasOne(m => m.Doctor).WithMany().HasForeignKey(m => m.DoctorId).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<IdempotencyRecord>(b =>
        {
            b.Property(r => r.IdempotencyKey).HasMaxLength(128).IsRequired();
            b.Property(r => r.HttpMethod).HasMaxLength(10).IsRequired();
            b.Property(r => r.RequestPath).HasMaxLength(300).IsRequired();
            b.Property(r => r.RequestBodyHash).HasMaxLength(64).IsRequired();
            b.Property(r => r.ResponseBody).HasColumnType("text");
            b.Property(r => r.ResponseContentType).HasMaxLength(100);
            b.HasIndex(r => new { r.UserScope, r.IdempotencyKey }).IsUnique();
            b.HasIndex(r => r.ExpiresAtUtc);
        });

        modelBuilder.Entity<AuditLogArchive>(b =>
        {
            b.Property(a => a.EntityName).HasMaxLength(100).IsRequired();
            b.Property(a => a.EntityId).HasMaxLength(50).IsRequired();
            b.Property(a => a.UserEmail).HasMaxLength(256);
            b.Property(a => a.ChangesJson).HasColumnType("jsonb").IsRequired();
            b.HasIndex(a => a.SourceAuditLogId).IsUnique();
            b.HasIndex(a => a.CreatedAtUtc);
            b.HasIndex(a => a.ArchivedAtUtc);
        });
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            if (entry.State == EntityState.Modified)
                entry.Entity.UpdatedAtUtc = DateTime.UtcNow;
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
