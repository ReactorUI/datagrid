export interface Theme {
  container: string;
  table: string;
  header: string;
  headerCell: string;
  row: string;
  cell: string;
  selectedRow: string;
  searchInput: string;
  button: string;
  pagination: string;
}

export const defaultTheme: Theme = {
  container:
    'bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700',
  table: 'w-full bg-white dark:bg-gray-800',
  header: 'bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600',
  headerCell:
    'px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-700',
  row: 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150',
  cell: 'px-4 py-3 text-sm text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600',
  selectedRow: 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30',
  searchInput:
    'px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400',
  button:
    'px-3 py-2 bg-blue-600 dark:bg-blue-700 text-white text-sm rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed',
  pagination:
    'flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-600',
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

export const getTheme = (variant: keyof typeof themes = 'default'): Theme => {
  return themes[variant] || themes.default;
};
