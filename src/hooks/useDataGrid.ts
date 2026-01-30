// File: src/hooks/useDataGrid.ts

import { useState, useCallback, useMemo, useEffect } from 'react';
import { BaseRowData, ActiveFilter, SortConfig, PaginationInfo } from '../types';
import { compareValues, sortData } from '../utils';

// ============================================================================
// Hook Props - Simplified, no HTTP concerns
// ============================================================================

interface UseDataGridProps<T> {
  data: T[];
  pageSize?: number;

  // External state for controlled mode (server-side pagination)
  totalRecords?: number;
  currentPage?: number;
  loading?: boolean;

  /**
   * Filter behavior mode:
   * - 'client' (default): Filters locally, no onApplyFilter callback
   * - 'server': No local filtering, only fires onApplyFilter
   * - 'client&server': Filters locally AND fires onApplyFilter
   */
  filterMode?: 'client' | 'server' | 'client&server';

  // Callbacks
  onPageChange?: (page: number, info: PaginationInfo) => void;
  onPageSizeChange?: (size: number) => void;
  onSortChange?: (config: SortConfig) => void;
  onSearchChange?: (term: string) => void;
  onApplyFilter?: (filter: ActiveFilter, all: ActiveFilter[]) => void;
  onRemoveFilter?: (removed: ActiveFilter, remaining: ActiveFilter[]) => void;
  onClearFilters?: () => void;
  onFilterChange?: (filters: ActiveFilter[]) => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export const useDataGrid = <T extends BaseRowData>({
  data,
  pageSize = 10,
  totalRecords: externalTotalRecords,
  currentPage: externalCurrentPage,
  loading: externalLoading = false,
  filterMode = 'client',
  onPageChange,
  onPageSizeChange,
  onSortChange,
  onSearchChange,
  onApplyFilter,
  onRemoveFilter,
  onClearFilters,
  onFilterChange,
}: UseDataGridProps<T>) => {
  // ===== Internal State =====
  const [searchTerm, setSearchTermState] = useState('');
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: '', direction: 'asc' });
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [internalPage, setInternalPage] = useState(1);
  const [currentPageSize, setCurrentPageSizeState] = useState(pageSize);

  // ===== Sync pageSize prop with internal state =====
  // This ensures the component responds to prop changes from parent
  useEffect(() => {
    setCurrentPageSizeState(pageSize);
  }, [pageSize]);

  // Determine if we're in controlled mode (server-side) or uncontrolled (client-side)
  const isControlled = externalTotalRecords !== undefined;
  const currentPage = externalCurrentPage ?? internalPage;

  // ===== Row ID Generation =====
  const rowIdMap = useMemo(() => {
    const map = new Map<T, string>();
    data.forEach((row, index) => {
      // Use existing id if available, otherwise generate stable ID
      const id =
        row.id !== undefined
          ? String(row.id)
          : `row-${index}-${JSON.stringify(row)
              .slice(0, 30)
              .replace(/[^a-zA-Z0-9]/g, '')}`;
      map.set(row, id);
    });
    return map;
  }, [data]);

  const getRowId = useCallback(
    (row: T): string => {
      return rowIdMap.get(row) || `fallback-${Math.random().toString(36).substr(2, 9)}`;
    },
    [rowIdMap]
  );

  // ===== Data Processing (Client-side only) =====
  const processedData = useMemo(() => {
    // Determine if we should filter locally
    const shouldFilterLocally = filterMode === 'client' || filterMode === 'client&server';

    if (isControlled && filterMode === 'server') {
      // Server mode with controlled data - parent handles everything, just sort
      return sortConfig.column ? sortData(data, sortConfig.column, sortConfig.direction) : data;
    }

    let result = [...data];

    // Search (always client-side for now)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((row) =>
        Object.values(row).some((value) => value?.toString().toLowerCase().includes(term))
      );
    }

    // Filters - only apply locally if filterMode allows
    if (shouldFilterLocally) {
      activeFilters.forEach((filter) => {
        result = result.filter((row) => {
          const value = (row as any)[filter.column];
          return compareValues(value, filter.value, filter.operator, filter.dataType);
        });
      });
    }

    // Sort
    if (sortConfig.column) {
      result = sortData(result, sortConfig.column, sortConfig.direction);
    }

    return result;
  }, [data, searchTerm, activeFilters, sortConfig, isControlled, filterMode]);

  // ===== Pagination =====
  const paginatedData = useMemo(() => {
    if (isControlled) return data; // Parent handles pagination

    const start = (currentPage - 1) * currentPageSize;
    return processedData.slice(start, start + currentPageSize);
  }, [processedData, currentPage, currentPageSize, isControlled, data]);

  // ===== Pagination Info =====
  const paginationInfo = useMemo((): PaginationInfo => {
    const total = isControlled ? (externalTotalRecords ?? 0) : processedData.length;
    const totalPages = Math.ceil(total / currentPageSize) || 1;
    const start = total === 0 ? 0 : (currentPage - 1) * currentPageSize + 1;
    const end = Math.min(currentPage * currentPageSize, total);

    return {
      currentPage,
      totalPages,
      pageSize: currentPageSize,
      totalRecords: total,
      start,
      end,
      hasNext: currentPage < totalPages,
      hasPrevious: currentPage > 1,
    };
  }, [processedData, currentPage, currentPageSize, isControlled, externalTotalRecords]);

  // ===== Selection =====
  const selectedData = useMemo(() => {
    return data.filter((row) => selectedRows.has(getRowId(row)));
  }, [data, selectedRows, getRowId]);

  // ===== Actions =====
  const setSearchTerm = useCallback(
    (term: string) => {
      setSearchTermState(term);
      if (!isControlled) setInternalPage(1);
      onSearchChange?.(term);
    },
    [isControlled, onSearchChange]
  );

  const setSort = useCallback(
    (column: string) => {
      const newConfig: SortConfig = {
        column,
        direction: sortConfig.column === column && sortConfig.direction === 'asc' ? 'desc' : 'asc',
      };
      setSortConfig(newConfig);
      if (!isControlled) setInternalPage(1);
      onSortChange?.(newConfig);
    },
    [sortConfig, isControlled, onSortChange]
  );

  const setCurrentPage = useCallback(
    (page: number) => {
      if (!isControlled) setInternalPage(page);
      onPageChange?.(page, { ...paginationInfo, currentPage: page });
    },
    [isControlled, paginationInfo, onPageChange]
  );

  const setCurrentPageSize = useCallback(
    (size: number) => {
      setCurrentPageSizeState(size);
      if (!isControlled) setInternalPage(1); // Reset to page 1 when page size changes
      onPageSizeChange?.(size);
    },
    [isControlled, onPageSizeChange]
  );

  const navigateNext = useCallback(() => {
    if (paginationInfo.hasNext) {
      setCurrentPage(currentPage + 1);
    }
  }, [paginationInfo.hasNext, currentPage, setCurrentPage]);

  const navigatePrevious = useCallback(() => {
    if (paginationInfo.hasPrevious) {
      setCurrentPage(currentPage - 1);
    }
  }, [paginationInfo.hasPrevious, currentPage, setCurrentPage]);

  // ===== Filter Actions (Enhanced) =====
  const addFilter = useCallback(
    (filter: Omit<ActiveFilter, 'label'>) => {
      const label = `${filter.column} ${filter.operator} "${filter.value}"`;
      const fullFilter: ActiveFilter = { ...filter, label };

      // Replace existing filter on same column or add new
      const newFilters = [...activeFilters.filter((f) => f.column !== filter.column), fullFilter];

      setActiveFilters(newFilters);
      if (!isControlled) setInternalPage(1);

      // Fire callbacks only for 'server' or 'client&server' modes
      if (filterMode !== 'client') {
        onApplyFilter?.(fullFilter, newFilters);
        onFilterChange?.(newFilters);
      }
    },
    [activeFilters, isControlled, filterMode, onApplyFilter, onFilterChange]
  );

  const removeFilter = useCallback(
    (index: number) => {
      const removed = activeFilters[index];
      const newFilters = activeFilters.filter((_, i) => i !== index);

      setActiveFilters(newFilters);
      if (!isControlled) setInternalPage(1);

      // Fire callbacks only for 'server' or 'client&server' modes
      if (filterMode !== 'client') {
        if (removed) onRemoveFilter?.(removed, newFilters);
        onFilterChange?.(newFilters);
      }
    },
    [activeFilters, isControlled, filterMode, onRemoveFilter, onFilterChange]
  );

  const clearFilters = useCallback(() => {
    setActiveFilters([]);
    if (!isControlled) setInternalPage(1);

    // Fire callbacks only for 'server' or 'client&server' modes
    if (filterMode !== 'client') {
      onClearFilters?.();
      onFilterChange?.([]);
    }
  }, [isControlled, filterMode, onClearFilters, onFilterChange]);

  // ===== Selection Actions =====
  const selectRow = useCallback((rowId: string, selected: boolean) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      selected ? next.add(rowId) : next.delete(rowId);
      return next;
    });
  }, []);

  const selectAll = useCallback(
    (selected: boolean) => {
      if (selected) {
        const ids = paginatedData.map(getRowId);
        setSelectedRows(new Set(ids));
      } else {
        setSelectedRows(new Set());
      }
    },
    [paginatedData, getRowId]
  );

  const clearSelection = useCallback(() => {
    setSelectedRows(new Set());
  }, []);

  // ===== Refresh (just resets internal state) =====
  const refresh = useCallback(() => {
    setSearchTermState('');
    setActiveFilters([]);
    setSortConfig({ column: '', direction: 'asc' });
    setInternalPage(1);
    setSelectedRows(new Set());
  }, []);

  // ===== Return Value =====
  return {
    // Data
    data,
    processedData,
    paginatedData,
    loading: externalLoading,

    // State
    searchTerm,
    activeFilters,
    sortConfig,
    selectedRows,
    currentPage,
    currentPageSize,

    // Actions
    setSearchTerm,
    setSort,
    setCurrentPage,
    setCurrentPageSize,
    navigateNext,
    navigatePrevious,
    addFilter,
    removeFilter,
    clearFilters,
    selectRow,
    selectAll,
    clearSelection,
    refresh,

    // Computed
    paginationInfo,
    selectedData,
    hasSelection: selectedRows.size > 0,
    getRowId,

    // Mode
    isControlled,
  };
};
