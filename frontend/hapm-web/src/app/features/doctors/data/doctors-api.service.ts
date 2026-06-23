import { Injectable, inject } from '@angular/core';
import { map, Observable, switchMap, throwError } from 'rxjs';
import { ApiClientService } from '../../../core/api/api-client.service';
import { PagedResult } from '../../../core/api/api.models';
import { AuthService } from '../../../core/auth/auth.service';
import {
  AvailableSlotDto,
  CreateDoctorLeaveRequest,
  CreateDoctorRequest,
  DoctorDto,
  DoctorLeaveDto,
  DoctorPerformanceDto,
  DoctorQueryParams,
  DoctorScheduleDto,
  ReviewDto,
  ReviewQueryParams,
  ScheduleSlotRequest,
  UpdateDoctorRequest,
  UpdateOwnDoctorProfileRequest,
} from '../models/doctor.models';

@Injectable({ providedIn: 'root' })
export class DoctorsApiService {
  private readonly api = inject(ApiClientService);
  private readonly auth = inject(AuthService);

  list(params: DoctorQueryParams): Observable<PagedResult<DoctorDto>> {
    return this.api.getPaged<DoctorDto>('/doctors', params);
  }

  getById(id: number): Observable<DoctorDto> {
    return this.api.get<DoctorDto>(`/doctors/${id}`);
  }

  getSpecializations(): Observable<string[]> {
    return this.api.get<string[]>('/doctors/specializations');
  }

  getSchedules(id: number): Observable<DoctorScheduleDto[]> {
    return this.api.get<DoctorScheduleDto[]>(`/doctors/${id}/schedules`);
  }

  setSchedules(id: number, slots: ScheduleSlotRequest[]): Observable<DoctorScheduleDto[]> {
    return this.api.put<DoctorScheduleDto[]>(`/doctors/${id}/schedules`, slots);
  }

  getAvailableSlots(id: number, date: string): Observable<AvailableSlotDto[]> {
    return this.api.get<AvailableSlotDto[]>(`/doctors/${id}/available-slots`, { date });
  }

  getPerformance(id: number): Observable<DoctorPerformanceDto> {
    return this.api.get<DoctorPerformanceDto>(`/doctors/${id}/performance`);
  }

  getLeaves(id: number): Observable<DoctorLeaveDto[]> {
    return this.api.get<DoctorLeaveDto[]>(`/doctors/${id}/leaves`);
  }

  createLeave(id: number, request: CreateDoctorLeaveRequest): Observable<DoctorLeaveDto> {
    return this.api.post<DoctorLeaveDto>(`/doctors/${id}/leaves`, request);
  }

  deleteLeave(doctorId: number, leaveId: number): Observable<void> {
    return this.api.delete<void>(`/doctors/${doctorId}/leaves/${leaveId}`);
  }

  getReviews(params: ReviewQueryParams): Observable<PagedResult<ReviewDto>> {
    return this.api.getPaged<ReviewDto>('/reviews', params);
  }

  create(request: CreateDoctorRequest): Observable<DoctorDto> {
    return this.api.post<DoctorDto>('/doctors', request);
  }

  update(id: number, request: UpdateDoctorRequest): Observable<DoctorDto> {
    return this.api.put<DoctorDto>(`/doctors/${id}`, request);
  }

  updateOwnProfile(id: number, request: UpdateOwnDoctorProfileRequest): Observable<DoctorDto> {
    return this.api.put<DoctorDto>(`/doctors/${id}/profile`, request);
  }

  deactivate(id: number): Observable<void> {
    return this.api.delete<void>(`/doctors/${id}`);
  }

  resolveCurrentDoctorId(): Observable<number> {
    const email = this.auth.user()?.email;
    if (!email) {
      return throwError(() => new Error('Not authenticated'));
    }

    return this.list({ search: email, pageSize: 20 }).pipe(
      map((result) => {
        const match = result.items.find((d) => d.email.toLowerCase() === email.toLowerCase());
        if (!match) {
          throw new Error('Doctor profile not found for the current user.');
        }
        return match.id;
      }),
    );
  }

  getCurrentDoctor(): Observable<DoctorDto> {
    return this.resolveCurrentDoctorId().pipe(switchMap((id) => this.getById(id)));
  }
}
