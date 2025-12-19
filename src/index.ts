// Main component
export { DataGrid } from './components/DataGrid';

// Hooks
export { useDataGrid } from './hooks';

// Types
export type {
  // Core types
  BaseRowData,
  Column,
  DataGridProps,
  ActiveFilter,
  SortConfig,
  PaginationInfo,
  LoadingState,

  // Utility types (for parent to build API calls)
  DataGridRequest,
  DataGridResponse,

  // Event callbacks
  OnPageChangeCallback,
  OnPageSizeChangeCallback,
  OnSortChangeCallback,
  OnFilterChangeCallback,
  OnSearchChangeCallback,
  OnTableRowClickCallback,
  OnTableRowDoubleClickCallback,
  OnRowSelectCallback,
  OnSelectionChangeCallback,
  OnTableRowHoverCallback,
  OnCellClickCallback,
  OnTableRefreshCallback,
  OnBulkDeleteCallback,

  // Filter-specific callbacks (NEW)
  OnApplyFilterCallback,
  OnRemoveFilterCallback,
  OnClearFiltersCallback,
} from './types';

// Themes
export { getTheme, themes } from './themes';
export type { Theme } from './themes';

// Utilities
export { formatters, compareValues } from './utils';
