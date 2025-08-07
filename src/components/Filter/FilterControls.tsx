import React, { useState } from 'react';
import { Column, ActiveFilter } from '../../types';

interface FilterControlsProps<T> {
  columns: Column<T>[];
  activeFilters: ActiveFilter[];
  onAddFilter: (filter: Omit<ActiveFilter, 'label'>) => void;
  onRemoveFilter: (index: number) => void;
  onClearFilters: () => void;
}

export const FilterControls = <T,>({
  columns,
  activeFilters,
  onAddFilter,
  onRemoveFilter,
  onClearFilters,
}: FilterControlsProps<T>) => {
  const [filterColumn, setFilterColumn] = useState('');
  const [filterOperator, setFilterOperator] = useState('eq');
  const [filterValue, setFilterValue] = useState('');

  const filterableColumns = columns.filter((col) => col.filterable !== false);
  const selectedColumn = filterableColumns.find((col) => col.key === filterColumn);

  const getOperatorOptions = () => {
    if (!selectedColumn) return [{ value: 'eq', label: 'equals' }];

    switch (selectedColumn.dataType) {
      case 'number':
      case 'date':
      case 'datetime':
        return [
          { value: 'eq', label: 'equals' },
          { value: 'gt', label: 'greater than' },
          { value: 'gte', label: 'greater than or equal' },
          { value: 'lt', label: 'less than' },
          { value: 'lte', label: 'less than or equal' },
        ];
      case 'string':
        return [
          { value: 'eq', label: 'equals' },
          { value: 'contains', label: 'contains' },
          { value: 'startsWith', label: 'starts with' },
          { value: 'endsWith', label: 'ends with' },
        ];
      case 'boolean':
        return [{ value: 'eq', label: 'equals' }];
      default:
        return [{ value: 'eq', label: 'equals' }];
    }
  };

  const renderFilterInput = () => {
    if (!selectedColumn) {
      return (
        <input
          type="text"
          disabled
          placeholder="Select column first"
          className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 cursor-not-allowed"
        />
      );
    }

    const baseProps = {
      value: filterValue,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setFilterValue(e.target.value),
      className:
        'px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
    };

    switch (selectedColumn.dataType) {
      case 'boolean':
        return (
          <select {...baseProps}>
            <option value="">Select value</option>
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        );
      case 'date':
        return <input {...baseProps} type="date" />;
      case 'datetime':
        return <input {...baseProps} type="datetime-local" />;
      case 'number':
        return <input {...baseProps} type="number" placeholder="Enter number" />;
      default:
        return <input {...baseProps} type="text" placeholder="Enter value" />;
    }
  };

  const handleApplyFilter = () => {
    if (!filterColumn || !filterValue.trim()) return;

    onAddFilter({
      column: filterColumn,
      operator: filterOperator,
      value: filterValue.trim(),
      dataType: selectedColumn?.dataType || 'string',
    });
  };

  const canApplyFilter = filterColumn && filterValue.trim();

  return (
    <div className="space-y-4">
      {/* Filter Form */}
      <div className="flex flex-wrap gap-4 items-end">
        {/* Column Selector */}
        <div className="min-w-40">
          <label className="block text-xs font-medium text-gray-700 mb-1">Column</label>
          <select
            value={filterColumn}
            onChange={(e) => {
              setFilterColumn(e.target.value);
              setFilterOperator('eq');
              setFilterValue('');
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Column</option>
            {filterableColumns.map((col) => (
              <option key={String(col.key)} value={String(col.key)}>
                {col.label}
              </option>
            ))}
          </select>
        </div>

        {/* Operator Selector */}
        <div className="min-w-32">
          <label className="block text-xs font-medium text-gray-700 mb-1">Operator</label>
          <select
            value={filterOperator}
            onChange={(e) => setFilterOperator(e.target.value)}
            disabled={!filterColumn}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
          >
            {getOperatorOptions().map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </select>
        </div>

        {/* Value Input */}
        <div className="min-w-40">
          <label className="block text-xs font-medium text-gray-700 mb-1">Value</label>
          {renderFilterInput()}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleApplyFilter}
            disabled={!canApplyFilter}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Apply Filter
          </button>
          <button
            onClick={onClearFilters}
            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-gray-600">Active filters:</span>
          {activeFilters.map((filter, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
            >
              {filter.label}
              <button
                onClick={() => onRemoveFilter(index)}
                className="ml-1 text-blue-600 hover:text-blue-800 focus:outline-none"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
