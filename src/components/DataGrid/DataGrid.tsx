// File: src/components/DataGrid/DataGrid.tsx

import React, { useMemo, useCallback } from 'react';
import { DataGridProps, Column, LoadingState } from '../../types';
import { useDataGrid } from '../../hooks';
import { SearchInput } from '../Search';
import { FilterControls } from '../Filter';
import { TableHeader, TableBody } from '../Table';
import { getTheme, Theme } from '../../themes';
import { inferDataType } from '../../utils';

// ============================================================================
// Spinner Component (reusable)
// ============================================================================

const Spinner: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    className={`${className}`}
    style={{ animation: 'spin 1s linear infinite' }}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
      style={{ opacity: 0.25 }}
    />
    <path
      style={{ opacity: 0.75 }}
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
  filterMode = 'client',

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
  theme: customTheme,

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

  // DEPRECATED Props (kept for backward compatibility)
  endpoint,
  httpConfig,
  serverPageSize,
  onDataLoad,
  onDataError,
  onLoadingStateChange,

  ...rest
}: DataGridProps<T>) => {
  // Merge variant theme with custom theme overrides
  const theme = useMemo(() => getTheme(variant, customTheme), [variant, customTheme]);

  // ===== Deprecation Warnings =====
  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      if (endpoint) {
        console.warn(
          '[@reactorui/datagrid] `endpoint` prop is deprecated and will be removed in the next major version. ' +
            'Use controlled mode instead: fetch data in your parent component and pass via `data` prop. ' +
            'See migration guide: https://github.com/reactorui/datagrid#migration'
        );
      }
      if (httpConfig) {
        console.warn(
          '[@reactorui/datagrid] `httpConfig` prop is deprecated and will be removed in the next major version. ' +
            'Use controlled mode instead.'
        );
      }
      if (serverPageSize) {
        console.warn(
          '[@reactorui/datagrid] `serverPageSize` prop is deprecated. Use `pageSize` prop instead.'
        );
      }
      if (onDataLoad) {
        console.warn(
          '[@reactorui/datagrid] `onDataLoad` callback is deprecated and will be removed in the next major version. ' +
            'Handle data loading in your parent component.'
        );
      }
      if (onDataError) {
        console.warn(
          '[@reactorui/datagrid] `onDataError` callback is deprecated. Use the `error` prop instead.'
        );
      }
      if (onLoadingStateChange) {
        console.warn(
          '[@reactorui/datagrid] `onLoadingStateChange` callback is deprecated. Use the `loadingState` prop instead.'
        );
      }
      // Warn if filter callbacks provided but filterMode is 'client'
      if (filterMode === 'client' && (onApplyFilter || onRemoveFilter || onClearFilters)) {
        console.warn(
          '[@reactorui/datagrid] Filter callbacks (onApplyFilter, onRemoveFilter, onClearFilters) are provided but ' +
            '`filterMode` is "client" (default). These callbacks will NOT be fired. ' +
            'Set `filterMode="server"` or `filterMode="both"` to enable filter callbacks.'
        );
      }
    }
  }, []); // Run once on mount

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
    filterMode,
    onPageChange,
    onPageSizeChange,
    onSortChange,
    onSearchChange,
    onApplyFilter,
    onRemoveFilter,
    onClearFilters,
    onFilterChange,
  });

  // ===== Column Configuration =====
  const columns: Column<T>[] = useMemo(() => {
    if (columnsProp.length > 0) return columnsProp;
    if (!data || data.length === 0) return [];

    // Auto-detect columns from first row
    return Object.keys(data[0]).map((key) => ({
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
      sortable: true,
      filterable: true,
      dataType: inferDataType(data[0][key]),
    }));
  }, [columnsProp, data]);

  // Handle row selection with callback
  const handleRowSelect = useCallback(
    (row: T, isSelected: boolean) => {
      const rowId = getRowId(row);
      selectRow(rowId, isSelected);
      onRowSelect?.(row, isSelected);

      // Calculate new selection for callback
      const newSelectedRows = new Set(selectedRows);
      isSelected ? newSelectedRows.add(rowId) : newSelectedRows.delete(rowId);

      const newSelectedData = data.filter((r) => newSelectedRows.has(getRowId(r)));
      onSelectionChange?.(newSelectedData);
    },
    [selectRow, onRowSelect, onSelectionChange, getRowId, selectedRows, data]
  );

  // Handle select all with callback
  const handleSelectAll = useCallback(
    (selected: boolean) => {
      selectAll(selected);

      // Call onSelectionChange with all or none
      const newSelectedData = selected ? paginatedData : [];
      onSelectionChange?.(newSelectedData);
    },
    [selectAll, onSelectionChange, paginatedData]
  );

  // Handle delete
  const handleDelete = useCallback(() => {
    if (selectedRows.size === 0) return;

    const executeDelete = () => {
      onBulkDelete?.(selectedData);
    };

    if (deleteConfirmation) {
      const confirmMessage = `Are you sure you want to delete ${selectedRows.size} selected item${selectedRows.size === 1 ? '' : 's'}?`;
      if (window.confirm(confirmMessage)) {
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
          <div className={`${theme.textError} mb-2`}>Error loading data</div>
          <div className={`text-sm ${theme.textMuted} mb-4`}>{externalError}</div>
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
      {/* Controls Row - Fixed at top when scrollable */}
      <div className="px-4 py-4 flex-shrink-0">
        <div className="flex justify-between items-center gap-4">
          {/* Left: Show X entries + Filter icon */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-sm ${theme.text}`}>Show</span>
            <select
              value={currentPageSize}
              onChange={(e) => setCurrentPageSize(parseInt(e.target.value))}
              disabled={isAnyLoading}
              className={theme.select}
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span className={`text-sm ${theme.text}`}>entries</span>

            {/* Filter Icon */}
            {enableFilters && (
              <FilterControls
                columns={columns}
                activeFilters={activeFilters}
                onApplyFilter={addFilter}
                onRemoveFilter={removeFilter}
                onClearFilters={clearFilters}
                disabled={isDataLoading}
                filterLoading={isFilterLoading}
                theme={theme}
              />
            )}
          </div>

          {/* Right: Search, Refresh, Delete */}
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
                    <Spinner className={`w-4 h-4 ${theme.textMuted}`} />
                  </div>
                )}
              </div>
            )}

            {enableRefresh && (
              <button
                onClick={handleRefresh}
                disabled={isAnyLoading}
                title={isRefreshLoading ? 'Refreshing...' : 'Refresh data'}
                className={`${theme.buttonSecondary} flex items-center justify-center`}
              >
                <svg
                  className="w-4 h-4"
                  style={isRefreshLoading ? { animation: 'spin 1s linear infinite' } : undefined}
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
                className={`${theme.buttonSecondary} flex items-center gap-1 ${
                  selectedRows.size === 0 || isAnyLoading ? 'opacity-50 cursor-not-allowed' : ''
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
            onSelectAll={enableSelection ? handleSelectAll : undefined}
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
        <div className={`${theme.paginationText} flex-shrink-0`}>
          Showing {paginationInfo.start}-{paginationInfo.end} of{' '}
          {paginationInfo.totalRecords.toLocaleString()} records
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={navigatePrevious}
            disabled={!paginationInfo.hasPrevious || isAnyLoading}
            className={theme.paginationButton}
          >
            Previous
          </button>

          <span className={`${theme.paginationText} px-2`}>
            Page {currentPage} {paginationInfo.totalPages > 0 && `of ${paginationInfo.totalPages}`}
          </span>

          <button
            onClick={navigateNext}
            disabled={!paginationInfo.hasNext || isAnyLoading}
            className={theme.paginationButton}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
