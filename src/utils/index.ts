// File: src/utils/index.ts

import type { ActiveFilter, SortConfig, DataGridRequest } from '../types';

// ============================================================================
// Data Formatting Utilities
// ============================================================================

export const formatters = {
  date: (value: string, includeTime = false): string => {
    if (!value) return '';
    const date = new Date(value);
    return includeTime ? date.toLocaleString() : date.toLocaleDateString();
  },

  currency: (value: number, currency = 'USD', locale = 'en-US'): string => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(value);
  },

  number: (value: number, decimals = 0, locale = 'en-US'): string => {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  },

  truncate: (text: string, length: number): string => {
    if (!text || text.length <= length) return text;
    return text.substring(0, length) + '...';
  },

  percentage: (value: number, decimals = 0): string => {
    return `${(value * 100).toFixed(decimals)}%`;
  },
};

// ============================================================================
// Filter Comparison Functions
// ============================================================================

export const compareValues = (
  dataValue: any,
  filterValue: any,
  operator: string,
  dataType: string
): boolean => {
  if (dataValue == null) return false;

  switch (dataType) {
    case 'string':
      return compareString(dataValue, filterValue, operator);
    case 'number':
      return compareNumber(dataValue, filterValue, operator);
    case 'date':
    case 'datetime':
      return compareDate(dataValue, filterValue, operator);
    case 'boolean':
      return Boolean(dataValue) === (filterValue === 'true' || filterValue === true);
    default:
      return String(dataValue).toLowerCase().includes(String(filterValue).toLowerCase());
  }
};

const compareString = (value: any, filter: any, operator: string): boolean => {
  const str = String(value).toLowerCase();
  const filterStr = String(filter).toLowerCase();

  switch (operator) {
    case 'eq':
      return str === filterStr;
    case 'neq':
      return str !== filterStr;
    case 'contains':
      return str.includes(filterStr);
    case 'startsWith':
      return str.startsWith(filterStr);
    case 'endsWith':
      return str.endsWith(filterStr);
    default:
      return str.includes(filterStr);
  }
};

const compareNumber = (value: any, filter: any, operator: string): boolean => {
  const num = parseFloat(value);
  const filterNum = parseFloat(filter);

  if (isNaN(num) || isNaN(filterNum)) return false;

  switch (operator) {
    case 'eq':
      return num === filterNum;
    case 'neq':
      return num !== filterNum;
    case 'gt':
      return num > filterNum;
    case 'gte':
      return num >= filterNum;
    case 'lt':
      return num < filterNum;
    case 'lte':
      return num <= filterNum;
    default:
      return num === filterNum;
  }
};

const compareDate = (value: any, filter: any, operator: string): boolean => {
  const date = new Date(value).getTime();
  const filterDate = new Date(filter).getTime();

  if (isNaN(date) || isNaN(filterDate)) return false;

  switch (operator) {
    case 'eq':
      return date === filterDate;
    case 'neq':
      return date !== filterDate;
    case 'gt':
      return date > filterDate;
    case 'gte':
      return date >= filterDate;
    case 'lt':
      return date < filterDate;
    case 'lte':
      return date <= filterDate;
    default:
      return date === filterDate;
  }
};

// ============================================================================
// Sorting Utilities
// ============================================================================

export const sortData = <T>(data: T[], sortColumn: string, direction: 'asc' | 'desc'): T[] => {
  if (!sortColumn || data.length === 0) return data;

  return [...data].sort((a, b) => {
    const aVal = (a as any)[sortColumn];
    const bVal = (b as any)[sortColumn];

    // Handle nulls - always sort to end
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;

    // Compare based on type
    let result: number;

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      result = aVal - bVal;
    } else if (aVal instanceof Date && bVal instanceof Date) {
      result = aVal.getTime() - bVal.getTime();
    } else {
      // String comparison with natural sorting
      result = String(aVal).localeCompare(String(bVal), undefined, {
        numeric: true,
        sensitivity: 'base',
      });
    }

    return direction === 'desc' ? -result : result;
  });
};

// ============================================================================
// Data Type Inference
// ============================================================================

export const inferDataType = (
  value: any
): 'string' | 'number' | 'boolean' | 'date' | 'datetime' => {
  if (value == null) return 'string';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';

  if (typeof value === 'string') {
    // Check for ISO date format
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/;
    if (isoDateRegex.test(value)) {
      const date = new Date(value);
      if (!isNaN(date.getTime()) && date.getFullYear() > 1900) {
        return value.includes('T') ? 'datetime' : 'date';
      }
    }
  }

  return 'string';
};

// ============================================================================
// Column Auto-Detection
// ============================================================================

export const inferColumns = <T extends Record<string, any>>(
  data: T[]
): Array<{
  key: string;
  label: string;
  sortable: boolean;
  filterable: boolean;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'datetime';
}> => {
  if (data.length === 0) return [];

  const firstRow = data[0];
  return Object.keys(firstRow).map((key) => ({
    key,
    label: formatColumnLabel(key),
    sortable: true,
    filterable: true,
    dataType: inferDataType(firstRow[key]),
  }));
};

const formatColumnLabel = (key: string): string => {
  return key
    .replace(/([A-Z])/g, ' $1') // Add space before capitals
    .replace(/[_-]/g, ' ') // Replace underscores/hyphens with spaces
    .replace(/^\w/, (c) => c.toUpperCase()) // Capitalize first letter
    .trim();
};

// ============================================================================
// Row ID Utilities
// ============================================================================

export const generateRowId = <T extends Record<string, any>>(row: T, index: number): string => {
  // Prefer existing id field
  if (row.id !== undefined) return String(row.id);
  if (row._id !== undefined) return String(row._id);
  if (row.key !== undefined) return String(row.key);

  // Generate stable ID from content
  const contentHash = JSON.stringify(row)
    .slice(0, 50)
    .replace(/[^a-zA-Z0-9]/g, '');

  return `row-${index}-${contentHash}`;
};

// ============================================================================
// Export Helper for Building Requests (for parent component use)
// ============================================================================

export const buildRequest = (
  page: number,
  pageSize: number,
  search: string,
  filters: ActiveFilter[],
  sort: SortConfig
): DataGridRequest => ({
  page,
  pageSize,
  search,
  filters,
  sort,
});
