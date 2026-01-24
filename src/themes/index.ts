// File: src/themes/index.ts

export interface Theme {
  // Container
  container: string;

  // Table
  table: string;
  header: string;
  headerCell: string;
  row: string;
  cell: string;
  selectedRow: string;

  // Controls
  searchInput: string;
  select: string;
  button: string;
  buttonSecondary: string;
  buttonDanger: string;

  // Text
  text: string;
  textMuted: string;
  textError: string;

  // Pagination
  pagination: string;
  paginationButton: string;
  paginationText: string;

  // States
  loadingSkeleton: string;
  emptyState: string;
  errorState: string;

  // Filter
  filterDropdown: string;
  filterTag: string;
  filterTagRemove: string;
}

export const defaultTheme: Theme = {
  // Container
  container:
    'bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700',

  // Table
  table: 'w-full bg-white dark:bg-gray-800',
  header: 'bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600',
  headerCell:
    'px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-700',
  row: 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150',
  cell: 'px-4 py-3 text-sm text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600',
  selectedRow: 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30',

  // Controls
  searchInput:
    'px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400',
  select:
    'px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50',
  button:
    'px-3 py-2 bg-blue-600 dark:bg-blue-700 text-white text-sm rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed',
  buttonSecondary:
    'px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150',
  buttonDanger:
    'px-3 py-2 bg-red-600 dark:bg-red-700 text-white text-sm rounded-md hover:bg-red-700 dark:hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 disabled:opacity-50 disabled:cursor-not-allowed',

  // Text
  text: 'text-gray-700 dark:text-gray-300',
  textMuted: 'text-gray-500 dark:text-gray-400',
  textError: 'text-red-600 dark:text-red-400',

  // Pagination
  pagination:
    'flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-600',
  paginationButton:
    'px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150',
  paginationText: 'text-sm text-gray-700 dark:text-gray-300',

  // States
  loadingSkeleton: 'animate-pulse bg-gray-200 dark:bg-gray-700 rounded',
  emptyState: 'text-gray-500 dark:text-gray-400',
  errorState: 'text-red-600 dark:text-red-400',

  // Filter
  filterDropdown:
    'absolute z-50 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg',
  filterTag:
    'inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md',
  filterTagRemove: 'hover:bg-blue-200 dark:hover:bg-blue-800 rounded p-0.5 transition-colors',
};

export const stripedTheme: Theme = {
  ...defaultTheme,
  row: 'odd:bg-white dark:odd:bg-gray-800 even:bg-gray-50 dark:even:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-150',
};

export const borderedTheme: Theme = {
  ...defaultTheme,
  container:
    'bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700',
  table:
    'w-full border-collapse bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600',
  cell: 'px-4 py-3 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-600 last:border-r-0 border-b border-gray-200 dark:border-gray-600',
  headerCell:
    'px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 last:border-r-0 bg-gray-50 dark:bg-gray-700',
};

export const themes = {
  default: defaultTheme,
  striped: stripedTheme,
  bordered: borderedTheme,
};

export type ThemeVariant = keyof typeof themes;

/**
 * Get a theme by variant name, optionally merged with custom overrides
 */
export const getTheme = (
  variant: ThemeVariant = 'default',
  customTheme?: Partial<Theme>
): Theme => {
  const baseTheme = themes[variant] || themes.default;

  if (!customTheme) return baseTheme;

  // Deep merge custom theme with base theme
  return {
    ...baseTheme,
    ...customTheme,
  };
};

/**
 * Create a theme with zinc palette for dark mode (matches Smithers ThemeStyles)
 */
export const createZincTheme = (variant: ThemeVariant = 'default'): Theme => {
  const base = themes[variant] || themes.default;

  return {
    ...base,
    container: base.container
      .replace(/dark:bg-gray-900/g, 'dark:bg-zinc-900')
      .replace(/dark:border-gray-700/g, 'dark:border-zinc-700'),
    table: base.table.replace(/dark:bg-gray-800/g, 'dark:bg-zinc-900'),
    header: base.header
      .replace(/dark:bg-gray-700/g, 'dark:bg-zinc-800')
      .replace(/dark:border-gray-600/g, 'dark:border-zinc-700'),
    headerCell: base.headerCell
      .replace(/dark:text-gray-400/g, 'dark:text-zinc-400')
      .replace(/dark:bg-gray-700/g, 'dark:bg-zinc-800'),
    row: base.row
      .replace(/dark:bg-gray-800/g, 'dark:bg-zinc-900')
      .replace(/dark:hover:bg-gray-700/g, 'dark:hover:bg-zinc-800'),
    cell: base.cell
      .replace(/dark:text-gray-100/g, 'dark:text-zinc-100')
      .replace(/dark:border-gray-600/g, 'dark:border-zinc-700'),
    selectedRow: base.selectedRow.replace(/dark:bg-blue-900\/20/g, 'dark:bg-blue-900/20'),
    searchInput: base.searchInput
      .replace(/dark:border-gray-600/g, 'dark:border-zinc-700')
      .replace(/dark:bg-gray-800/g, 'dark:bg-zinc-800')
      .replace(/dark:text-gray-100/g, 'dark:text-zinc-100')
      .replace(/dark:placeholder-gray-400/g, 'dark:placeholder-zinc-500'),
    select: base.select
      .replace(/dark:border-gray-600/g, 'dark:border-zinc-700')
      .replace(/dark:bg-gray-800/g, 'dark:bg-zinc-800')
      .replace(/dark:text-gray-100/g, 'dark:text-zinc-100'),
    buttonSecondary: base.buttonSecondary
      .replace(/dark:bg-gray-700/g, 'dark:bg-zinc-800')
      .replace(/dark:text-gray-300/g, 'dark:text-zinc-300')
      .replace(/dark:hover:bg-gray-600/g, 'dark:hover:bg-zinc-700'),
    text: 'text-gray-700 dark:text-zinc-300',
    textMuted: 'text-gray-500 dark:text-zinc-500',
    pagination: base.pagination
      .replace(/dark:bg-gray-900/g, 'dark:bg-zinc-900')
      .replace(/dark:border-gray-600/g, 'dark:border-zinc-700'),
    paginationButton: base.paginationButton
      .replace(/dark:border-gray-600/g, 'dark:border-zinc-700')
      .replace(/dark:bg-gray-800/g, 'dark:bg-zinc-800')
      .replace(/dark:text-gray-300/g, 'dark:text-zinc-300')
      .replace(/dark:hover:bg-gray-700/g, 'dark:hover:bg-zinc-700'),
    paginationText: 'text-sm text-gray-700 dark:text-zinc-300',
    loadingSkeleton: 'animate-pulse bg-gray-200 dark:bg-zinc-700 rounded',
    emptyState: 'text-gray-500 dark:text-zinc-400',
    filterDropdown: base.filterDropdown
      .replace(/dark:bg-gray-800/g, 'dark:bg-zinc-800')
      .replace(/dark:border-gray-600/g, 'dark:border-zinc-700'),
  };
};
