import React, { useMemo, useCallback } from 'react';
import { DataGridProps, Column } from '../../types';
import { useDataGrid } from '../../hooks';
import { SearchInput } from '../Search';
import { FilterControls } from '../Filter';
import { TableHeader, TableBody } from '../Table';
import { getTheme } from '../../themes';

export const DataGrid = <T extends { [key: string]: any } = any>({
  data,
  endpoint,
  columns: columnsProp = [],
  enableSearch = true,
  enableSorting = true,
  enableFilters = true,
  enableSelection = true,
  enableDelete = false,
  deleteConfirmation = false,
  pageSize = 10,
  serverPageSize = 100,
  pageSizeOptions = [5, 10, 25, 50, 100],
  httpConfig,
  variant = 'default',
  size = 'md',
  className = '',
  enableRefresh = false,

  // Event callbacks
  onDataLoad,
  onDataError,
  onLoadingStateChange,
  onPageChange,
  onPageSizeChange,
  onSortChange,
  onFilterChange,
  onSearchChange,
  onTableRefresh,
  onTableRowClick,
  onTableRowDoubleClick,
  onRowSelect,
  onSelectionChange,
  onTableRowHover,
  onCellClick,
  onBulkDelete,

  ...rest
}: DataGridProps<T>) => {
  const theme = getTheme(variant);

  // Use the data grid hook
  const {
    data: sourceData,
    processedData,
    paginatedData,
    loading,
    error,
    searchTerm,
    activeFilters,
    sortConfig,
    selectedRows,
    currentPage,
    currentPageSize,
    setSearchTerm,
    setSort,
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
    getRowId, // Get the stable ID generator
  } = useDataGrid({
    data,
    endpoint,
    httpConfig,
    pageSize,
    serverPageSize,
    onDataLoad,
    onDataError,
    onLoadingStateChange,
    onPageChange,
    onPageSizeChange,
    onSortChange,
    onFilterChange,
    onSearchChange,
  });

  // Auto-detect columns if not provided
  const columns = useMemo<Column<T>[]>(() => {
    if (columnsProp.length > 0) return columnsProp;

    if (sourceData.length > 0) {
      const firstRow = sourceData[0];
      return Object.keys(firstRow).map((key) => ({
        key,
        label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
        sortable: true,
        filterable: true,
        dataType: inferDataType((firstRow as any)[key]),
      }));
    }

    return [];
  }, [columnsProp, sourceData]);

  // Memoize the selection change handler
  const handleSelectionChange = useCallback(
    (newSelectedData: T[]) => {
      onSelectionChange?.(newSelectedData);
    },
    [onSelectionChange]
  );

  // Use a ref to track previous selectedData to avoid unnecessary calls
  const previousSelectedData = React.useRef<T[]>([]);

  // Only call onSelectionChange when selectedData actually changes
  React.useLayoutEffect(() => {
    const hasChanged =
      selectedData.length !== previousSelectedData.current.length ||
      selectedData.some((item, index) => item !== previousSelectedData.current[index]);

    if (hasChanged && onSelectionChange) {
      previousSelectedData.current = selectedData;
      handleSelectionChange(selectedData);
    }
  }, [selectedData, handleSelectionChange]);

  // Handle row selection with callback
  const handleRowSelect = useCallback(
    (rowId: string, selected: boolean) => {
      selectRow(rowId, selected);
      if (onRowSelect) {
        const row = sourceData.find((r) => getRowId(r) === rowId);
        if (row) {
          onRowSelect(row, selected);
        }
      }
    },
    [selectRow, onRowSelect, sourceData, getRowId]
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

  if (error) {
    return (
      <div className={`${theme.container} ${className}`} {...rest}>
        <div className="px-4 py-8 text-center">
          <div className="text-red-600 dark:text-red-400 mb-2">Error loading data</div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">{error}</div>
          <button onClick={handleRefresh} className={theme.button}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${theme.container} ${className}`} {...rest}>
      {/* Row 1: Filters */}
      {enableFilters && (
        <div className="p-4 pb-2">
          <div className="flex justify-between items-start gap-4">
            {/* Filters on the left */}
            <div className="flex-1">
              <FilterControls
                columns={columns}
                activeFilters={activeFilters}
                onAddFilter={addFilter}
                onRemoveFilter={removeFilter}
                onClearFilters={clearFilters}
              />
            </div>
          </div>
        </div>
      )}

      {/* Row 2: Page Size Selector + Search Input + Refresh + Delete Button */}
      <div className="px-4 pb-4">
        <div className="flex justify-between items-center gap-4">
          {/* Show X entries on the left */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-sm text-gray-700 dark:text-gray-300">Show</span>
            <select
              value={currentPageSize}
              onChange={(e) => setCurrentPageSize(parseInt(e.target.value))}
              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-700 dark:text-gray-300">entries</span>
          </div>

          {/* Search input, Refresh and Delete button on the right */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {enableSearch && (
              <div className="w-64">
                <SearchInput
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Search..."
                  disabled={loading}
                  className={theme.searchInput}
                />
              </div>
            )}

            {enableRefresh && (
              <button
                onClick={handleRefresh}
                disabled={loading}
                title={loading ? 'Loading...' : 'Refresh data'}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors duration-150 flex items-center justify-center"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
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
                disabled={selectedRows.size === 0}
                title={
                  selectedRows.size === 0
                    ? 'Select rows to delete'
                    : `Delete ${selectedRows.size} selected item${selectedRows.size === 1 ? '' : 's'}`
                }
                className={`px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 transition-colors duration-150 flex items-center gap-1 ${
                  selectedRows.size === 0
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer'
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                {selectedRows.size > 0 && (
                  <span className="text-sm">({selectedRows.size} selected)</span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
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
            loading={loading}
            theme={theme}
            getRowId={getRowId} // Pass the stable ID generator
          />
        </table>
      </div>

      {/* Bottom Row: Records Info + Navigation */}
      <div className={theme.pagination}>
        {/* Records info on the left */}
        <div className="text-sm text-gray-700 dark:text-gray-300 flex-shrink-0">
          Showing {paginationInfo.start}-{paginationInfo.end} of{' '}
          {paginationInfo.totalRecords.toLocaleString()} records
        </div>

        {/* Navigation controls on the right */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={navigatePrevious}
            disabled={!paginationInfo.hasPrevious}
            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
          >
            Previous
          </button>

          <span className="text-sm text-gray-700 dark:text-gray-300 px-2">
            Page {currentPage} {paginationInfo.totalPages > 0 && `of ${paginationInfo.totalPages}`}
          </span>

          <button
            onClick={navigateNext}
            disabled={!paginationInfo.hasNext}
            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper function to infer data type
function inferDataType(value: any): 'string' | 'number' | 'boolean' | 'date' | 'datetime' {
  if (value == null) return 'string';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';

  if (typeof value === 'string') {
    // Try to detect dates
    const dateValue = new Date(value);
    if (!isNaN(dateValue.getTime()) && dateValue.getFullYear() > 1900) {
      return value.includes('T') || value.includes(' ') ? 'datetime' : 'date';
    }
  }

  return 'string';
}
