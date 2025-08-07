import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DataGrid } from './DataGrid';

const testData = [
  { id: 1, name: 'John Doe', email: 'john@example.com', age: 30 },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 25 },
];

describe('DataGrid Events', () => {
  it('calls onPageChange when page changes', async () => {
    const onPageChange = jest.fn();
    render(<DataGrid data={testData} pageSize={1} onPageChange={onPageChange} />);

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(onPageChange).toHaveBeenCalledWith(2, expect.any(Object));
    });
  });

  it('calls onSortChange when sorting changes', async () => {
    const onSortChange = jest.fn();
    render(<DataGrid data={testData} enableSorting={true} onSortChange={onSortChange} />);

    // Find the Name header in the table header (more specific)
    const tableHeaders = screen.getAllByRole('columnheader');
    const nameHeader = tableHeaders.find((header) => header.textContent?.includes('Name'));

    expect(nameHeader).toBeInTheDocument();
    if (nameHeader) {
      fireEvent.click(nameHeader);
    }

    await waitFor(() => {
      expect(onSortChange).toHaveBeenCalledWith({
        column: 'name',
        direction: 'asc',
      });
    });
  });

  it('calls onSearchChange when search term changes', async () => {
    const onSearchChange = jest.fn();
    render(<DataGrid data={testData} enableSearch={true} onSearchChange={onSearchChange} />);

    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.change(searchInput, { target: { value: 'John' } });

    await waitFor(() => {
      expect(onSearchChange).toHaveBeenCalledWith('John');
    });
  });

  it('calls onTableRowClick when row is clicked', async () => {
    const onTableRowClick = jest.fn();
    render(<DataGrid data={testData} enableSelection={false} onTableRowClick={onTableRowClick} />);

    const firstRow = screen.getByText('John Doe').closest('tr');
    if (firstRow) {
      fireEvent.click(firstRow);
    }

    await waitFor(() => {
      expect(onTableRowClick).toHaveBeenCalledWith(testData[0], expect.any(Object));
    });
  });

  it('calls onTableRefresh when refresh button is clicked', async () => {
    const onTableRefresh = jest.fn();
    render(
      <DataGrid
        data={testData}
        enableRefresh={true} // ✅ FIXED: Explicitly enable refresh
        onTableRefresh={onTableRefresh}
      />
    );

    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(onTableRefresh).toHaveBeenCalled();
    });
  });

  it('handles pagination correctly', async () => {
    const onPageChange = jest.fn();
    render(<DataGrid data={testData} pageSize={1} onPageChange={onPageChange} />);

    // Should show "Page 1 of 2"
    expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument();

    // Click next
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(onPageChange).toHaveBeenCalledWith(
        2,
        expect.objectContaining({
          currentPage: 2,
          totalPages: 2,
        })
      );
    });
  });

  it('does not show refresh button by default', () => {
    render(<DataGrid data={testData} />);
    expect(screen.queryByText('Refresh')).not.toBeInTheDocument();
  });

  it('shows refresh button when enableRefresh is true', () => {
    render(<DataGrid data={testData} enableRefresh={true} />);
    expect(screen.getByText('Refresh')).toBeInTheDocument();
  });
});
