// File: src/types/index.ts

import { ReactNode, HTMLAttributes } from 'react';

// ============================================================================
// Core Data Types
// ============================================================================

export interface BaseRowData {
  id?: string | number;
  [key: string]: any;
}

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

// ============================================================================
// Filter Types
// ============================================================================

export type FilterOperator =
  | 'eq'
  | 'neq' // All types
  | 'contains'
  | 'startsWith'
  | 'endsWith' // String
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'; // Number/Date

export interface ActiveFilter {
  column: string;
  operator: FilterOperator | string;
  value: any;
  dataType: string;
  label: string;
}

// ============================================================================
// Sort & Pagination
// ============================================================================

export interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalRecords: number;
  start: number;
  end: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// ============================================================================
// Loading State - Granular control
// ============================================================================

export interface LoadingState {
  /** Data is being fetched (shows table skeleton, disables all controls) */
  data?: boolean;
  /** Filter is being applied */
  filter?: boolean;
  /** Search is being executed */
  search?: boolean;
  /** Refresh is in progress */
  refresh?: boolean;
  /** Delete operation is in progress */
  delete?: boolean;
}

// ============================================================================
// DEPRECATED - Server-side Types (kept for backward compatibility)
// ============================================================================

/**
 * @deprecated Use controlled mode instead. Pass data directly and handle fetching in parent.
 */
export interface HttpConfig {
  bearerToken?: string;
  apiKey?: string;
  customHeaders?: Record<string, string>;
  method?: 'GET' | 'POST';
  postDataFormat?: 'json' | 'formdata';
}

/**
 * @deprecated Use controlled mode instead.
 */
export interface ServerRequest {
  page: number;
  pageSize: number;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  searchTerm?: string;
  filters?: ActiveFilter[];
}

/**
 * @deprecated Use controlled mode instead.
 */
export interface ServerResponse<T = BaseRowData> {
  items: T[];
  totalRecords: number;
  page?: number;
  pageSize?: number;
}

/**
 * @deprecated Use controlled mode instead.
 */
export type OnDataLoadCallback<T = BaseRowData> = (response: ServerResponse<T>) => void;

/**
 * @deprecated Use controlled mode instead.
 */
export type OnDataErrorCallback = (error: Error, context: string) => void;

/**
 * @deprecated Use loadingState prop instead.
 */
export type OnLoadingStateChangeCallback = (loading: boolean, context: string) => void;

// ============================================================================
// Event Callback Types
// ============================================================================

// Pagination Events
export type OnPageChangeCallback = (page: number, paginationInfo: PaginationInfo) => void;
export type OnPageSizeChangeCallback = (pageSize: number) => void;

// Sort & Filter Events
export type OnSortChangeCallback = (sortConfig: SortConfig) => void;
export type OnSearchChangeCallback = (searchTerm: string) => void;

// Filter Events - Separate callbacks for filter actions
export type OnApplyFilterCallback = (filter: ActiveFilter, allFilters: ActiveFilter[]) => void;
export type OnRemoveFilterCallback = (
  removedFilter: ActiveFilter,
  remainingFilters: ActiveFilter[]
) => void;
export type OnClearFiltersCallback = () => void;
export type OnFilterChangeCallback = (filters: ActiveFilter[]) => void;

// Row & Cell Events
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

// Action Events
export type OnTableRefreshCallback = () => void;
export type OnBulkDeleteCallback<T = BaseRowData> = (selectedRows: T[]) => void;

// ============================================================================
// Component Props - Clean, Presentation-Focused
// ============================================================================

export interface DataGridProps<T = BaseRowData>
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onError'> {
  // ===== DATA (Required) =====
  /** The data array to display - parent is responsible for fetching/filtering */
  data: T[];

  // ===== COLUMN CONFIGURATION =====
  /** Column definitions - auto-detected if not provided */
  columns?: Column<T>[];

  // ===== LOADING STATE =====
  /**
   * Granular loading states for different actions.
   * @example { data: true } - Shows table skeleton
   * @example { filter: true } - Shows spinner on Apply Filter button
   * @example { refresh: true } - Shows spinner on Refresh button
   */
  loadingState?: LoadingState;

  /**
   * Simple loading flag - sets loadingState.data = true.
   * Use this OR loadingState, not both.
   * @deprecated Prefer loadingState for granular control
   */
  loading?: boolean;

  // ===== EXTERNAL STATE (for server-side scenarios) =====
  /** Total records for pagination display (server-side) */
  totalRecords?: number;
  /** Whether more data is available (server-side) */
  hasMore?: boolean;
  /** Error message to display */
  error?: string | null;

  // ===== FEATURE TOGGLES =====
  enableSearch?: boolean;
  enableSorting?: boolean;
  enableFilters?: boolean;
  enableSelection?: boolean;
  enableDelete?: boolean;
  enableRefresh?: boolean;
  deleteConfirmation?: boolean;

  /**
   * Filter behavior mode:
   * - 'client' (default): Filters data locally, no onApplyFilter callback fired
   * - 'server': Fires onApplyFilter callback only, no local filtering
   * - 'both': Filters locally AND fires callback
   */
  filterMode?: 'client' | 'server' | 'both';

  // ===== PAGINATION =====
  pageSize?: number;
  pageSizeOptions?: number[];
  /** Current page (controlled mode for server-side) */
  currentPage?: number;

  // ===== LAYOUT =====
  /**
   * Set a max height for the grid - enables scrollable table body.
   * Can be any CSS value: '400px', '50vh', 'calc(100vh - 200px)'
   */
  maxHeight?: string | number;
  /**
   * Keep table header visible while scrolling (sticky header).
   * Automatically enabled when maxHeight is set.
   */
  stickyHeader?: boolean;

  // ===== STYLING =====
  className?: string;
  variant?: 'default' | 'striped' | 'bordered';
  size?: 'sm' | 'md' | 'lg';

  // ===== PAGINATION EVENTS =====
  onPageChange?: OnPageChangeCallback;
  onPageSizeChange?: OnPageSizeChangeCallback;

  // ===== SORT & SEARCH EVENTS =====
  onSortChange?: OnSortChangeCallback;
  onSearchChange?: OnSearchChangeCallback;

  // ===== FILTER EVENTS (Enhanced) =====
  /** Called when Apply Filter button is clicked */
  onApplyFilter?: OnApplyFilterCallback;
  /** Called when a filter tag is removed */
  onRemoveFilter?: OnRemoveFilterCallback;
  /** Called when Clear All is clicked */
  onClearFilters?: OnClearFiltersCallback;
  /** Called whenever filters change (convenience callback) */
  onFilterChange?: OnFilterChangeCallback;

  // ===== ROW & CELL EVENTS =====
  onTableRowClick?: OnTableRowClickCallback<T>;
  onTableRowDoubleClick?: OnTableRowDoubleClickCallback<T>;
  onRowSelect?: OnRowSelectCallback<T>;
  onSelectionChange?: OnSelectionChangeCallback<T>;
  onTableRowHover?: OnTableRowHoverCallback<T>;
  onCellClick?: OnCellClickCallback<T>;

  // ===== ACTION EVENTS =====
  onTableRefresh?: OnTableRefreshCallback;
  onBulkDelete?: OnBulkDeleteCallback<T>;

  // ===== DEPRECATED PROPS (kept for backward compatibility) =====

  /**
   * @deprecated Use controlled mode instead. Fetch data in parent and pass via `data` prop.
   * Will be removed in next major version.
   */
  endpoint?: string;

  /**
   * @deprecated Use controlled mode instead.
   * Will be removed in next major version.
   */
  httpConfig?: HttpConfig;

  /**
   * @deprecated Use `pageSize` prop instead.
   * Will be removed in next major version.
   */
  serverPageSize?: number;

  /**
   * @deprecated Use controlled mode. Handle data loading in parent component.
   * Will be removed in next major version.
   */
  onDataLoad?: OnDataLoadCallback<T>;

  /**
   * @deprecated Use `error` prop instead.
   * Will be removed in next major version.
   */
  onDataError?: OnDataErrorCallback;

  /**
   * @deprecated Use `loadingState` prop instead.
   * Will be removed in next major version.
   */
  onLoadingStateChange?: OnLoadingStateChangeCallback;
}

// ============================================================================
// Utility Types for External Use
// ============================================================================

/** Request object that parent can use to build API calls */
export interface DataGridRequest {
  page: number;
  pageSize: number;
  search: string;
  filters: ActiveFilter[];
  sort: SortConfig;
}

/** Helper type for building API responses */
export interface DataGridResponse<T = BaseRowData> {
  items: T[];
  totalRecords: number;
  hasMore?: boolean;
}
