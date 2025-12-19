// File: src/components/Filter/FilterControls.tsx

import React, { useState, useCallback, useMemo } from 'react';
import { Column, ActiveFilter, FilterOperator } from '../../types';

// ============================================================================
// Types
// ============================================================================

interface FilterControlsProps<T> {
  columns: Column<T>[];
  activeFilters: ActiveFilter[];
  onApplyFilter: (filter: Omit<ActiveFilter, 'label'>) => void;
  onRemoveFilter: (index: number) => void;
  onClearFilters: () => void;
  /** Disables all controls (e.g., when data is loading) */
  disabled?: boolean;
  /** Shows spinner specifically on Apply Filter button */
  filterLoading?: boolean;
}

interface OperatorOption {
  value: FilterOperator;
  label: string;
}

// ============================================================================
// Operator Configuration
// ============================================================================

const OPERATORS: Record<string, OperatorOption[]> = {
  string: [
    { value: 'eq', label: 'equals' },
    { value: 'neq', label: 'not equals' },
    { value: 'contains', label: 'contains' },
    { value: 'startsWith', label: 'starts with' },
    { value: 'endsWith', label: 'ends with' },
  ],
  number: [
    { value: 'eq', label: 'equals' },
    { value: 'neq', label: 'not equals' },
    { value: 'gt', label: 'greater than' },
    { value: 'gte', label: 'greater or equal' },
    { value: 'lt', label: 'less than' },
    { value: 'lte', label: 'less or equal' },
  ],
  date: [
    { value: 'eq', label: 'equals' },
    { value: 'gt', label: 'after' },
    { value: 'gte', label: 'on or after' },
    { value: 'lt', label: 'before' },
    { value: 'lte', label: 'on or before' },
  ],
  datetime: [
    { value: 'eq', label: 'equals' },
    { value: 'gt', label: 'after' },
    { value: 'gte', label: 'on or after' },
    { value: 'lt', label: 'before' },
    { value: 'lte', label: 'on or before' },
  ],
  boolean: [{ value: 'eq', label: 'equals' }],
};

const DEFAULT_OPERATORS: OperatorOption[] = [{ value: 'eq', label: 'equals' }];

// ============================================================================
// Styles (centralized for DRY)
// ============================================================================

const styles = {
  select:
    'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed',
  input:
    'px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:cursor-not-allowed',
  inputDisabled:
    'px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed',
  buttonPrimary:
    'px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white text-sm rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed transition-colors duration-150 inline-flex items-center gap-2',
  buttonSecondary:
    'px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150',
  filterTag:
    'inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm',
  filterTagRemove:
    'ml-1 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100 focus:outline-none transition-colors duration-150',
  label: 'block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1',
};

// ============================================================================
// Component
// ============================================================================

export const FilterControls = <T,>({
  columns,
  activeFilters,
  onApplyFilter,
  onRemoveFilter,
  onClearFilters,
  disabled = false,
  filterLoading = false,
}: FilterControlsProps<T>) => {
  // Form state
  const [filterColumn, setFilterColumn] = useState('');
  const [filterOperator, setFilterOperator] = useState<FilterOperator>('eq');
  const [filterValue, setFilterValue] = useState('');

  // Combined disabled state - disabled OR filterLoading
  const isDisabled = disabled || filterLoading;

  // Derived state
  const filterableColumns = useMemo(
    () => columns.filter((col) => col.filterable !== false),
    [columns]
  );

  const selectedColumn = useMemo(
    () => filterableColumns.find((col) => col.key === filterColumn),
    [filterableColumns, filterColumn]
  );

  const operatorOptions = useMemo(
    () => OPERATORS[selectedColumn?.dataType ?? 'string'] ?? DEFAULT_OPERATORS,
    [selectedColumn]
  );

  const canApply = filterColumn && filterValue.trim();

  // Handlers
  const handleColumnChange = useCallback((columnKey: string) => {
    setFilterColumn(columnKey);
    setFilterOperator('eq');
    setFilterValue('');
  }, []);

  const handleApply = useCallback(() => {
    if (!canApply || !selectedColumn || isDisabled) return;

    onApplyFilter({
      column: filterColumn,
      operator: filterOperator,
      value: filterValue.trim(),
      dataType: selectedColumn.dataType ?? 'string',
    });
  }, [
    canApply,
    filterColumn,
    filterOperator,
    filterValue,
    selectedColumn,
    onApplyFilter,
    isDisabled,
  ]);

  const handleClear = useCallback(() => {
    setFilterColumn('');
    setFilterOperator('eq');
    setFilterValue('');
    onClearFilters();
  }, [onClearFilters]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && canApply && !isDisabled) {
        handleApply();
      }
    },
    [canApply, handleApply, isDisabled]
  );

  // Render value input based on data type
  const renderValueInput = () => {
    if (!selectedColumn) {
      return (
        <input
          type="text"
          disabled
          value=""
          placeholder="Select column first"
          className={styles.inputDisabled}
        />
      );
    }

    const commonProps = {
      value: filterValue,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setFilterValue(e.target.value),
      onKeyDown: handleKeyDown,
      disabled: isDisabled,
      className: styles.input,
    };

    switch (selectedColumn.dataType) {
      case 'boolean':
        return (
          <select {...commonProps} className={styles.select}>
            <option value="">Select value</option>
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        );
      case 'date':
        return <input {...commonProps} type="date" />;
      case 'datetime':
        return <input {...commonProps} type="datetime-local" />;
      case 'number':
        return <input {...commonProps} type="number" placeholder="Enter number" />;
      default:
        return <input {...commonProps} type="text" placeholder="Enter value" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Form */}
      <div className="flex flex-wrap gap-4 items-end">
        {/* Column Selector */}
        <div className="min-w-40">
          <label className={styles.label}>Column</label>
          <select
            value={filterColumn}
            onChange={(e) => handleColumnChange(e.target.value)}
            disabled={isDisabled}
            className={styles.select}
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
          <label className={styles.label}>Operator</label>
          <select
            value={filterOperator}
            onChange={(e) => setFilterOperator(e.target.value as FilterOperator)}
            disabled={isDisabled || !filterColumn}
            className={styles.select}
          >
            {operatorOptions.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </select>
        </div>

        {/* Value Input */}
        <div className="min-w-40">
          <label className={styles.label}>Value</label>
          {renderValueInput()}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleApply}
            disabled={isDisabled || !canApply || filterLoading}
            className={styles.buttonPrimary}
          >
            Apply Filter
          </button>
          <button onClick={handleClear} disabled={isDisabled} className={styles.buttonSecondary}>
            Clear All
          </button>
        </div>
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Active filters:</span>
          {activeFilters.map((filter, index) => (
            <span key={`${filter.column}-${index}`} className={styles.filterTag}>
              {filter.label}
              <button
                onClick={() => onRemoveFilter(index)}
                disabled={isDisabled}
                className={styles.filterTagRemove}
                aria-label={`Remove filter: ${filter.label}`}
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
