// File: src/components/DataGrid/DataGrid.tsx

import React, { useMemo, useCallback } from 'react';
import { DataGridProps, Column, LoadingState } from '../../types';
import { useDataGrid } from '../../hooks';
import { SearchInput } from '../Search';
import { FilterControls } from '../Filter';
import { TableHeader, TableBody } from '../Table';
import { getTheme } from '../../themes';
import { inferDataType } from '../../utils';

// ============================================================================
// Spinner Component (reusable)
// ============================================================================

const Spinner: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    className={`animate-spin ${className}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

// ============================================================================
// Main Component
// ============================================================================

export const DataGrid = <T extends { [key: string]: any } = any>({
  // Data
  data,
  columns: columnsProp = [],

  // Loading states
  loading: simpleLoading = false,
  loadingState: externalLoadingState,

  // External state (controlled mode)
  totalRecords: externalTotalRecords,
  error: externalError,
  currentPage: externalCurrentPage,

  // Features
  enableSearch = true,
  enableSorting = true,
  enableFilters = true,
  enableSelection = true,
  enableDelete = false,
  enableRefresh = false,
  deleteConfirmation = false,

  // Layout
  maxHeight,
  stickyHeader = false,

  // Pagination
  pageSize = 10,
  pageSizeOptions = [5, 10, 25, 50, 100],

  // Styling
  variant = 'default',
  size = 'md',
  className = '',

  // Pagination Events
  onPageChange,
  onPageSizeChange,

  // Sort & Search Events
  onSortChange,
  onSearchChange,

  // Filter Events
  onApplyFilter,
  onRemoveFilter,
  onClearFilters,
  onFilterChange,

  // Row & Cell Events
  onTableRowClick,
  onTableRowDoubleClick,
  onRowSelect,
  onSelectionChange,
  onTableRowHover,
  onCellClick,

  // Action Events
  onTableRefresh,
  onBulkDelete,

  ...rest
}: DataGridProps<T>) => {
  const theme = getTheme(variant);

  // ===== Normalize Loading State =====
  // If simple `loading` is passed, convert to loadingState.data
  // If loadingState is passed, use it directly
  const loadingState: LoadingState = useMemo(() => {
    if (externalLoadingState) return externalLoadingState;
    if (simpleLoading) return { data: true };
    return {};
  }, [externalLoadingState, simpleLoading]);

  // Destructure for convenience
  const isDataLoading = loadingState.data ?? false;
  const isFilterLoading = loadingState.filter ?? false;
  const isSearchLoading = loadingState.search ?? false;
  const isRefreshLoading = loadingState.refresh ?? false;
  const isDeleteLoading = loadingState.delete ?? false;

  // Any loading state disables controls
  const isAnyLoading =
    isDataLoading || isFilterLoading || isSearchLoading || isRefreshLoading || isDeleteLoading;

  // Use the data grid hook
  const {
    processedData,
    paginatedData,
    searchTerm,
    activeFilters,
    sortConfig,
    selectedRows,
    currentPage,
    currentPageSize,
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
    paginationInfo,
    selectedData,
    refresh,
    getRowId,
  } = useDataGrid({
    data,
    pageSize,
    totalRecords: externalTotalRecords,
    currentPage: externalCurrentPage,
    loading: isDataLoading,
    onPageChange,
    onPageSizeChange,
    onSortChange,
    onSearchChange,
    onApplyFilter,
    onRemoveFilter,
    onClearFilters,
    onFilterChange,
  });

  // Auto-detect columns if not provided
  const columns = useMemo<Column<T>[]>(() => {
    if (columnsProp.length > 0) return columnsProp;

    if (data.length > 0) {
      const firstRow = data[0];
      return Object.keys(firstRow).map((key) => ({
        key,
        label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
        sortable: true,
        filterable: true,
        dataType: inferDataType((firstRow as any)[key]),
      }));
    }

    return [];
  }, [columnsProp, data]);

  // Selection change effect
  const previousSelectedData = React.useRef<T[]>([]);

  React.useLayoutEffect(() => {
    const hasChanged =
      selectedData.length !== previousSelectedData.current.length ||
      selectedData.some((item, index) => item !== previousSelectedData.current[index]);

    if (hasChanged && onSelectionChange) {
      previousSelectedData.current = selectedData;
      onSelectionChange(selectedData);
    }
  }, [selectedData, onSelectionChange]);

  // Handle row selection with callback
  const handleRowSelect = useCallback(
    (rowId: string, selected: boolean) => {
      selectRow(rowId, selected);
      if (onRowSelect) {
        const row = data.find((r) => getRowId(r) === rowId);
        if (row) {
          onRowSelect(row, selected);
        }
      }
    },
    [selectRow, onRowSelect, data, getRowId]
  );

  // Handle delete action
  const handleDelete = useCallback(() => {
    if (selectedRows.size === 0) return;

    const executeDelete = () => {
      if (onBulkDelete) {
        onBulkDelete(selectedData);
      }
    };

    if (deleteConfirmation) {
      const count = selectedRows.size;
      const message = `Are you sure you want to delete ${count} selected item${count === 1 ? '' : 's'}?`;
      if (window.confirm(message)) {
        executeDelete();
      }
    } else {
      executeDelete();
    }
  }, [selectedRows.size, selectedData, onBulkDelete, deleteConfirmation]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    refresh();
    onTableRefresh?.();
  }, [refresh, onTableRefresh]);

  // Determine if fixed layout is enabled
  const hasFixedLayout = maxHeight !== undefined || stickyHeader;

  // Error state
  if (externalError) {
    return (
      <div className={`${theme.container} ${className}`} {...rest}>
        <div className="px-4 py-8 text-center">
          <div className="text-red-600 dark:text-red-400 mb-2">Error loading data</div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">{externalError}</div>
          <button onClick={handleRefresh} className={theme.button}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${theme.container} ${className} ${hasFixedLayout ? 'flex flex-col' : ''}`}
      style={
        hasFixedLayout && maxHeight
          ? { maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight }
          : undefined
      }
      {...rest}
    >
      {/* Row 1: Filters - Fixed at top when scrollable */}
      {enableFilters && (
        <div className="p-4 pb-2 flex-shrink-0">
          <FilterControls
            columns={columns}
            activeFilters={activeFilters}
            onApplyFilter={addFilter}
            onRemoveFilter={removeFilter}
            onClearFilters={clearFilters}
            disabled={isDataLoading}
            filterLoading={isFilterLoading}
          />
        </div>
      )}

      {/* Row 2: Controls - Fixed at top when scrollable */}
      <div className="px-4 pb-4 flex-shrink-0">
        <div className="flex justify-between items-center gap-4">
          {/* Show X entries */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-sm text-gray-700 dark:text-gray-300">Show</span>
            <select
              value={currentPageSize}
              onChange={(e) => setCurrentPageSize(parseInt(e.target.value))}
              disabled={isAnyLoading}
              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-700 dark:text-gray-300">entries</span>
          </div>

          {/* Search, Refresh, Delete */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {enableSearch && (
              <div className="w-64 relative">
                <SearchInput
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Search..."
                  disabled={isAnyLoading}
                  className={theme.searchInput}
                />
                {isSearchLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Spinner className="w-4 h-4 text-gray-400" />
                  </div>
                )}
              </div>
            )}

            {enableRefresh && (
              <button
                onClick={handleRefresh}
                disabled={isAnyLoading}
                title={isRefreshLoading ? 'Refreshing...' : 'Refresh data'}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors duration-150 flex items-center justify-center"
              >
                <svg
                  className={`w-4 h-4 ${isRefreshLoading ? 'animate-spin' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            )}

            {enableDelete && enableSelection && (
              <button
                onClick={handleDelete}
                disabled={selectedRows.size === 0 || isAnyLoading}
                title={
                  selectedRows.size === 0
                    ? 'Select rows to delete'
                    : isDeleteLoading
                      ? 'Deleting...'
                      : `Delete ${selectedRows.size} selected item${selectedRows.size === 1 ? '' : 's'}`
                }
                className={`px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 transition-colors duration-150 flex items-center gap-1 ${
                  selectedRows.size === 0 || isAnyLoading
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer'
                }`}
              >
                {isDeleteLoading ? (
                  <Spinner className="w-4 h-4" />
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                )}
                {selectedRows.size > 0 && (
                  <span className="text-sm">
                    {isDeleteLoading ? 'Deleting...' : `(${selectedRows.size} selected)`}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table Container - Scrollable when fixed layout */}
      <div
        className={`
          ${hasFixedLayout ? 'flex-1 overflow-auto min-h-0' : 'overflow-x-auto'}
        `}
      >
        <table className={theme.table}>
          <TableHeader
            columns={columns}
            sortConfig={sortConfig}
            onSort={enableSorting ? setSort : undefined}
            enableSelection={enableSelection}
            selectedCount={selectedRows.size}
            totalCount={paginatedData.length}
            onSelectAll={enableSelection ? selectAll : undefined}
            theme={theme}
            sticky={hasFixedLayout}
          />
          <TableBody
            columns={columns}
            data={paginatedData}
            selectedRows={selectedRows}
            onSelectRow={enableSelection ? handleRowSelect : undefined}
            onRowClick={onTableRowClick}
            onRowDoubleClick={onTableRowDoubleClick}
            onRowHover={onTableRowHover}
            onCellClick={onCellClick}
            enableSelection={enableSelection}
            loading={isDataLoading}
            theme={theme}
            getRowId={getRowId}
          />
        </table>
      </div>

      {/* Pagination - Fixed at bottom when scrollable */}
      <div className={`${theme.pagination} flex-shrink-0`}>
        <div className="text-sm text-gray-700 dark:text-gray-300 flex-shrink-0">
          Showing {paginationInfo.start}-{paginationInfo.end} of{' '}
          {paginationInfo.totalRecords.toLocaleString()} records
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={navigatePrevious}
            disabled={!paginationInfo.hasPrevious || isAnyLoading}
            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
          >
            Previous
          </button>

          <span className="text-sm text-gray-700 dark:text-gray-300 px-2">
            Page {currentPage} {paginationInfo.totalPages > 0 && `of ${paginationInfo.totalPages}`}
          </span>

          <button
            onClick={navigateNext}
            disabled={!paginationInfo.hasNext || isAnyLoading}
            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
