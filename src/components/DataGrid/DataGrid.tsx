import React, { useMemo } from 'react';
import { DataGridProps, Column } from '../../types';
import { useDataGrid } from '../../hooks';
import { SearchInput } from '../Search';
import { FilterControls } from '../Filter';
import { TableHeader, TableBody } from '../Table';
import { Pagination } from '../Pagination';
import { getTheme } from '../../themes';

export const DataGrid = <T extends { id?: string | number } = any>({
  data,
  endpoint,
  columns: columnsProp = [],
  enableSearch = true,
  enableSorting = true,
  enableFilters = true,
  enableSelection = true,
  pageSize = 10,
  serverPageSize = 100,
  pageSizeOptions = [5, 10, 25, 50, 100],
  httpConfig,
  showRefreshButton = true, // Default to true for backward compatibility
  variant = 'default',
  size = 'md',
  className = '',

  // Event callbacks (renamed to avoid HTML conflicts)
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

  ...rest
}: DataGridProps<T>) => {
  const theme = getTheme(variant);

  // Use the data grid hook with all callbacks
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
    setCurrentPage,
    setCurrentPageSize,
    addFilter,
    removeFilter,
    clearFilters,
    selectRow,
    selectAll,
    paginationInfo,
    selectedData,
    refresh,
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

  // Handle selection changes
  React.useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selectedData);
    }
  }, [selectedData, onSelectionChange]);

  // Handle row selection with callback
  const handleRowSelect = (rowId: string, selected: boolean) => {
    selectRow(rowId, selected);
    if (onRowSelect) {
      const row = sourceData.find((r) => String(r.id) === rowId);
      if (row) {
        onRowSelect(row, selected);
      }
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    refresh();
    onTableRefresh?.();
  };

  if (error) {
    return (
      <div className={`${theme.container} ${className}`} {...rest}>
        <div className="px-4 py-8 text-center">
          <div className="text-red-600 mb-2">Error loading data</div>
          <div className="text-sm text-gray-600 mb-4">{error}</div>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${theme.container} ${className}`} {...rest}>
      {/* Controls */}
      <div className="p-4 space-y-4">
        {/* Filters */}
        {enableFilters && (
          <FilterControls
            columns={columns}
            activeFilters={activeFilters}
            onAddFilter={addFilter}
            onRemoveFilter={removeFilter}
            onClearFilters={clearFilters}
          />
        )}

        {/* Search and Refresh */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          {enableSearch && (
            <div className="w-full sm:w-64">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search..."
                disabled={loading}
              />
            </div>
          )}

          {/* Conditional Refresh Button */}
          {showRefreshButton && (
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          )}
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
          />
        </table>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={paginationInfo.totalPages}
        pageSize={currentPageSize}
        pageSizeOptions={pageSizeOptions}
        totalRecords={processedData.length}
        displayStart={paginationInfo.start}
        displayEnd={paginationInfo.end}
        onPageChange={setCurrentPage}
        onPageSizeChange={setCurrentPageSize}
        hasNext={paginationInfo.hasNext}
        hasPrevious={paginationInfo.hasPrevious}
      />
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
