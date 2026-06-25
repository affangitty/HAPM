import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '../../../core/api/api-client.service';
import { PagedResult } from '../../../core/api/api.models';
import { CreateReviewRequest, ReviewDto, ReviewQueryParams } from '../models/review.models';

@Injectable({ providedIn: 'root' })
export class ReviewsApiService {
  private readonly api = inject(ApiClientService);

  getById(id: number): Observable<ReviewDto> {
    return this.api.get<ReviewDto>(`/reviews/${id}`);
  }

  list(params: ReviewQueryParams): Observable<PagedResult<ReviewDto>> {
    return this.api.getPaged<ReviewDto>('/reviews', params);
  }

  create(request: CreateReviewRequest): Observable<ReviewDto> {
    return this.api.post<ReviewDto>('/reviews', request);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`/reviews/${id}`);
  }
}
