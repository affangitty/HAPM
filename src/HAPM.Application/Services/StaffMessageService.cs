using HAPM.Application.Common;
using HAPM.Application.DTOs;
using HAPM.Application.Interfaces;
using HAPM.Application.Mapping;
using HAPM.Domain.Entities;
using HAPM.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace HAPM.Application.Services;

public class StaffMessageService : IStaffMessageService
{
    private readonly IUnitOfWork _uow;
    private readonly ICurrentUserService _currentUser;
    private readonly IStaffMessageDispatcher _dispatcher;

    public StaffMessageService(IUnitOfWork uow, ICurrentUserService currentUser, IStaffMessageDispatcher dispatcher)
    {
        _uow = uow;
        _currentUser = currentUser;
        _dispatcher = dispatcher;
    }

    public async Task<PagedResult<StaffMessageDto>> GetPagedAsync(StaffMessageQueryParams query, CancellationToken ct = default)
    {
        EnsureStaffAccess();

        var messages = _uow.StaffMessages.Query();

        if (query.Target.HasValue)
            messages = messages.Where(m => m.Target == query.Target.Value);

        if (query.DoctorId.HasValue)
            messages = messages.Where(m => m.DoctorId == query.DoctorId.Value);

        if (_currentUser.Role == UserRole.Doctor)
        {
            var doctorId = await GetCurrentDoctorIdAsync(ct);
            messages = messages.Where(m =>
                m.Target == StaffMessageTarget.StaffBroadcast ||
                (m.Target == StaffMessageTarget.DoctorRoom && m.DoctorId == doctorId));
        }

        return await messages
            .OrderByDescending(m => m.CreatedAtUtc)
            .Select(Projections.StaffMessage)
            .ToPagedResultAsync(query.Page, query.PageSize, ct);
    }

    public async Task<StaffMessageDto> SendToDoctorAsync(SendDoctorMessageRequest request, CancellationToken ct = default)
    {
        EnsureCanSendToDoctor();

        var doctor = await _uow.Doctors.Query()
            .Include(d => d.User)
            .FirstOrDefaultAsync(d => d.Id == request.DoctorId, ct)
            ?? throw new NotFoundException("Doctor", request.DoctorId);

        var senderId = _currentUser.UserId ?? throw new UnauthorizedException();

        var message = new StaffMessage
        {
            SenderUserId = senderId,
            Target = StaffMessageTarget.DoctorRoom,
            DoctorId = doctor.Id,
            Content = request.Content.Trim()
        };

        await _uow.StaffMessages.AddAsync(message, ct);
        await _uow.SaveChangesAsync(ct);

        var dto = await GetDtoAsync(message.Id, ct);
        await _dispatcher.DeliverAsync(dto, ct);
        return dto;
    }

    public async Task<StaffMessageDto> BroadcastToStaffAsync(BroadcastStaffMessageRequest request, CancellationToken ct = default)
    {
        if (_currentUser.Role != UserRole.Admin)
            throw new ForbiddenException("Only administrators can broadcast to all staff.");

        var senderId = _currentUser.UserId ?? throw new UnauthorizedException();

        var message = new StaffMessage
        {
            SenderUserId = senderId,
            Target = StaffMessageTarget.StaffBroadcast,
            Content = request.Content.Trim()
        };

        await _uow.StaffMessages.AddAsync(message, ct);
        await _uow.SaveChangesAsync(ct);

        var dto = await GetDtoAsync(message.Id, ct);
        await _dispatcher.DeliverAsync(dto, ct);
        return dto;
    }

    private async Task<StaffMessageDto> GetDtoAsync(int id, CancellationToken ct) =>
        await _uow.StaffMessages.Query()
            .Where(m => m.Id == id)
            .Select(Projections.StaffMessage)
            .FirstAsync(ct);

    private async Task<int> GetCurrentDoctorIdAsync(CancellationToken ct)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedException();
        return await _uow.Doctors.Query()
            .Where(d => d.UserId == userId)
            .Select(d => d.Id)
            .FirstOrDefaultAsync(ct) is int id and > 0
            ? id
            : throw new ForbiddenException("Doctor profile not found.");
    }

    private void EnsureStaffAccess()
    {
        if (_currentUser.Role is not (UserRole.Admin or UserRole.Receptionist or UserRole.Doctor))
            throw new ForbiddenException("Staff access required.");
    }

    private void EnsureCanSendToDoctor()
    {
        if (_currentUser.Role is not (UserRole.Admin or UserRole.Receptionist))
            throw new ForbiddenException("Only reception or admin can message doctors directly.");
    }
}
