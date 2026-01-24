// File: src/components/Table/TableHeader.tsx

import React from 'react';
import { Column, SortConfig } from '../../types';
import { Theme } from '../../themes';

interface TableHeaderProps<T> {
  columns: Column<T>[];
  sortConfig: SortConfig;
  onSort?: (column: string) => void;
  enableSelection: boolean;
  selectedCount: number;
  totalCount: number;
  onSelectAll?: (selected: boolean) => void;
  theme: Theme;
  sticky?: boolean;
}

export const TableHeader = <T,>({
  columns,
  sortConfig,
  onSort,
  enableSelection,
  selectedCount,
  totalCount,
  onSelectAll,
  theme,
  sticky = false,
}: TableHeaderProps<T>) => {
  const getSortIcon = (columnKey: string) => {
    if (sortConfig.column !== columnKey) {
      return (
        <svg
          className={`w-4 h-4 ${theme.textMuted}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      );
    }

    if (sortConfig.direction === 'asc') {
      return (
        <svg
          className="w-4 h-4 text-blue-500 dark:text-blue-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      );
    }

    return (
      <svg
        className="w-4 h-4 text-blue-500 dark:text-blue-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  // Sticky styles
  const stickyClass = sticky ? 'sticky top-0 z-10' : '';

  // Extract background from header theme for hover
  const headerBg = theme.header.match(/(?:dark:)?bg-\S+/g) || [];
  const hoverBg =
    headerBg.length > 0
      ? headerBg
          .map((bg) => {
            // Convert bg-gray-50 -> hover:bg-gray-100, dark:bg-gray-700 -> dark:hover:bg-gray-600
            if (bg.startsWith('dark:')) {
              const color = bg.replace('dark:bg-', '');
              const parts = color.match(/(\w+)-(\d+)/);
              if (parts) {
                const newShade = Math.max(parseInt(parts[2]) - 100, 600);
                return `dark:hover:bg-${parts[1]}-${newShade}`;
              }
              return `dark:hover:bg-${color}`;
            } else {
              const color = bg.replace('bg-', '');
              const parts = color.match(/(\w+)-(\d+)/);
              if (parts) {
                const newShade = Math.min(parseInt(parts[2]) + 50, 200);
                return `hover:bg-${parts[1]}-${newShade}`;
              }
              return `hover:bg-${color}`;
            }
          })
          .join(' ')
      : 'hover:bg-gray-100 dark:hover:bg-gray-600';

  // Extract border from theme for checkbox
  const borderColor =
    theme.headerCell
      .match(/(?:dark:)?border-\S+/g)
      ?.filter((c) => !c.includes('border-r') && !c.includes('border-b'))?.[0] ||
    'border-gray-300 dark:border-gray-600';

  // Extract background for checkbox
  const checkboxBg =
    theme.table.match(/(?:dark:)?bg-\S+/g)?.join(' ') || 'bg-white dark:bg-gray-800';

  return (
    <thead className={`${theme.header} ${stickyClass}`}>
      <tr>
        {enableSelection && (
          <th
            className={`w-12 ${theme.headerCell}`}
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
              className={`w-4 h-4 text-blue-600 ${checkboxBg} ${borderColor} rounded focus:ring-blue-500 dark:focus:ring-blue-400`}
              aria-label="Select all rows"
            />
          </th>
        )}
        {columns.map((column) => (
          <th
            key={String(column.key)}
            role="columnheader"
            className={`${theme.headerCell} ${
              column.sortable && onSort
                ? `cursor-pointer ${hoverBg} select-none transition-colors duration-150`
                : ''
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
                ? sortConfig.direction === 'asc'
                  ? 'ascending'
                  : 'descending'
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
