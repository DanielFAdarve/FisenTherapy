import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Pagination, PaginationParams, PaginatedResult } from '../domain/models';
import { DEFAULT_LIMIT, DEFAULT_PAGE, normalizeLimit, normalizePage } from '../data-access/pagination';

interface UsePaginatedResourceOptions<T> {
  fetcher: (params: PaginationParams, signal?: AbortSignal) => Promise<PaginatedResult<T>>;
  defaultLimit?: number;
  debounceMs?: number;
  paramPrefix?: string;
}

export function usePaginatedResource<T>({
  fetcher,
  defaultLimit = DEFAULT_LIMIT,
  debounceMs = 350,
  paramPrefix = '',
}: UsePaginatedResourceOptions<T>) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<T[]>([]);
  const [pagination, setPagination] = useState<Pagination | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const key = useCallback((name: string) => `${paramPrefix}${name}`, [paramPrefix]);

  const page = normalizePage(searchParams.get(key('page')) ?? DEFAULT_PAGE);
  const limit = normalizeLimit(searchParams.get(key('limit')) ?? defaultLimit, defaultLimit);
  const search = searchParams.get(key('search')) ?? '';
  const sortBy = searchParams.get(key('sortBy')) ?? undefined;
  const sortOrderParam = searchParams.get(key('sortOrder'));
  const sortOrder = sortOrderParam === 'asc' || sortOrderParam === 'desc' ? sortOrderParam : undefined;

  const requestParams = useMemo<PaginationParams>(() => ({ page, limit, search, sortBy, sortOrder }), [page, limit, search, sortBy, sortOrder]);

  const updateParams = useCallback((next: Partial<PaginationParams>) => {
    setSearchParams((current) => {
      const params = new URLSearchParams(current);
      const nextPage = next.page ?? (next.search !== undefined || next.limit !== undefined ? DEFAULT_PAGE : page);
      params.set(key('page'), String(normalizePage(nextPage)));
      params.set(key('limit'), String(normalizeLimit(next.limit ?? limit, defaultLimit)));

      const nextSearch = next.search ?? search;
      if (nextSearch?.trim()) params.set(key('search'), nextSearch.trim());
      else params.delete(key('search'));

      const nextSortBy = next.sortBy ?? sortBy;
      if (nextSortBy?.trim()) params.set(key('sortBy'), nextSortBy.trim());
      else params.delete(key('sortBy'));

      const nextSortOrder = next.sortOrder ?? sortOrder;
      if (nextSortOrder) params.set(key('sortOrder'), nextSortOrder);
      else params.delete(key('sortOrder'));

      Object.entries(next.filters ?? {}).forEach(([filterKey, value]) => {
        if (value !== undefined && value !== null && value !== '') params.set(filterKey, String(value));
        else params.delete(filterKey);
      });

      return params;
    }, { replace: true });
  }, [defaultLimit, key, limit, page, search, setSearchParams, sortBy, sortOrder]);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);

    try {
      const result = await fetcher(requestParams, controller.signal);
      setData(result.data);
      setPagination(result.pagination);
    } catch (err: any) {
      if (err?.name === 'CanceledError' || err?.name === 'AbortError') return;
      setError(err?.message || 'Error al cargar datos');
      setData([]);
      setPagination(undefined);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [fetcher, requestParams]);

  useEffect(() => {
    const timeout = window.setTimeout(load, search ? debounceMs : 0);
    return () => {
      window.clearTimeout(timeout);
      abortRef.current?.abort();
    };
  }, [debounceMs, load, search]);

  return {
    data,
    pagination,
    loading,
    error,
    page,
    limit,
    search,
    sortBy,
    sortOrder,
    setPage: (value: number) => updateParams({ page: value }),
    setLimit: (value: number) => updateParams({ limit: value }),
    setSearch: (value: string) => updateParams({ search: value }),
    setSorting: (nextSortBy?: string, nextSortOrder?: 'asc' | 'desc') => updateParams({ sortBy: nextSortBy, sortOrder: nextSortOrder }),
    setFilters: (filters: PaginationParams['filters']) => updateParams({ filters }),
    refresh: load,
  };
}
