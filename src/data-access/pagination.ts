import { Pagination, PaginationParams } from '../domain/models';

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;

export function normalizePage(value: unknown, fallback = DEFAULT_PAGE): number {
  const page = Number(value);
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : fallback;
}

export function normalizeLimit(value: unknown, fallback = DEFAULT_LIMIT): number {
  const limit = Number(value);
  return Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : fallback;
}

export function buildQueryParams(params: PaginationParams = {}): URLSearchParams {
  const query = new URLSearchParams();
  query.set('page', String(normalizePage(params.page)));
  query.set('limit', String(normalizeLimit(params.limit)));

  if (params.search?.trim()) query.set('search', params.search.trim());
  if (params.sortBy?.trim()) query.set('sortBy', params.sortBy.trim());
  if (params.sortOrder) query.set('sortOrder', params.sortOrder);

  Object.entries(params.filters ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  });

  return query;
}

export function fallbackPagination<T>(data: T[], page = DEFAULT_PAGE, limit = DEFAULT_LIMIT): Pagination {
  const safeLimit = normalizeLimit(limit);
  const safePage = normalizePage(page);
  const total = data.length;
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));

  return {
    total,
    page: safePage,
    limit: safeLimit,
    totalPages,
    hasNextPage: safePage < totalPages,
    hasPreviousPage: safePage > 1,
  };
}
