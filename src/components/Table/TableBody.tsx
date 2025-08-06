import React from 'react';
import { Column } from '../../types';

interface TableBodyProps<T> {
  columns: Column<T>[];
  data: T[];
  selectedRows: Set<string>;
  onSelectRow?: (rowId: string, selected: boolean) => void;
  onRowDoubleClick?: (row: T) => void;
  enableSelection: boolean;
  loading: boolean;
  emptyMessage?: string;
}

export const TableBody = <T extends { id?: string | number }>({
  columns,
  data,
  selectedRows,
  onSelectRow,
  onRowDoubleClick,
  enableSelection,
  loading,
  emptyMessage = 'No data available',
}: TableBodyProps<T>) => {
  const renderCell = (row: T, column: Column<T>) => {
    const value = (row as any)[column.key];

    if (column.render) {
      return column.render(value, row, 0);
    }

    return value?.toString() || '';
  };

  const getRowId = (row: T): string => {
    return String(row.id || Math.random());
  };

  if (loading && data.length === 0) {
    return (
      <tbody>
        {Array.from({ length: 5 }).map((_, index) => (
          <tr key={index} className="animate-pulse">
            {enableSelection && (
              <td className="px-4 py-3">
                <div className="w-4 h-4 bg-gray-200 rounded"></div>
              </td>
            )}
            {columns.map((column) => (
              <td key={String(column.key)} className="px-4 py-3">
                <div className="h-4 bg-gray-200 rounded"></div>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    );
  }

  if (data.length === 0 && !loading) {
    return (
      <tbody>
        <tr>
          <td
            colSpan={columns.length + (enableSelection ? 1 : 0)}
            className="px-4 py-8 text-center text-gray-500"
          >
            {emptyMessage}
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody className="bg-white divide-y divide-gray-200">
      {data.map((row) => {
        const rowId = getRowId(row);
        const isSelected = selectedRows.has(rowId);

        return (
          <tr
            key={rowId}
            className={`transition-colors duration-150 cursor-pointer ${
              isSelected ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'
            }`}
            onDoubleClick={() => onRowDoubleClick?.(row)}
            onClick={(e) => {
              // Don't trigger row selection if clicking on interactive elements
              if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLButtonElement ||
                (e.target as HTMLElement).closest('button, input, a')
              ) {
                return;
              }
              onSelectRow?.(rowId, !isSelected);
            }}
          >
            {enableSelection && (
              <td className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => {
                    e.stopPropagation();
                    onSelectRow?.(rowId, e.target.checked);
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </td>
            )}
            {columns.map((column) => (
              <td
                key={String(column.key)}
                className="px-4 py-3 text-sm text-gray-900"
                style={{
                  width: column.width,
                  minWidth: column.minWidth,
                  maxWidth: column.maxWidth,
                  textAlign: column.align || 'left',
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
