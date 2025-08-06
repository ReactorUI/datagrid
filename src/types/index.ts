import { ReactNode, HTMLAttributes } from 'react';

// Base data types
export interface BaseRowData {
  id?: string | number;
  [key: string]: any;
}

// Column configuration
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

// Filter types
export interface ActiveFilter {
  column: string;
  operator: string;
  value: any;
  dataType: string;
  label: string;
}

// Sort configuration
export interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

// Server request/response
export interface ServerRequest {
  page: number;
  pageSize: number;
  search: string;
  sortColumn: string;
  sortDirection: 'asc' | 'desc';
  filters: ActiveFilter[];
}

export interface ServerResponse<T = BaseRowData> {
  items: T[];
  count: number;
  hasMore: boolean;
}

// HTTP configuration
export interface HttpConfig {
  bearerToken?: string;
  apiKey?: string;
  customHeaders?: Record<string, string>;
  method?: 'GET' | 'POST';
  postDataFormat?: 'form' | 'json';
  withCredentials?: boolean;
  timeout?: number;
}

// Component props
export interface DataGridProps<T = BaseRowData> extends HTMLAttributes<HTMLDivElement> {
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

  // Callbacks
  onRowSelect?: (row: T, selected: boolean) => void;
  onSelectionChange?: (selectedRows: T[]) => void;
  onRowDoubleClick?: (row: T) => void;
  onDataLoad?: (data: ServerResponse<T>) => void;
}
