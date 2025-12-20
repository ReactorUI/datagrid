// File: src/components/Filter/FilterControls.tsx

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
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
  disabled?: boolean;
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
// Styles
// ============================================================================

const styles = {
  select:
    'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed',
  input:
    'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:cursor-not-allowed',
  inputDisabled:
    'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed',
  buttonPrimary:
    'w-full px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white text-sm rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed transition-colors duration-150',
  buttonSecondary:
    'w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150',
  filterTag:
    'flex items-center justify-between gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-md text-sm',
  filterTagRemove:
    'text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100 focus:outline-none transition-colors duration-150',
  label: 'block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1',
};

// ============================================================================
// Filter Icon
// ============================================================================

const FilterIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
    />
  </svg>
);

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
  const [isOpen, setIsOpen] = useState(false);
  const [filterColumn, setFilterColumn] = useState('');
  const [filterOperator, setFilterOperator] = useState<FilterOperator>('eq');
  const [filterValue, setFilterValue] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const isDisabled = disabled || filterLoading;
  const filterCount = activeFilters.length;

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        buttonRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

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

    // Reset form and close popover
    setFilterColumn('');
    setFilterOperator('eq');
    setFilterValue('');
    setIsOpen(false);
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
    <div className="relative inline-block">
      {/* Filter Button with Badge */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isDisabled}
        title={
          filterCount > 0
            ? `${filterCount} filter${filterCount === 1 ? '' : 's'} active`
            : 'Add filter'
        }
        className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
      >
        <FilterIcon className="w-5 h-5" />
        {filterCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-xs font-medium text-white bg-blue-600 dark:bg-blue-500 rounded-full">
            {filterCount}
          </span>
        )}
      </button>

      {/* Popover */}
      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
        >
          <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Filter</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Column */}
            <div>
              <label className={styles.label}>Column</label>
              <select
                value={filterColumn}
                onChange={(e) => handleColumnChange(e.target.value)}
                disabled={isDisabled}
                className={styles.select}
              >
                <option value="">Select column</option>
                {filterableColumns.map((col) => (
                  <option key={String(col.key)} value={String(col.key)}>
                    {col.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Operator */}
            <div>
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

            {/* Value */}
            <div>
              <label className={styles.label}>Value</label>
              {renderValueInput()}
            </div>

            {/* Apply Button */}
            <button
              onClick={handleApply}
              disabled={isDisabled || !canApply}
              className={styles.buttonPrimary}
            >
              Apply Filter
            </button>

            {/* Active Filters */}
            {activeFilters.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Active Filters
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {activeFilters.map((filter, index) => (
                    <div key={`${filter.column}-${index}`} className={styles.filterTag}>
                      <span className="truncate">{filter.label}</span>
                      <button
                        onClick={() => onRemoveFilter(index)}
                        disabled={isDisabled}
                        className={styles.filterTagRemove}
                        aria-label={`Remove filter: ${filter.label}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleClear}
                  disabled={isDisabled}
                  className={styles.buttonSecondary}
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
