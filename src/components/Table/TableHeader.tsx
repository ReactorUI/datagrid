import React from 'react';
import { Column, SortConfig } from '../../types';

interface TableHeaderProps<T> {
  columns: Column<T>[];
  sortConfig: SortConfig;
  onSort?: (column: string) => void;
  enableSelection: boolean;
  selectedCount: number;
  totalCount: number;
  onSelectAll?: (selected: boolean) => void;
}

export const TableHeader = <T,>({
  columns,
  sortConfig,
  onSort,
  enableSelection,
  selectedCount,
  totalCount,
  onSelectAll,
}: TableHeaderProps<T>) => {
  const getSortIcon = (columnKey: string) => {
    if (sortConfig.column !== columnKey) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }

    if (sortConfig.direction === 'asc') {
      return (
        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      );
    }

    return (
      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  return (
    <thead className="bg-gray-50 border-b border-gray-200">
      <tr>
        {enableSelection && (
          <th 
            className="w-12 px-4 py-3 text-left"
            role="columnheader"
            aria-label="Select all rows"
          >
            <input
              type="checkbox"
              checked={selectedCount > 0 && selectedCount === totalCount}
              ref={(el) => {
                if (el) {
                  el.indeterminate = selectedCount > 0 && selectedCount < totalCount;
                }
              }}
              onChange={(e) => onSelectAll?.(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              aria-label="Select all rows"
            />
          </th>
        )}
        {columns.map((column) => (
          <th
            key={String(column.key)}
            role="columnheader"
            className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
              column.sortable && onSort ? 'cursor-pointer hover:bg-gray-100 select-none' : ''
            }`}
            onClick={() => column.sortable && onSort && onSort(String(column.key))}
            style={{
              width: column.width,
              minWidth: column.minWidth,
              maxWidth: column.maxWidth,
              textAlign: column.align || 'left',
            }}
            aria-sort={
              sortConfig.column === String(column.key) 
                ? sortConfig.direction === 'asc' ? 'ascending' : 'descending'
                : 'none'
            }
            aria-label={`Sort by ${column.label}`}
          >
            <div className="flex items-center gap-2">
              {column.label}
              {column.sortable && onSort && getSortIcon(String(column.key))}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );
};
