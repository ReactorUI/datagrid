import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DataGrid } from './DataGrid';
import { createZincTheme, defaultTheme, Theme } from '../../themes';

const testData = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
];

// =============================================================================
// Basic Rendering
// =============================================================================

describe('DataGrid', () => {
  it('renders without crashing', () => {
    render(<DataGrid data={testData} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('displays data correctly', () => {
    render(<DataGrid data={testData} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('shows empty state when no data', () => {
    render(<DataGrid data={[]} />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('auto-generates columns from data keys', () => {
    render(<DataGrid data={testData} />);
    const headers = screen.getAllByRole('columnheader');
    const headerTexts = headers.map((h) => h.textContent);
    expect(headerTexts.some((t) => t?.includes('Id'))).toBe(true);
    expect(headerTexts.some((t) => t?.includes('Name'))).toBe(true);
    expect(headerTexts.some((t) => t?.includes('Email'))).toBe(true);
  });

  it('uses custom columns when provided', () => {
    const columns = [{ key: 'name', label: 'Full Name' }];
    render(<DataGrid data={testData} columns={columns} />);
    const headers = screen.getAllByRole('columnheader');
    const headerTexts = headers.map((h) => h.textContent);
    expect(headerTexts.some((t) => t?.includes('Full Name'))).toBe(true);
    expect(headerTexts.some((t) => t?.includes('Email'))).toBe(false);
  });
});

// =============================================================================
// Selection
// =============================================================================

describe('DataGrid Selection', () => {
  it('handles row selection', async () => {
    const onSelectionChange = jest.fn();
    render(
      <DataGrid data={testData} enableSelection={true} onSelectionChange={onSelectionChange} />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]);

    await waitFor(() => {
      expect(onSelectionChange).toHaveBeenCalled();
    });
  });

  it('handles select all', async () => {
    const onSelectionChange = jest.fn();
    render(
      <DataGrid
        data={testData}
        enableSelection={true}
        onSelectionChange={onSelectionChange}
        pageSize={10}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    await waitFor(() => {
      expect(onSelectionChange).toHaveBeenCalledWith(testData);
    });
  });

  it('hides checkboxes when enableSelection is false', () => {
    render(<DataGrid data={testData} enableSelection={false} />);
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });
});

// =============================================================================
// Row Events
// =============================================================================

describe('DataGrid Row Events', () => {
  it('calls onTableRowClick when row is clicked', async () => {
    const onTableRowClick = jest.fn();
    render(<DataGrid data={testData} enableSelection={false} onTableRowClick={onTableRowClick} />);

    const row = screen.getByText('John Doe').closest('tr');
    fireEvent.click(row!);

    await waitFor(() => {
      expect(onTableRowClick).toHaveBeenCalledWith(testData[0], expect.any(Object));
    });
  });

  it('calls onTableRowDoubleClick when row is double clicked', async () => {
    const onTableRowDoubleClick = jest.fn();
    render(<DataGrid data={testData} onTableRowDoubleClick={onTableRowDoubleClick} />);

    const row = screen.getByText('John Doe').closest('tr');
    fireEvent.doubleClick(row!);

    await waitFor(() => {
      expect(onTableRowDoubleClick).toHaveBeenCalledWith(testData[0], expect.any(Object));
    });
  });
});

// =============================================================================
// Loading States
// =============================================================================

describe('DataGrid Loading States', () => {
  it('shows loading spinner when loading is true', () => {
    render(<DataGrid data={[]} loading={true} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows loading spinner when loadingState.data is true', () => {
    render(<DataGrid data={[]} loadingState={{ data: true }} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('disables filter button when loadingState.filter is true', () => {
    render(<DataGrid data={testData} enableFilters={true} loadingState={{ filter: true }} />);
    // Filter icon button should be disabled
    const filterButton = screen.getByTitle(/filter/i);
    expect(filterButton).toBeDisabled();
  });

  it('disables search input when loadingState.data is true', () => {
    render(<DataGrid data={testData} enableSearch={true} loadingState={{ data: true }} />);
    expect(screen.getByPlaceholderText('Search...')).toBeDisabled();
  });

  it('disables refresh button when loadingState.refresh is true', () => {
    render(<DataGrid data={testData} enableRefresh={true} loadingState={{ refresh: true }} />);
    expect(screen.getByTitle(/refresh/i)).toBeDisabled();
  });

  it('disables delete button when loadingState.delete is true', async () => {
    render(
      <DataGrid
        data={testData}
        enableSelection={true}
        enableDelete={true}
        loadingState={{ delete: true }}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]);

    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      const deleteButton = buttons.find(
        (btn) =>
          btn.textContent?.toLowerCase().includes('selected') ||
          btn.textContent?.toLowerCase().includes('delet')
      );
      expect(deleteButton).toBeDisabled();
    });
  });
});

// =============================================================================
// Layout (maxHeight / stickyHeader)
// =============================================================================

describe('DataGrid Layout', () => {
  it('renders without fixed layout by default', () => {
    const { container } = render(<DataGrid data={testData} />);
    const grid = container.firstChild as HTMLElement;

    expect(grid).not.toHaveClass('flex');
    expect(grid).not.toHaveClass('flex-col');
  });

  it('applies flex layout when maxHeight is set', () => {
    const { container } = render(<DataGrid data={testData} maxHeight="400px" />);
    const grid = container.firstChild as HTMLElement;

    expect(grid).toHaveClass('flex');
    expect(grid).toHaveClass('flex-col');
    expect(grid).toHaveStyle({ maxHeight: '400px' });
  });

  it('applies flex layout when stickyHeader is true', () => {
    const { container } = render(<DataGrid data={testData} stickyHeader={true} />);
    const grid = container.firstChild as HTMLElement;

    expect(grid).toHaveClass('flex');
    expect(grid).toHaveClass('flex-col');
  });

  it('converts numeric maxHeight to pixels', () => {
    const { container } = render(<DataGrid data={testData} maxHeight={500} />);
    const grid = container.firstChild as HTMLElement;

    expect(grid).toHaveStyle({ maxHeight: '500px' });
  });

  it('accepts maxHeight with vh units', () => {
    const { container } = render(<DataGrid data={testData} maxHeight="50vh" />);
    const grid = container.firstChild as HTMLElement;

    expect(grid).toHaveStyle({ maxHeight: '50vh' });
  });

  it('accepts maxHeight with calc expression', () => {
    const { container } = render(<DataGrid data={testData} maxHeight="calc(100vh - 200px)" />);
    const grid = container.firstChild as HTMLElement;

    expect(grid).toHaveStyle({ maxHeight: 'calc(100vh - 200px)' });
  });

  it('shrinks to fit content when data is empty', () => {
    const { container } = render(<DataGrid data={[]} maxHeight="400px" />);
    const grid = container.firstChild as HTMLElement;

    expect(grid).toHaveStyle({ maxHeight: '400px' });
    expect(grid.style.height).toBe('');
  });
});

// =============================================================================
// Error State
// =============================================================================

describe('DataGrid Error Handling', () => {
  it('displays error message when error prop is set', () => {
    render(<DataGrid data={[]} error="Failed to load data" />);

    expect(screen.getByText('Error loading data')).toBeInTheDocument();
    expect(screen.getByText('Failed to load data')).toBeInTheDocument();
  });

  it('shows Try Again button on error', () => {
    render(<DataGrid data={[]} error="Network error" />);

    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('calls onTableRefresh when Try Again is clicked', async () => {
    const onTableRefresh = jest.fn();
    render(<DataGrid data={[]} error="Network error" onTableRefresh={onTableRefresh} />);

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    await waitFor(() => {
      expect(onTableRefresh).toHaveBeenCalled();
    });
  });
});

// =============================================================================
// Controlled Mode (Server-Side)
// =============================================================================

describe('DataGrid Controlled Mode', () => {
  it('uses totalRecords for pagination display', () => {
    render(<DataGrid data={testData} totalRecords={100} pageSize={10} />);

    expect(screen.getByText(/of 100 records/i)).toBeInTheDocument();
  });

  it('respects currentPage prop', () => {
    render(<DataGrid data={testData} totalRecords={100} currentPage={5} pageSize={10} />);

    expect(screen.getByText(/Page 5/i)).toBeInTheDocument();
  });
});

// =============================================================================
// Pagination Edge Cases
// =============================================================================

describe('DataGrid Pagination Edge Cases', () => {
  it('handles empty data gracefully', () => {
    render(<DataGrid data={[]} pageSize={10} enableFilters={false} />);

    expect(screen.getByText(/Showing 0-0 of 0 records/)).toBeInTheDocument();
    expect(screen.getByText('Previous')).toBeDisabled();
    expect(screen.getByText('Next')).toBeDisabled();
  });

  it('handles single record', () => {
    const singleRecord = [{ id: 1, name: 'Only User' }];
    render(<DataGrid data={singleRecord} pageSize={10} enableFilters={false} />);

    expect(screen.getByText(/Showing 1-1 of 1 records/)).toBeInTheDocument();
    expect(screen.getByText('Only User')).toBeInTheDocument();
  });

  it('handles data smaller than page size', () => {
    const smallData = [
      { id: 1, name: 'User 1' },
      { id: 2, name: 'User 2' },
      { id: 3, name: 'User 3' },
    ];
    render(<DataGrid data={smallData} pageSize={10} enableFilters={false} />);

    expect(screen.getByText(/Showing 1-3 of 3 records/)).toBeInTheDocument();
    const rows = screen.getAllByRole('row');
    expect(rows.length - 1).toBe(3);
  });

  it('respects custom pageSizeOptions', () => {
    const customOptions = [15, 30, 45];
    render(
      <DataGrid
        data={testData}
        pageSize={15}
        pageSizeOptions={customOptions}
        enableFilters={false}
      />
    );

    const select = screen.getByDisplayValue('15');
    const options = select.querySelectorAll('option');

    expect(options).toHaveLength(3);
    expect(options[0]).toHaveValue('15');
    expect(options[1]).toHaveValue('30');
    expect(options[2]).toHaveValue('45');
  });

  it('shows page 1 of 1 when all data fits on one page', () => {
    render(<DataGrid data={testData} pageSize={10} enableFilters={false} />);

    expect(screen.getByText(/Page 1 of 1/)).toBeInTheDocument();
  });
});

// =============================================================================
// Theme Support
// =============================================================================

describe('DataGrid Theme', () => {
  it('renders with default theme when no theme prop provided', () => {
    const { container } = render(<DataGrid data={testData} />);
    const grid = container.firstChild as HTMLElement;

    // Default theme has gray-900 dark mode background
    expect(grid.className).toContain('dark:bg-gray-900');
  });

  it('applies custom theme overrides', () => {
    const customTheme: Partial<Theme> = {
      container: 'bg-white dark:bg-zinc-900 rounded-lg border border-zinc-700',
    };

    const { container } = render(<DataGrid data={testData} theme={customTheme} />);
    const grid = container.firstChild as HTMLElement;

    expect(grid.className).toContain('dark:bg-zinc-900');
    expect(grid.className).toContain('border-zinc-700');
  });

  it('merges custom theme with variant theme', () => {
    const customTheme: Partial<Theme> = {
      container: 'bg-white dark:bg-zinc-900 rounded-xl',
    };

    const { container } = render(
      <DataGrid data={testData} variant="striped" theme={customTheme} />
    );
    const grid = container.firstChild as HTMLElement;

    // Custom container should be used
    expect(grid.className).toContain('dark:bg-zinc-900');
    expect(grid.className).toContain('rounded-xl');
  });

  it('applies createZincTheme for zinc dark mode', () => {
    const zincTheme = createZincTheme('default');

    const { container } = render(<DataGrid data={testData} theme={zincTheme} />);
    const grid = container.firstChild as HTMLElement;

    // Zinc theme uses zinc palette
    expect(grid.className).toContain('dark:bg-zinc-900');
    expect(grid.className).toContain('dark:border-zinc-700');
  });

  it('applies theme to table rows', () => {
    const customTheme: Partial<Theme> = {
      row: 'bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800',
    };

    render(<DataGrid data={testData} theme={customTheme} enableSelection={false} />);

    const row = screen.getByText('John Doe').closest('tr');
    expect(row?.className).toContain('dark:bg-zinc-900');
    expect(row?.className).toContain('dark:hover:bg-zinc-800');
  });

  it('applies theme to selected rows', () => {
    const customTheme: Partial<Theme> = {
      selectedRow: 'bg-blue-100 dark:bg-blue-900/30',
    };

    render(<DataGrid data={testData} theme={customTheme} enableSelection={true} />);

    // Select a row
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]);

    const row = screen.getByText('John Doe').closest('tr');
    expect(row?.className).toContain('dark:bg-blue-900/30');
  });

  it('applies theme to pagination', () => {
    const customTheme: Partial<Theme> = {
      pagination: 'flex items-center justify-between px-4 py-3 bg-white dark:bg-zinc-900',
      paginationButton: 'px-3 py-1 text-sm border dark:border-zinc-700 rounded',
      paginationText: 'text-sm text-gray-700 dark:text-zinc-300',
    };

    render(<DataGrid data={testData} theme={customTheme} />);

    // Check pagination text uses theme
    expect(screen.getByText(/Showing/i).className).toContain('dark:text-zinc-300');
  });

  it('applies theme to empty state', () => {
    const customTheme: Partial<Theme> = {
      emptyState: 'text-gray-400 dark:text-zinc-500',
    };

    render(<DataGrid data={[]} theme={customTheme} />);

    expect(screen.getByText('No data available').className).toContain('dark:text-zinc-500');
  });

  it('applies theme to error state', () => {
    const customTheme: Partial<Theme> = {
      textError: 'text-red-500 dark:text-red-400',
      textMuted: 'text-gray-400 dark:text-zinc-500',
      button: 'px-3 py-2 bg-blue-600 text-white rounded-lg',
    };

    render(<DataGrid data={[]} error="Network error" theme={customTheme} />);

    expect(screen.getByText('Error loading data').className).toContain('dark:text-red-400');
    expect(screen.getByText('Network error').className).toContain('dark:text-zinc-500');
  });

  it('applies theme to search input', () => {
    const customTheme: Partial<Theme> = {
      searchInput: 'px-3 py-2 border dark:border-zinc-700 rounded dark:bg-zinc-800',
    };

    render(<DataGrid data={testData} enableSearch={true} theme={customTheme} />);

    const searchInput = screen.getByPlaceholderText('Search...');
    expect(searchInput.className).toContain('dark:border-zinc-700');
    expect(searchInput.className).toContain('dark:bg-zinc-800');
  });

  it('applies theme to select dropdown', () => {
    const customTheme: Partial<Theme> = {
      select: 'px-2 py-1 border dark:border-zinc-700 rounded dark:bg-zinc-800',
    };

    render(<DataGrid data={testData} theme={customTheme} />);

    const select = screen.getByRole('combobox');
    expect(select.className).toContain('dark:border-zinc-700');
    expect(select.className).toContain('dark:bg-zinc-800');
  });

  it('works with all variants and custom theme', () => {
    const variants: Array<'default' | 'striped' | 'bordered'> = ['default', 'striped', 'bordered'];
    const customTheme: Partial<Theme> = {
      container: 'custom-container-class',
    };

    variants.forEach((variant) => {
      const { container, unmount } = render(
        <DataGrid data={testData} variant={variant} theme={customTheme} />
      );
      const grid = container.firstChild as HTMLElement;

      expect(grid.className).toContain('custom-container-class');
      unmount();
    });
  });
});

// =============================================================================
// Theme Helper Functions
// =============================================================================

describe('Theme Helpers', () => {
  it('createZincTheme returns valid theme object', () => {
    const theme = createZincTheme('default');

    expect(theme).toHaveProperty('container');
    expect(theme).toHaveProperty('table');
    expect(theme).toHaveProperty('row');
    expect(theme).toHaveProperty('cell');
    expect(theme).toHaveProperty('headerCell');
    expect(theme).toHaveProperty('pagination');
  });

  it('createZincTheme replaces gray with zinc in dark mode classes', () => {
    const theme = createZincTheme('default');

    expect(theme.container).toContain('dark:bg-zinc-900');
    expect(theme.container).toContain('dark:border-zinc-700');
    expect(theme.row).toContain('dark:bg-zinc-900');
    expect(theme.row).toContain('dark:hover:bg-zinc-800');
  });

  it('createZincTheme works with striped variant', () => {
    const theme = createZincTheme('striped');

    expect(theme.row).toContain('odd:');
    expect(theme.row).toContain('even:');
  });

  it('createZincTheme works with bordered variant', () => {
    const theme = createZincTheme('bordered');

    expect(theme.cell).toContain('border-r');
  });

  it('defaultTheme has all required properties', () => {
    const requiredProps: (keyof Theme)[] = [
      'container',
      'table',
      'header',
      'headerCell',
      'row',
      'cell',
      'selectedRow',
      'searchInput',
      'select',
      'button',
      'buttonSecondary',
      'text',
      'textMuted',
      'textError',
      'pagination',
      'paginationButton',
      'paginationText',
      'loadingSkeleton',
      'emptyState',
      'filterDropdown',
      'filterTag',
      'filterTagRemove',
    ];

    requiredProps.forEach((prop) => {
      expect(defaultTheme).toHaveProperty(prop);
      expect(typeof defaultTheme[prop]).toBe('string');
    });
  });
});
