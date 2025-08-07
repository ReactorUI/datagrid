import React from 'react';
import { Column } from '../../types';
import { Theme } from '../../themes';

interface TableBodyProps<T> {
  columns: Column<T>[];
  data: T[];
  selectedRows: Set<string>;
  onSelectRow?: (rowId: string, selected: boolean) => void;
  onRowClick?: (row: T, event: React.MouseEvent) => void;
  onRowDoubleClick?: (row: T, event: React.MouseEvent) => void;
  onRowHover?: (row: T | null, event: React.MouseEvent) => void;
  onCellClick?: (value: any, row: T, column: Column<T>, event: React.MouseEvent) => void;
  enableSelection: boolean;
  loading: boolean;
  emptyMessage?: string;
  theme: Theme;
  getRowId?: (row: T) => string; // Accept the ID generator from parent
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
  // Generate stable row IDs - always generate, never use existing fields
  const rowIdMap = React.useMemo(() => {
    const map = new Map<any, string>();
    data.forEach((row, index) => {
      // Always generate based on index and content hash
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
      onSelectRow(rowId, !isSelected);
    }
  };

  const handleCellClick = (row: T, column: Column<T>, event: React.MouseEvent) => {
    if (onCellClick) {
      const value = (row as any)[column.key];
      onCellClick(value, row, column, event);
    }
  };

  if (loading && data.length === 0) {
    return (
      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
        {Array.from({ length: 5 }).map((_, index) => (
          <tr key={index} className="animate-pulse">
            {enableSelection && (
              <td className={theme.cell}>
                <div className="w-4 h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
              </td>
            )}
            {columns.map((column) => (
              <td key={String(column.key)} className={theme.cell}>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    );
  }

  if (data.length === 0 && !loading) {
    return (
      <tbody className="bg-white dark:bg-gray-800">
        <tr>
          <td
            colSpan={columns.length + (enableSelection ? 1 : 0)}
            className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800"
          >
            {emptyMessage}
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
      {data.map((row, index) => {
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
                    onSelectRow?.(rowId, e.target.checked);
                  }}
                  className="w-4 h-4 text-blue-600 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400"
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
