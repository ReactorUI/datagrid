import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DataGrid } from './DataGrid';

const sampleData = [
  { id: 1, name: 'John Doe', email: 'john@example.com', age: 28 },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 34 },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', age: 45 },
];

describe('DataGrid', () => {
  it('renders data correctly', () => {
    render(<DataGrid data={sampleData} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
  });

  it('renders search input when search is enabled', () => {
    render(<DataGrid data={sampleData} enableSearch={true} />);

    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('filters data based on search term', async () => {
    render(<DataGrid data={sampleData} enableSearch={true} />);

    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.change(searchInput, { target: { value: 'John' } });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });
  });

  it('handles column sorting', async () => {
    render(<DataGrid data={sampleData} enableSorting={true} />);

    const nameHeader = screen.getByText('Name');
    fireEvent.click(nameHeader);

    // After sorting, Bob should come before John (alphabetical order)
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Bob Johnson');
  });

  it('shows empty state when no data', () => {
    render(<DataGrid data={[]} />);

    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('handles row selection', async () => {
    const onSelectionChange = jest.fn();
    render(
      <DataGrid data={sampleData} enableSelection={true} onSelectionChange={onSelectionChange} />
    );

    const firstCheckbox = screen.getAllByRole('checkbox')[1]; // First is select all
    fireEvent.click(firstCheckbox);

    await waitFor(() => {
      expect(onSelectionChange).toHaveBeenCalledWith([sampleData[0]]);
    });
  });

  it('handles select all functionality', async () => {
    const onSelectionChange = jest.fn();
    render(
      <DataGrid
        data={sampleData}
        enableSelection={true}
        onSelectionChange={onSelectionChange}
        pageSize={10} // Ensure all data is on one page
      />
    );

    const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(selectAllCheckbox);

    await waitFor(() => {
      expect(onSelectionChange).toHaveBeenCalledWith(sampleData);
    });
  });

  it('handles pagination', async () => {
    render(<DataGrid data={sampleData} pageSize={2} />);

    // Should show first 2 items
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();

    // Click next page
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });
  });

  it('calls onRowDoubleClick when row is double clicked', async () => {
    const onRowDoubleClick = jest.fn();
    render(<DataGrid data={sampleData} onRowDoubleClick={onRowDoubleClick} />);

    const firstRow = screen.getByText('John Doe').closest('tr');
    if (firstRow) {
      fireEvent.doubleClick(firstRow);
    }

    await waitFor(() => {
      expect(onRowDoubleClick).toHaveBeenCalledWith(sampleData[0]);
    });
  });
});
