'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table';
import {
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useDebounce } from '@/hooks/use-debounce';

interface UseDataTableProps<TData, TValue> {
  data: TData[];
  columns: ColumnDef<TData, TValue>[];
  pageCount?: number;
  filterColumnName?: string;
}

export function useDataTable<TData, TValue>({
  data,
  columns,
  pageCount = -1,
  filterColumnName = 'name',
}: UseDataTableProps<TData, TValue>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Search params parsing
  const page = searchParams?.get('page') ?? '1';
  const per_page = searchParams?.get('per_page') ?? '10';
  const sort = searchParams?.get('sort');
  const [column, order] = sort?.split('.') ?? [];
  const search = searchParams?.get('search') ?? '';

  // Initial States from URL
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    search
      ? [{ id: filterColumnName, value: search }]
      : []
  );
  const [sorting, setSorting] = React.useState<SortingState>(
    column && order ? [{ id: column, desc: order === 'desc' }] : []
  );

  // Pagination state
  const [{ pageIndex, pageSize }, setPagination] = React.useState<PaginationState>({
    pageIndex: Number(page) - 1,
    pageSize: Number(per_page),
  });

  const pagination = React.useMemo(
    () => ({
      pageIndex,
      pageSize,
    }),
    [pageIndex, pageSize]
  );

  // Sync URL with State (Debounced for search)
  const debouncedSearch = useDebounce(columnFilters, 500);

  React.useEffect(() => {
    const params = new URLSearchParams(searchParams?.toString());
    
    // Pagination Params
    params.set('page', (pageIndex + 1).toString());
    params.set('per_page', pageSize.toString());

    // Sorting Params
    if (sorting.length > 0) {
      const { id, desc } = sorting[0];
      params.set('sort', `${id}.${desc ? 'desc' : 'asc'}`);
    } else {
      params.delete('sort');
    }

    // Filter Params (Search)
    const filterValue = debouncedSearch.find((f) => f.id === filterColumnName)?.value;
    if (typeof filterValue === 'string' && filterValue.length > 0) {
      params.set('search', filterValue);
    } else {
      params.delete('search');
    }

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pageIndex, pageSize, sorting, debouncedSearch, filterColumnName, pathname, router, searchParams]);

  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: {
      pagination,
      sorting,
      columnFilters,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return { table };
}
