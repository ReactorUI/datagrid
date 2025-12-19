import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DataGrid } from './DataGrid';

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

  it('disables Apply Filter button when loadingState.filter is true', () => {
    render(<DataGrid data={testData} enableFilters={true} loadingState={{ filter: true }} />);
    const applyButton = screen.getByRole('button', { name: /apply filter/i });
    expect(applyButton).toBeDisabled();
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
