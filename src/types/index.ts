import { ReactNode, HTMLAttributes } from 'react';

// Base data types
export interface BaseRowData {
  id?: string | number;
  [key: string]: any;
}

// Column configuration (unchanged)
export interface Column<T = BaseRowData> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  dataType?: 'string' | 'number' | 'boolean' | 'date' | 'datetime';
  width?: string | number;
  minWidth?: string | number;
  maxWidth?: string | number;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T, index: number) => ReactNode;
}

// Filter types (unchanged)
export interface ActiveFilter {
  column: string;
  operator: string;
  value: any;
  dataType: string;
  label: string;
}

// Sort configuration (unchanged)
export interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

// Simplified pagination info
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalRecords: number;
  start: number;
  end: number;
  hasNext: boolean;
  hasPrevious: boolean;
  continuationToken?: string;
}

// Simplified server request (no sorting - that's client-side only)
export interface ServerRequest {
  page: number;
  pageSize: number;
  search: string;
  filters: ActiveFilter[];
  continuationToken?: string;
}

// Simplified server response - exactly what you specified
export interface ServerResponse<T = BaseRowData> {
  Items: T[];
  ContinuationToken?: string;
  HasMore: boolean;
  Count: number;
}

// HTTP configuration (unchanged)
export interface HttpConfig {
  bearerToken?: string;
  apiKey?: string;
  customHeaders?: Record<string, string>;
  method?: 'GET' | 'POST';
  postDataFormat?: 'form' | 'json';
  withCredentials?: boolean;
  timeout?: number;
}

// Event callback types (keeping existing ones, simplified)
export type OnDataLoadCallback<T = BaseRowData> = (data: ServerResponse<T>) => void;
export type OnDataErrorCallback = (error: Error, context: string) => void;
export type OnLoadingStateChangeCallback = (loading: boolean, context: string) => void;
export type OnPageChangeCallback = (page: number, paginationInfo: PaginationInfo) => void;
export type OnPageSizeChangeCallback = (pageSize: number, paginationInfo: PaginationInfo) => void;
export type OnSortChangeCallback = (sortConfig: SortConfig) => void;
export type OnFilterChangeCallback = (filters: ActiveFilter[]) => void;
export type OnSearchChangeCallback = (searchTerm: string) => void;
export type OnTableRowClickCallback<T = BaseRowData> = (row: T, event: React.MouseEvent) => void;
export type OnTableRowDoubleClickCallback<T = BaseRowData> = (
  row: T,
  event: React.MouseEvent
) => boolean | void;
export type OnRowSelectCallback<T = BaseRowData> = (row: T, isSelected: boolean) => void;
export type OnSelectionChangeCallback<T = BaseRowData> = (selectedRows: T[]) => void;
export type OnTableRowHoverCallback<T = BaseRowData> = (
  row: T | null,
  event: React.MouseEvent
) => void;
export type OnCellClickCallback<T = BaseRowData> = (
  value: any,
  row: T,
  column: Column<T>,
  event: React.MouseEvent
) => void;
export type OnTableRefreshCallback = () => void;

// Simplified component props
export interface DataGridProps<T = BaseRowData>
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onError'> {
  // Data
  data?: T[];
  endpoint?: string;
  columns?: Column<T>[];

  // Features
  enableSearch?: boolean;
  enableSorting?: boolean;
  enableFilters?: boolean;
  enableSelection?: boolean;

  // Pagination
  pageSize?: number;
  serverPageSize?: number;
  pageSizeOptions?: number[];

  // HTTP
  httpConfig?: HttpConfig;

  // Styling
  className?: string;
  variant?: 'default' | 'striped' | 'bordered';
  size?: 'sm' | 'md' | 'lg';

  // Event callbacks
  onDataLoad?: OnDataLoadCallback<T>;
  onDataError?: OnDataErrorCallback;
  onLoadingStateChange?: OnLoadingStateChangeCallback;
  onPageChange?: OnPageChangeCallback;
  onPageSizeChange?: OnPageSizeChangeCallback;
  onSortChange?: OnSortChangeCallback;
  onFilterChange?: OnFilterChangeCallback;
  onSearchChange?: OnSearchChangeCallback;
  onTableRefresh?: OnTableRefreshCallback;
  onTableRowClick?: OnTableRowClickCallback<T>;
  onTableRowDoubleClick?: OnTableRowDoubleClickCallback<T>;
  onRowSelect?: OnRowSelectCallback<T>;
  onSelectionChange?: OnSelectionChangeCallback<T>;
  onTableRowHover?: OnTableRowHoverCallback<T>;
  onCellClick?: OnCellClickCallback<T>;
}
