// File: src/components/DataGrid/DataGrid.test.tsx

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DataGrid } from './DataGrid';

// Simple test data
const testData = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
];

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

  it('handles row selection', async () => {
    const onSelectionChange = jest.fn();
    render(
      <DataGrid data={testData} enableSelection={true} onSelectionChange={onSelectionChange} />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    const firstRowCheckbox = checkboxes[1]; // First is select all

    fireEvent.click(firstRowCheckbox);

    await waitFor(() => {
      expect(onSelectionChange).toHaveBeenCalled();
    });
  });

  it('handles select all functionality', async () => {
    const onSelectionChange = jest.fn();
    render(
      <DataGrid
        data={testData}
        enableSelection={true}
        onSelectionChange={onSelectionChange}
        pageSize={10} // Ensure all data is on one page
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    const selectAllCheckbox = checkboxes[0];

    fireEvent.click(selectAllCheckbox);

    await waitFor(() => {
      expect(onSelectionChange).toHaveBeenCalledWith(testData);
    });
  });

  it('calls onTableRowDoubleClick when row is double clicked', async () => {
    const onTableRowDoubleClick = jest.fn();
    render(<DataGrid data={testData} onTableRowDoubleClick={onTableRowDoubleClick} />);

    const firstRow = screen.getByText('John Doe').closest('tr');
    if (firstRow) {
      fireEvent.doubleClick(firstRow);
    }

    await waitFor(() => {
      expect(onTableRowDoubleClick).toHaveBeenCalledWith(testData[0], expect.any(Object));
    });
  });
});

// =============================================================================
// Loading State Tests
// =============================================================================

describe('DataGrid Loading States', () => {
  it('shows loading skeleton when loading prop is true', () => {
    const { container } = render(<DataGrid data={[]} loading={true} />);
    // Loading skeleton shows animate-pulse rows
    const skeletonRows = container.querySelectorAll('.animate-pulse');
    expect(skeletonRows.length).toBeGreaterThan(0);
  });

  it('shows loading skeleton when loadingState.data is true', () => {
    const { container } = render(<DataGrid data={[]} loadingState={{ data: true }} />);
    const skeletonRows = container.querySelectorAll('.animate-pulse');
    expect(skeletonRows.length).toBeGreaterThan(0);
  });

  it('shows spinner on Apply Filter button when loadingState.filter is true', () => {
    render(<DataGrid data={testData} enableFilters={true} loadingState={{ filter: true }} />);

    // Button should show "Applying..." text when filter loading
    expect(screen.getByText(/applying/i)).toBeInTheDocument();
  });

  it('shows normal Apply Filter button when not loading', () => {
    render(<DataGrid data={testData} enableFilters={true} />);

    const applyButton = screen.getByRole('button', { name: /apply filter/i });
    expect(applyButton).toBeInTheDocument();
  });

  it('disables search input when loadingState.data is true', () => {
    render(
      <DataGrid
        data={testData}
        enableFilters={true}
        enableSearch={true}
        loadingState={{ data: true }}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search...');
    expect(searchInput).toBeDisabled();
  });

  it('disables refresh button when loadingState.refresh is true', () => {
    render(<DataGrid data={testData} enableRefresh={true} loadingState={{ refresh: true }} />);

    const refreshButton = screen.getByTitle(/refresh/i);
    expect(refreshButton).toBeDisabled();
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

    // Select a row first
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]);

    await waitFor(() => {
      // Delete button should be disabled during delete loading
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
// Layout Tests (maxHeight and stickyHeader)
// =============================================================================

describe('DataGrid Layout', () => {
  it('renders without fixed layout by default', () => {
    const { container } = render(<DataGrid data={testData} />);
    const gridContainer = container.firstChild as HTMLElement;

    // Should not have flex layout classes
    expect(gridContainer).not.toHaveClass('flex');
    expect(gridContainer).not.toHaveClass('flex-col');
  });

  it('applies fixed layout when maxHeight is set', () => {
    const { container } = render(<DataGrid data={testData} maxHeight="400px" />);
    const gridContainer = container.firstChild as HTMLElement;

    expect(gridContainer).toHaveClass('flex');
    expect(gridContainer).toHaveClass('flex-col');
    expect(gridContainer).toHaveStyle({ height: '400px' });
  });

  it('applies fixed layout when stickyHeader is true', () => {
    const { container } = render(<DataGrid data={testData} stickyHeader={true} />);
    const gridContainer = container.firstChild as HTMLElement;

    expect(gridContainer).toHaveClass('flex');
    expect(gridContainer).toHaveClass('flex-col');
  });

  it('accepts maxHeight as number', () => {
    const { container } = render(<DataGrid data={testData} maxHeight={500} />);
    const gridContainer = container.firstChild as HTMLElement;

    expect(gridContainer).toHaveStyle({ height: '500px' });
  });

  it('accepts maxHeight as vh units', () => {
    const { container } = render(<DataGrid data={testData} maxHeight="50vh" />);
    const gridContainer = container.firstChild as HTMLElement;

    expect(gridContainer).toHaveStyle({ height: '50vh' });
  });

  it('accepts maxHeight as calc expression', () => {
    const { container } = render(<DataGrid data={testData} maxHeight="calc(100vh - 200px)" />);
    const gridContainer = container.firstChild as HTMLElement;

    expect(gridContainer).toHaveStyle({ height: 'calc(100vh - 200px)' });
  });
});

// =============================================================================
// Error State Tests
// =============================================================================

describe('DataGrid Error Handling', () => {
  it('displays error message when error prop is set', () => {
    render(<DataGrid data={[]} error="Failed to load data" />);

    expect(screen.getByText('Error loading data')).toBeInTheDocument();
    expect(screen.getByText('Failed to load data')).toBeInTheDocument();
  });

  it('shows Try Again button on error', () => {
    render(<DataGrid data={[]} error="Network error" />);

    const tryAgainButton = screen.getByRole('button', { name: /try again/i });
    expect(tryAgainButton).toBeInTheDocument();
  });

  it('calls onTableRefresh when Try Again is clicked', async () => {
    const onTableRefresh = jest.fn();
    render(<DataGrid data={[]} error="Network error" onTableRefresh={onTableRefresh} />);

    const tryAgainButton = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(tryAgainButton);

    await waitFor(() => {
      expect(onTableRefresh).toHaveBeenCalled();
    });
  });
});

// =============================================================================
// Controlled Mode Tests (Server-Side)
// =============================================================================

describe('DataGrid Controlled Mode', () => {
  it('uses totalRecords for pagination when provided', () => {
    render(<DataGrid data={testData} totalRecords={100} pageSize={10} />);

    expect(screen.getByText(/of 100 records/i)).toBeInTheDocument();
  });

  it('respects currentPage prop', () => {
    render(<DataGrid data={testData} totalRecords={100} currentPage={5} pageSize={10} />);

    expect(screen.getByText(/Page 5/i)).toBeInTheDocument();
  });
});
