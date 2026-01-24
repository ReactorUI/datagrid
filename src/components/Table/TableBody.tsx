// File: src/components/Table/TableBody.tsx

import React from 'react';
import { Column } from '../../types';
import { Theme } from '../../themes';

interface TableBodyProps<T> {
  columns: Column<T>[];
  data: T[];
  selectedRows: Set<string>;
  onSelectRow?: (row: T, selected: boolean) => void;
  onRowClick?: (row: T, event: React.MouseEvent) => void;
  onRowDoubleClick?: (row: T, event: React.MouseEvent) => void;
  onRowHover?: (row: T | null, event: React.MouseEvent) => void;
  onCellClick?: (value: any, row: T, column: Column<T>, event: React.MouseEvent) => void;
  enableSelection: boolean;
  loading: boolean;
  emptyMessage?: string;
  theme: Theme;
  getRowId?: (row: T) => string;
}

export const TableBody = <T extends Record<string, any>>({
  columns,
  data,
  selectedRows,
  onSelectRow,
  onRowClick,
  onRowDoubleClick,
  onRowHover,
  onCellClick,
  enableSelection,
  loading,
  emptyMessage = 'No data available',
  theme,
  getRowId,
}: TableBodyProps<T>) => {
  // Generate stable row IDs
  const rowIdMap = React.useMemo(() => {
    const map = new Map<any, string>();
    data.forEach((row, index) => {
      const contentHash = JSON.stringify(row)
        .slice(0, 50)
        .replace(/[^a-zA-Z0-9]/g, '');
      const stableId = `row-${index}-${contentHash}`;
      map.set(row, stableId);
    });
    return map;
  }, [data]);

  // Use provided getRowId or fallback to generated IDs
  const getStableRowId = React.useCallback(
    (row: T): string => {
      if (getRowId) {
        return getRowId(row);
      }
      return rowIdMap.get(row) || `fallback-${Math.random().toString(36).substr(2, 9)}`;
    },
    [getRowId, rowIdMap]
  );

  const renderCell = (row: T, column: Column<T>) => {
    const value = (row as any)[column.key];

    if (column.render) {
      return column.render(value, row, 0);
    }

    return value?.toString() || '';
  };

  const handleRowClick = (row: T, event: React.MouseEvent) => {
    // Don't trigger if clicking on interactive elements
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLButtonElement ||
      (event.target as HTMLElement).closest('button, input, a')
    ) {
      return;
    }

    onRowClick?.(row, event);

    // Also handle selection if enabled
    if (enableSelection && onSelectRow) {
      const rowId = getStableRowId(row);
      const isSelected = selectedRows.has(rowId);
      onSelectRow(row, !isSelected);
    }
  };

  const handleCellClick = (row: T, column: Column<T>, event: React.MouseEvent) => {
    if (onCellClick) {
      const value = (row as any)[column.key];
      onCellClick(value, row, column, event);
    }
  };

  // Extract background from theme.table for tbody
  const tbodyBg = theme.table.includes('bg-')
    ? theme.table
        .split(' ')
        .filter((c) => c.startsWith('bg-') || c.startsWith('dark:bg-'))
        .join(' ')
    : '';

  if (loading) {
    return (
      <tbody className={tbodyBg}>
        <tr>
          <td
            colSpan={columns.length + (enableSelection ? 1 : 0)}
            className={`px-4 py-12 text-center ${theme.textMuted}`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg
                className="h-5 w-5 text-blue-600 dark:text-blue-400"
                style={{ animation: 'spin 1s linear infinite' }}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                <circle
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
              <span>Loading...</span>
            </div>
          </td>
        </tr>
      </tbody>
    );
  }

  if (data.length === 0) {
    return (
      <tbody className={tbodyBg}>
        <tr>
          <td
            colSpan={columns.length + (enableSelection ? 1 : 0)}
            className={`px-4 py-8 text-center ${theme.emptyState} ${tbodyBg}`}
          >
            {emptyMessage}
          </td>
        </tr>
      </tbody>
    );
  }

  // Extract border color from theme for dividers
  const borderColor =
    theme.cell
      .match(/border-\S+/g)
      ?.filter((c) => !c.includes('border-b') && !c.includes('border-r'))?.[0] ||
    'border-gray-200 dark:border-gray-600';
  const divideBorder = borderColor.replace('border-', 'divide-');

  return (
    <tbody className={`divide-y ${divideBorder}`}>
      {data.map((row) => {
        const rowId = getStableRowId(row);
        const isSelected = selectedRows.has(rowId);

        return (
          <tr
            key={rowId}
            className={`cursor-pointer ${isSelected ? theme.selectedRow : theme.row}`}
            onClick={(e) => handleRowClick(row, e)}
            onDoubleClick={(e) => onRowDoubleClick?.(row, e)}
            onMouseEnter={(e) => onRowHover?.(row, e)}
            onMouseLeave={(e) => onRowHover?.(null, e)}
          >
            {enableSelection && (
              <td className={theme.cell}>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => {
                    e.stopPropagation();
                    onSelectRow?.(row, e.target.checked);
                  }}
                  className={`w-4 h-4 text-blue-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400 ${tbodyBg} ${borderColor}`}
                />
              </td>
            )}
            {columns.map((column) => (
              <td
                key={String(column.key)}
                className={theme.cell}
                style={{
                  width: column.width,
                  minWidth: column.minWidth,
                  maxWidth: column.maxWidth,
                  textAlign: column.align || 'left',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCellClick(row, column, e);
                }}
              >
                {renderCell(row, column)}
              </td>
            ))}
          </tr>
        );
      })}
    </tbody>
  );
};
