using HAPM.Domain.Common;

namespace HAPM.Domain.Entities;

public class Doctor : BaseEntity
{
    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public string Specialization { get; set; } = null!;
    public string Qualification { get; set; } = null!;
    public string LicenseNumber { get; set; } = null!;
    public int ExperienceYears { get; set; }
    public decimal ConsultationFee { get; set; }
    public string? RoomNumber { get; set; }
    public string? Biography { get; set; }
    public bool IsAvailable { get; set; } = true;

    public ICollection<DoctorSchedule> Schedules { get; set; } = new List<DoctorSchedule>();
    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
    public ICollection<DoctorLeave> Leaves { get; set; } = new List<DoctorLeave>();
    public ICollection<DoctorReview> Reviews { get; set; } = new List<DoctorReview>();
}
