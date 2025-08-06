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
  container: 'bg-white rounded-lg shadow-sm border border-gray-200',
  table: 'w-full',
  header: 'bg-gray-50 border-b border-gray-200',
  headerCell: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
  row: 'hover:bg-gray-50 transition-colors duration-150',
  cell: 'px-4 py-3 text-sm text-gray-900',
  selectedRow: 'bg-blue-50 hover:bg-blue-100',
  searchInput:
    'px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
  button:
    'px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500',
  pagination: 'flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200',
};

export const stripedTheme: Theme = {
  ...defaultTheme,
  row: 'odd:bg-gray-50 even:bg-white hover:bg-gray-100 transition-colors duration-150',
};

export const borderedTheme: Theme = {
  ...defaultTheme,
  container: 'bg-white rounded-lg shadow-sm border border-gray-200',
  table: 'w-full border-collapse',
  cell: 'px-4 py-3 text-sm text-gray-900 border-r border-gray-200 last:border-r-0',
  headerCell:
    'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 last:border-r-0',
};

export const themes = {
  default: defaultTheme,
  striped: stripedTheme,
  bordered: borderedTheme,
};

export const getTheme = (variant: keyof typeof themes = 'default'): Theme => {
  return themes[variant] || themes.default;
};
