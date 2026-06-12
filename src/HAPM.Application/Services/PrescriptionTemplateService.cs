using HAPM.Application.Common;
using HAPM.Application.DTOs;
using HAPM.Application.Interfaces;
using HAPM.Application.Mapping;
using HAPM.Domain.Entities;
using HAPM.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace HAPM.Application.Services;

/// <summary>
/// Doctor-owned prescription presets. Applying a template is a client-side concern:
/// the doctor fetches it, prefills the normal create-prescription request, and adjusts as needed.
/// </summary>
public class PrescriptionTemplateService : IPrescriptionTemplateService
{
    private readonly IUnitOfWork _uow;
    private readonly ICurrentUserService _currentUser;

    public PrescriptionTemplateService(IUnitOfWork uow, ICurrentUserService currentUser)
    {
        _uow = uow;
        _currentUser = currentUser;
    }

    public async Task<IReadOnlyList<PrescriptionTemplateDto>> GetMineAsync(CancellationToken ct = default)
    {
        var doctor = await GetCurrentDoctorAsync(ct);

        return await _uow.PrescriptionTemplates.Query()
            .Where(t => t.DoctorId == doctor.Id)
            .OrderBy(t => t.Name)
            .Select(Projections.PrescriptionTemplate)
            .ToListAsync(ct);
    }

    public async Task<PrescriptionTemplateDto> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var doctor = await GetCurrentDoctorAsync(ct);

        return await _uow.PrescriptionTemplates.Query()
            .Where(t => t.Id == id && t.DoctorId == doctor.Id)
            .Select(Projections.PrescriptionTemplate)
            .FirstOrDefaultAsync(ct) ?? throw new NotFoundException("Prescription template", id);
    }

    public async Task<PrescriptionTemplateDto> CreateAsync(SavePrescriptionTemplateRequest request, CancellationToken ct = default)
    {
        var doctor = await GetCurrentDoctorAsync(ct);
        var name = request.Name.Trim();

        if (await _uow.PrescriptionTemplates.Query()
                .AnyAsync(t => t.DoctorId == doctor.Id && t.Name.ToLower() == name.ToLower(), ct))
            throw new ConflictException($"You already have a template named '{name}'.");

        var template = new PrescriptionTemplate
        {
            DoctorId = doctor.Id,
            Name = name,
            Diagnosis = request.Diagnosis.Trim(),
            Notes = request.Notes,
            Items = request.Items.Select(ToItem).ToList()
        };

        await _uow.PrescriptionTemplates.AddAsync(template, ct);
        await _uow.SaveChangesAsync(ct);

        return await GetByIdAsync(template.Id, ct);
    }

    public async Task<PrescriptionTemplateDto> UpdateAsync(int id, SavePrescriptionTemplateRequest request, CancellationToken ct = default)
    {
        var doctor = await GetCurrentDoctorAsync(ct);

        var template = await _uow.PrescriptionTemplates.QueryTracked()
            .Include(t => t.Items)
            .FirstOrDefaultAsync(t => t.Id == id && t.DoctorId == doctor.Id, ct)
            ?? throw new NotFoundException("Prescription template", id);

        var name = request.Name.Trim();
        if (await _uow.PrescriptionTemplates.Query()
                .AnyAsync(t => t.Id != id && t.DoctorId == doctor.Id && t.Name.ToLower() == name.ToLower(), ct))
            throw new ConflictException($"You already have a template named '{name}'.");

        template.Name = name;
        template.Diagnosis = request.Diagnosis.Trim();
        template.Notes = request.Notes;

        template.Items.Clear();
        foreach (var item in request.Items.Select(ToItem))
            template.Items.Add(item);

        await _uow.SaveChangesAsync(ct);
        return await GetByIdAsync(id, ct);
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var doctor = await GetCurrentDoctorAsync(ct);

        var template = await _uow.PrescriptionTemplates.QueryTracked()
            .FirstOrDefaultAsync(t => t.Id == id && t.DoctorId == doctor.Id, ct)
            ?? throw new NotFoundException("Prescription template", id);

        _uow.PrescriptionTemplates.Remove(template);
        await _uow.SaveChangesAsync(ct);
    }

    // ---- helpers -------------------------------------------------------

    private static PrescriptionTemplateItem ToItem(PrescriptionItemRequest request) => new()
    {
        MedicineName = request.MedicineName.Trim(),
        Dosage = request.Dosage.Trim(),
        Frequency = request.Frequency.Trim(),
        DurationDays = request.DurationDays,
        Instructions = request.Instructions
    };

    private async Task<Doctor> GetCurrentDoctorAsync(CancellationToken ct)
    {
        if (_currentUser.Role != UserRole.Doctor)
            throw new ForbiddenException("Only doctors can manage prescription templates.");

        return await _uow.Doctors.Query()
            .FirstOrDefaultAsync(d => d.UserId == _currentUser.UserId, ct)
            ?? throw new NotFoundException("No doctor profile exists for the current user.");
    }
}
