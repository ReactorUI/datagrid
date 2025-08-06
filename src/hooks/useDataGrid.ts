import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BaseRowData,
  ServerRequest,
  ServerResponse,
  ActiveFilter,
  SortConfig,
  HttpConfig,
} from '../types';
import { createApiRequest, compareValues, sortData } from '../utils';

interface UseDataGridProps<T> {
  data?: T[];
  endpoint?: string;
  httpConfig?: HttpConfig;
  pageSize?: number;
  serverPageSize?: number;
  onDataLoad?: (data: ServerResponse<T>) => void;
}

export const useDataGrid = <T extends BaseRowData>({
  data: staticData,
  endpoint,
  httpConfig,
  pageSize = 10,
  serverPageSize = 100,
  onDataLoad,
}: UseDataGridProps<T>) => {
  // Core state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverData, setServerData] = useState<T[]>([]);

  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: '', direction: 'asc' });
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);
  const [totalRecords, setTotalRecords] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Determine data source
  const sourceData = staticData || serverData;

  // Process data (search, filter, sort)
  const processedData = useMemo(() => {
    let processed = [...sourceData];

    // Apply search
    if (searchTerm) {
      processed = processed.filter((row) =>
        Object.values(row).some((value) =>
          value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply filters
    activeFilters.forEach((filter) => {
      processed = processed.filter((row) => {
        const value = (row as any)[filter.column];
        return compareValues(value, filter.value, filter.operator, filter.dataType);
      });
    });

    // Apply sorting
    if (sortConfig.column) {
      processed = sortData(processed, sortConfig.column, sortConfig.direction);
    }

    return processed;
  }, [sourceData, searchTerm, activeFilters, sortConfig]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * currentPageSize;
    const end = start + currentPageSize;
    return processedData.slice(start, end);
  }, [processedData, currentPage, currentPageSize]);

  // Pagination info
  const paginationInfo = useMemo(() => {
    const totalPages = Math.ceil(processedData.length / currentPageSize);
    const start = processedData.length === 0 ? 0 : (currentPage - 1) * currentPageSize + 1;
    const end = Math.min(currentPage * currentPageSize, processedData.length);

    return {
      totalPages,
      start,
      end,
      hasNext: currentPage < totalPages,
      hasPrevious: currentPage > 1,
    };
  }, [processedData.length, currentPage, currentPageSize]);

  // Load server data
  const loadServerData = useCallback(async () => {
    if (!endpoint || staticData) return;

    setLoading(true);
    setError(null);

    try {
      const request: ServerRequest = {
        page: currentPage,
        pageSize: serverPageSize,
        search: searchTerm,
        sortColumn: sortConfig.column,
        sortDirection: sortConfig.direction,
        filters: activeFilters,
      };

      const response = await createApiRequest<T>(endpoint, request, httpConfig);

      setServerData(response.items);
      setTotalRecords(response.count);
      setHasMore(response.hasMore);

      onDataLoad?.(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [
    endpoint,
    staticData,
    currentPage,
    serverPageSize,
    searchTerm,
    sortConfig,
    activeFilters,
    httpConfig,
    onDataLoad,
  ]);

  // Load data on mount and when dependencies change
  useEffect(() => {
    if (!staticData) {
      loadServerData();
    }
  }, [staticData, loadServerData]);

  // Actions
  const setSort = useCallback((column: string) => {
    setSortConfig((prev) => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
    setCurrentPage(1); // Reset to first page
  }, []);

  const addFilter = useCallback((filter: Omit<ActiveFilter, 'label'>) => {
    const label = `${filter.column} ${filter.operator} "${filter.value}"`;
    setActiveFilters((prev) => [
      ...prev.filter((f) => f.column !== filter.column),
      { ...filter, label },
    ]);
    setCurrentPage(1);
  }, []);

  const removeFilter = useCallback((index: number) => {
    setActiveFilters((prev) => prev.filter((_, i) => i !== index));
    setCurrentPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setActiveFilters([]);
    setCurrentPage(1);
  }, []);

  const selectRow = useCallback((rowId: string, selected: boolean) => {
    setSelectedRows((prev) => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(rowId);
      } else {
        newSet.delete(rowId);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback(
    (selected: boolean) => {
      if (selected) {
        const allIds = paginatedData.map((row) => String(row.id)).filter(Boolean);
        setSelectedRows(new Set(allIds));
      } else {
        setSelectedRows(new Set());
      }
    },
    [paginatedData]
  );

  const refresh = useCallback(() => {
    if (staticData) {
      setSearchTerm('');
      setActiveFilters([]);
      setSortConfig({ column: '', direction: 'asc' });
      setCurrentPage(1);
    } else {
      loadServerData();
    }
  }, [staticData, loadServerData]);

  return {
    // Data
    data: sourceData,
    processedData,
    paginatedData,
    loading,
    error,

    // State
    searchTerm,
    activeFilters,
    sortConfig,
    selectedRows,
    currentPage,
    currentPageSize,
    totalRecords,
    hasMore,

    // Actions
    setSearchTerm: (term: string) => {
      setSearchTerm(term);
      setCurrentPage(1);
    },
    setSort,
    setCurrentPage,
    setCurrentPageSize: (size: number) => {
      setCurrentPageSize(size);
      setCurrentPage(1);
    },
    addFilter,
    removeFilter,
    clearFilters,
    selectRow,
    selectAll,
    refresh,

    // Computed
    paginationInfo,
    selectedData: sourceData.filter((row) => selectedRows.has(String(row.id))),
    hasSelection: selectedRows.size > 0,
  };
};
