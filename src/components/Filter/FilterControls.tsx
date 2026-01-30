// File: src/components/Filter/FilterControls.tsx

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Column, ActiveFilter, FilterOperator } from '../../types';
import { Theme } from '../../themes';

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
  theme: Theme;
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
  theme,
}: FilterControlsProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filterColumn, setFilterColumn] = useState('');
  const [filterOperator, setFilterOperator] = useState<FilterOperator>('eq');
  const [filterValue, setFilterValue] = useState('');
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const isDisabled = disabled || filterLoading;
  const filterCount = activeFilters.length;

  // Calculate popover position relative to viewport with edge detection
  const updatePopoverPosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const popoverWidth = 320; // w-80
      const viewportWidth = window.innerWidth;

      // Adjust left position if popover would overflow right edge
      let left = rect.left;
      if (left + popoverWidth > viewportWidth - 16) {
        left = Math.max(16, viewportWidth - popoverWidth - 16);
      }

      setPopoverPosition({
        top: rect.bottom + 8,
        left,
      });
    }
  }, []);

  // Update position when opening
  useEffect(() => {
    if (isOpen) {
      updatePopoverPosition();
      window.addEventListener('scroll', updatePopoverPosition, true);
      window.addEventListener('resize', updatePopoverPosition);
      return () => {
        window.removeEventListener('scroll', updatePopoverPosition, true);
        window.removeEventListener('resize', updatePopoverPosition);
      };
    }
  }, [isOpen, updatePopoverPosition]);

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
    const inputClass = `w-full px-3 py-2.5 ${theme.searchInput}`;
    const disabledClass = `w-full px-3 py-2.5 ${theme.select} opacity-50 cursor-not-allowed`;

    if (!selectedColumn) {
      return (
        <input
          type="text"
          disabled
          value=""
          placeholder="Select column first"
          className={disabledClass}
        />
      );
    }

    const commonProps = {
      value: filterValue,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setFilterValue(e.target.value),
      onKeyDown: handleKeyDown,
      disabled: isDisabled,
      className: inputClass,
    };

    switch (selectedColumn.dataType) {
      case 'boolean':
        return (
          <select {...commonProps} className={`w-full px-3 py-2.5 ${theme.select}`}>
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
    <div className="flex items-center gap-2 min-w-0 flex-1">
      {/* Filter Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isDisabled}
        title={
          filterCount > 0
            ? `${filterCount} filter${filterCount === 1 ? '' : 's'} active`
            : 'Add filter'
        }
        className={`relative flex-shrink-0 p-2 ${theme.text} ${theme.buttonSecondary.replace(/px-3 py-2/g, '')} rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150`}
      >
        <FilterIcon className="w-5 h-5" />
        {filterCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-xs font-medium text-white bg-blue-600 dark:bg-blue-500 rounded-full">
            {filterCount}
          </span>
        )}
      </button>

      {/* Active Filter Tags - Horizontal Scrollable */}
      {activeFilters.length > 0 && (
        <div
          className="flex-1 min-w-0 overflow-x-auto"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="flex items-center gap-1.5 py-0.5">
            {activeFilters.map((filter, index) => (
              <span key={`${filter.column}-${index}`} className={theme.filterTag}>
                {filter.label}
                <button
                  onClick={() => onRemoveFilter(index)}
                  disabled={isDisabled}
                  className={theme.filterTagRemove}
                  aria-label={`Remove filter: ${filter.label}`}
                >
                  ×
                </button>
              </span>
            ))}
            {activeFilters.length > 1 && (
              <button
                onClick={onClearFilters}
                disabled={isDisabled}
                className={`flex-shrink-0 text-xs ${theme.textError} whitespace-nowrap px-2 py-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors`}
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      )}

      {/* Popover - Rendered via Portal to escape parent overflow */}
      {isOpen &&
        createPortal(
          <div
            ref={popoverRef}
            className={`fixed w-80 ${theme.filterDropdown}`}
            style={{
              top: popoverPosition.top,
              padding: 14,
              left: popoverPosition.left,
              zIndex: 99999,
            }}
          >
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3
                  className={`text-base font-semibold ${theme.text.replace('text-gray-700', 'text-gray-900').replace('dark:text-zinc-300', 'dark:text-zinc-100')}`}
                >
                  Add Filter
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className={`p-1 ${theme.textMuted} hover:${theme.text} rounded-md ${theme.buttonSecondary.replace(/px-3 py-2 bg-\S+ /g, '')} transition-colors`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <label className={`block text-sm font-medium ${theme.text} mb-1.5`}>Column</label>
                <select
                  value={filterColumn}
                  onChange={(e) => handleColumnChange(e.target.value)}
                  disabled={isDisabled}
                  className={`w-full px-3 py-2.5 ${theme.select}`}
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
                <label className={`block text-sm font-medium ${theme.text} mb-1.5`}>Operator</label>
                <select
                  value={filterOperator}
                  onChange={(e) => setFilterOperator(e.target.value as FilterOperator)}
                  disabled={isDisabled || !filterColumn}
                  className={`w-full px-3 py-2.5 ${theme.select}`}
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
                <label className={`block text-sm font-medium ${theme.text} mb-1.5`}>Value</label>
                {renderValueInput()}
              </div>

              {/* Apply Button */}
              <button
                onClick={handleApply}
                disabled={isDisabled || !canApply}
                className={`w-full px-4 py-2.5 ${theme.button} font-medium`}
              >
                Apply Filter
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
