import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BaseRowData,
  ServerRequest,
  ServerResponse,
  ActiveFilter,
  SortConfig,
  HttpConfig,
  PaginationInfo,
} from '../types';
import { createApiRequest, compareValues, sortData } from '../utils';

interface UseDataGridProps<T> {
  data?: T[];
  endpoint?: string;
  httpConfig?: HttpConfig;
  pageSize?: number;
  serverPageSize?: number;
  onDataLoad?: (data: ServerResponse<T>) => void;
  onDataError?: (error: Error, context: string) => void;
  onLoadingStateChange?: (loading: boolean, context: string) => void;
  onPageChange?: (page: number, paginationInfo: PaginationInfo) => void;
  onPageSizeChange?: (pageSize: number, paginationInfo: PaginationInfo) => void;
  onSortChange?: (sortConfig: SortConfig) => void;
  onFilterChange?: (filters: ActiveFilter[]) => void;
  onSearchChange?: (searchTerm: string) => void;
}

export const useDataGrid = <T extends BaseRowData>({
  data: staticData,
  endpoint,
  httpConfig,
  pageSize = 10,
  serverPageSize = 100,
  onDataLoad,
  onDataError,
  onLoadingStateChange,
  onPageChange,
  onPageSizeChange,
  onSortChange,
  onFilterChange,
  onSearchChange,
}: UseDataGridProps<T>) => {
  // Core state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverData, setServerData] = useState<T[]>([]);
  const [lastServerResponse, setLastServerResponse] = useState<ServerResponse<T> | null>(null);

  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: '', direction: 'asc' });
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);
  const [continuationToken, setContinuationToken] = useState<string | undefined>();
  const [tokenHistory, setTokenHistory] = useState<string[]>([]);

  // Determine data source
  const sourceData = staticData || serverData;

  // Generate stable unique IDs for rows - always generate, never use existing fields
  const rowIdMap = useMemo(() => {
    const map = new Map<any, string>();
    sourceData.forEach((row, index) => {
      // Always generate a stable ID based on index and content hash
      const contentHash = JSON.stringify(row)
        .slice(0, 50)
        .replace(/[^a-zA-Z0-9]/g, '');
      const stableId = `row-${index}-${contentHash}`;
      map.set(row, stableId);
    });
    return map;
  }, [sourceData]);

  // Helper function to get row ID - always uses generated IDs
  const getRowId = useCallback(
    (row: T): string => {
      return rowIdMap.get(row) || `fallback-${Math.random().toString(36).substr(2, 9)}`;
    },
    [rowIdMap]
  );

  // Internal loading state handler
  const handleLoadingChange = useCallback(
    (newLoading: boolean, context: string) => {
      setLoading(newLoading);
      onLoadingStateChange?.(newLoading, context);
    },
    [onLoadingStateChange]
  );

  // Internal error handler
  const handleError = useCallback(
    (err: Error, context: string) => {
      const errorMessage = err.message || 'An unknown error occurred';
      setError(errorMessage);
      onDataError?.(err, context);
    },
    [onDataError]
  );

  // Process data (search, filter, sort) - sorting is ALWAYS client-side
  const processedData = useMemo(() => {
    let processed = [...sourceData];

    // Apply search (client-side for static data)
    if (searchTerm && staticData) {
      processed = processed.filter((row) =>
        Object.values(row).some((value) =>
          value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply filters (client-side for static data)
    if (staticData) {
      activeFilters.forEach((filter) => {
        processed = processed.filter((row) => {
          const value = (row as any)[filter.column];
          return compareValues(value, filter.value, filter.operator, filter.dataType);
        });
      });
    }

    // Apply sorting (ALWAYS client-side)
    if (sortConfig.column) {
      processed = sortData(processed, sortConfig.column, sortConfig.direction);
    }

    return processed;
  }, [sourceData, searchTerm, activeFilters, sortConfig, staticData]);

  // Paginate data - only for client-side data
  const paginatedData = useMemo(() => {
    if (!staticData) return sourceData; // For server-side, return as-is

    const start = (currentPage - 1) * currentPageSize;
    const end = start + currentPageSize;
    return processedData.slice(start, end);
  }, [processedData, currentPage, currentPageSize, staticData, sourceData]);

  // Memoize selectedData with proper dependencies and stable ID handling
  const selectedData = useMemo(() => {
    return sourceData.filter((row) => {
      const rowId = getRowId(row);
      return selectedRows.has(rowId);
    });
  }, [sourceData, selectedRows, getRowId]);

  // Pagination info
  const paginationInfo = useMemo((): PaginationInfo => {
    if (!staticData && lastServerResponse) {
      // Server-side pagination info
      const displayedCount = sourceData.length;
      const start = displayedCount === 0 ? 0 : 1;
      const end = displayedCount;

      return {
        currentPage,
        totalPages: 1, // Not meaningful with continuation tokens
        pageSize: currentPageSize,
        totalRecords: lastServerResponse.Count,
        start,
        end,
        hasNext: lastServerResponse.HasMore,
        hasPrevious: tokenHistory.length > 0,
        continuationToken: lastServerResponse.ContinuationToken,
      };
    }

    // Client-side pagination info
    const totalPages = Math.ceil(processedData.length / currentPageSize);
    const start = processedData.length === 0 ? 0 : (currentPage - 1) * currentPageSize + 1;
    const end = Math.min(currentPage * currentPageSize, processedData.length);

    return {
      currentPage,
      totalPages,
      pageSize: currentPageSize,
      totalRecords: processedData.length,
      start,
      end,
      hasNext: currentPage < totalPages,
      hasPrevious: currentPage > 1,
    };
  }, [
    processedData.length,
    currentPage,
    currentPageSize,
    staticData,
    sourceData,
    lastServerResponse,
    tokenHistory.length,
  ]);

  // Load server data
  const loadServerData = useCallback(
    async (resetPagination = false, navigationDirection?: 'next' | 'previous') => {
      if (!endpoint || staticData) return;

      handleLoadingChange(true, 'data-load');
      setError(null);

      try {
        let requestToken = continuationToken;

        // Handle navigation
        if (resetPagination) {
          requestToken = undefined;
          setContinuationToken(undefined);
          setTokenHistory([]);
          setCurrentPage(1);
        } else if (navigationDirection === 'previous' && tokenHistory.length > 0) {
          // Go back to previous token
          const newHistory = [...tokenHistory];
          requestToken = newHistory.pop();
          setTokenHistory(newHistory);
          setContinuationToken(requestToken);
        }

        const request: ServerRequest = {
          page: currentPage,
          pageSize: serverPageSize,
          search: searchTerm,
          filters: activeFilters,
          continuationToken: requestToken,
        };

        const response = await createApiRequest<T>(endpoint, request, httpConfig);

        // Handle response
        setServerData(response.Items);
        setLastServerResponse(response);

        // Update token for next navigation
        if (navigationDirection === 'next' && continuationToken) {
          // Save current token to history
          setTokenHistory((prev) => [...prev, continuationToken]);
        }

        if (response.ContinuationToken) {
          setContinuationToken(response.ContinuationToken);
        }

        onDataLoad?.(response);
      } catch (err) {
        handleError(err instanceof Error ? err : new Error('Failed to load data'), 'data-load');
      } finally {
        handleLoadingChange(false, 'data-load');
      }
    },
    [
      endpoint,
      staticData,
      currentPage,
      serverPageSize,
      searchTerm,
      sortConfig,
      activeFilters,
      continuationToken,
      tokenHistory,
      httpConfig,
      onDataLoad,
      handleLoadingChange,
      handleError,
    ]
  );

  // Load data on mount and when dependencies change (no sorting here - that's client-side)
  useEffect(() => {
    if (!staticData) {
      loadServerData(true); // Reset pagination on mount
    }
  }, [staticData, searchTerm, activeFilters]); // Note: sortConfig removed - sorting is client-side only

  // Actions
  const setSort = useCallback(
    (column: string) => {
      const newSortConfig: SortConfig = {
        column,
        direction: sortConfig.column === column && sortConfig.direction === 'asc' ? 'desc' : 'asc',
      };

      setSortConfig(newSortConfig);
      onSortChange?.(newSortConfig);

      // No server reload needed - sorting is client-side only
      if (staticData) {
        setCurrentPage(1);
      }
    },
    [sortConfig, onSortChange, staticData]
  );

  const setPage = useCallback(
    (page: number) => {
      if (staticData) {
        // Client-side pagination
        setCurrentPage(page);
        onPageChange?.(page, {
          ...paginationInfo,
          currentPage: page,
        });
      } else {
        // Server-side with continuation tokens doesn't support arbitrary page jumps
        console.warn(
          'Direct page navigation not supported with continuation tokens. Use navigateNext/navigatePrevious instead.'
        );
      }
    },
    [staticData, paginationInfo, onPageChange]
  );

  const navigateNext = useCallback(() => {
    if (!paginationInfo.hasNext) return;

    if (!staticData) {
      // Server-side navigation
      loadServerData(false, 'next');
    } else {
      // Client-side navigation
      setPage(currentPage + 1);
    }
  }, [paginationInfo.hasNext, staticData, loadServerData, setPage, currentPage]);

  const navigatePrevious = useCallback(() => {
    if (!paginationInfo.hasPrevious) return;

    if (!staticData) {
      // Server-side navigation
      loadServerData(false, 'previous');
    } else {
      // Client-side navigation
      setPage(currentPage - 1);
    }
  }, [paginationInfo.hasPrevious, staticData, loadServerData, setPage, currentPage]);

  const setPageSize = useCallback(
    (newPageSize: number) => {
      setCurrentPageSize(newPageSize);
      setCurrentPage(1);

      const newPaginationInfo: PaginationInfo = {
        ...paginationInfo,
        pageSize: newPageSize,
        currentPage: 1,
        totalPages: staticData ? Math.ceil(processedData.length / newPageSize) : 1,
      };

      onPageSizeChange?.(newPageSize, newPaginationInfo);

      // Reset pagination for server-side
      if (!staticData) {
        setContinuationToken(undefined);
        setTokenHistory([]);
        loadServerData(true);
      }
    },
    [paginationInfo, staticData, processedData.length, onPageSizeChange, loadServerData]
  );

  const updateSearchTerm = useCallback(
    (term: string) => {
      setSearchTerm(term);
      onSearchChange?.(term);

      // Reset pagination when search changes
      setCurrentPage(1);
      if (!staticData) {
        setContinuationToken(undefined);
        setTokenHistory([]);
      }
    },
    [onSearchChange, staticData]
  );

  const addFilter = useCallback(
    (filter: Omit<ActiveFilter, 'label'>) => {
      const label = `${filter.column} ${filter.operator} "${filter.value}"`;
      const newFilters = [
        ...activeFilters.filter((f) => f.column !== filter.column),
        { ...filter, label },
      ];

      setActiveFilters(newFilters);
      onFilterChange?.(newFilters);

      // Reset pagination when filters change
      setCurrentPage(1);
      if (!staticData) {
        setContinuationToken(undefined);
        setTokenHistory([]);
      }
    },
    [activeFilters, onFilterChange, staticData]
  );

  const removeFilter = useCallback(
    (index: number) => {
      const newFilters = activeFilters.filter((_, i) => i !== index);
      setActiveFilters(newFilters);
      onFilterChange?.(newFilters);

      // Reset pagination when filters change
      setCurrentPage(1);
      if (!staticData) {
        setContinuationToken(undefined);
        setTokenHistory([]);
      }
    },
    [activeFilters, onFilterChange, staticData]
  );

  const clearFilters = useCallback(() => {
    setActiveFilters([]);
    onFilterChange?.([]);

    // Reset pagination when filters change
    setCurrentPage(1);
    if (!staticData) {
      setContinuationToken(undefined);
      setTokenHistory([]);
    }
  }, [onFilterChange, staticData]);

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
        const currentPageData = staticData ? paginatedData : sourceData;
        const allIds = currentPageData.map(getRowId);
        setSelectedRows(new Set(allIds));
      } else {
        setSelectedRows(new Set());
      }
    },
    [staticData, paginatedData, sourceData, getRowId]
  );

  const refresh = useCallback(() => {
    if (staticData) {
      setSearchTerm('');
      setActiveFilters([]);
      setSortConfig({ column: '', direction: 'asc' });
      setCurrentPage(1);
    } else {
      loadServerData(true);
    }
  }, [staticData, loadServerData]);

  return {
    // Data
    data: sourceData,
    processedData,
    paginatedData: staticData ? paginatedData : sourceData,
    loading,
    error,

    // State
    searchTerm,
    activeFilters,
    sortConfig,
    selectedRows,
    currentPage,
    currentPageSize,
    totalRecords: paginationInfo.totalRecords,
    hasMore: paginationInfo.hasNext,
    continuationToken: paginationInfo.continuationToken,

    // Actions
    setSearchTerm: updateSearchTerm,
    setSort,
    setCurrentPage: setPage,
    setCurrentPageSize: setPageSize,
    navigateNext,
    navigatePrevious,
    addFilter,
    removeFilter,
    clearFilters,
    selectRow,
    selectAll,
    refresh,

    // Computed
    paginationInfo,
    selectedData,
    hasSelection: selectedRows.size > 0,
    getRowId, // Export the helper function
  };
};
