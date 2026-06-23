import { PagedResult, PaginationParams } from './api.models';
import { DEFAULT_PAGE_SIZE, PaginationState } from '../../shared/models/pagination.model';

/** Normalizes backend pagination aliases into a consistent shape. */
export function normalizePagedResult<T>(result: PagedResult<T>): PagedResult<T> {
  return {
    ...result,
    hasNext: result.hasNext ?? result.hasNextPage ?? false,
    hasPrevious: result.hasPrevious ?? result.hasPreviousPage ?? false,
  };
}

export function toPaginationState(result: PagedResult<unknown>): PaginationState {
  const normalized = normalizePagedResult(result);
  return {
    page: normalized.page,
    pageSize: normalized.pageSize,
    totalCount: normalized.totalCount,
    totalPages: normalized.totalPages,
  };
}

export function createPaginationParams(
  page: number,
  pageSize = DEFAULT_PAGE_SIZE,
  extras: Omit<PaginationParams, 'page' | 'pageSize'> = {},
): PaginationParams {
  return { page, pageSize, ...extras };
}

export function nextPage(current: number, result: PagedResult<unknown>): number {
  const normalized = normalizePagedResult(result);
  return normalized.hasNext ? current + 1 : current;
}

export function previousPage(current: number, result: PagedResult<unknown>): number {
  const normalized = normalizePagedResult(result);
  return normalized.hasPrevious ? Math.max(1, current - 1) : current;
}
