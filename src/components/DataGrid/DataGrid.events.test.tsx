// File: src/components/DataGrid/DataGrid.events.test.tsx

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
    render(<DataGrid data={testData} enableRefresh={true} onTableRefresh={onTableRefresh} />);

    const refreshButton = screen.getByTitle(/refresh data/i);
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
    expect(screen.queryByTitle(/refresh data/i)).not.toBeInTheDocument();
  });

  it('shows refresh button when enableRefresh is true', () => {
    render(<DataGrid data={testData} enableRefresh={true} />);
    expect(screen.getByTitle(/refresh data/i)).toBeInTheDocument();
  });

  // Delete functionality tests
  it('does not show delete button by default', () => {
    render(<DataGrid data={testData} enableSelection={true} />);
    expect(screen.queryByTitle(/select rows to delete/i)).not.toBeInTheDocument();
  });

  it('shows delete button when enableDelete is true', () => {
    render(<DataGrid data={testData} enableSelection={true} enableDelete={true} />);

    const deleteButton = screen.getByTitle(/select rows to delete/i);
    expect(deleteButton).toBeInTheDocument();
    expect(deleteButton).toBeDisabled(); // Should be disabled when no rows selected
  });

  it('does not show delete button when enableSelection is false', () => {
    render(<DataGrid data={testData} enableSelection={false} enableDelete={true} />);

    expect(screen.queryByTitle(/select rows to delete/i)).not.toBeInTheDocument();
  });

  it('enables delete button when rows are selected', async () => {
    render(<DataGrid data={testData} enableSelection={true} enableDelete={true} />);

    // Initially disabled
    const deleteButton = screen.getByTitle(/select rows to delete/i);
    expect(deleteButton).toBeDisabled();

    // Select a row
    const checkboxes = screen.getAllByRole('checkbox');
    const firstRowCheckbox = checkboxes[1]; // First is select all
    fireEvent.click(firstRowCheckbox);

    // Should now be enabled with count
    await waitFor(() => {
      expect(deleteButton).toBeEnabled();
      expect(deleteButton).toHaveTextContent('(1 selected)');
    });
  });

  it('calls onBulkDelete when delete button is clicked without confirmation', async () => {
    const onBulkDelete = jest.fn();
    render(
      <DataGrid
        data={testData}
        enableSelection={true}
        enableDelete={true}
        deleteConfirmation={false}
        onBulkDelete={onBulkDelete}
      />
    );

    // Select a row
    const checkboxes = screen.getAllByRole('checkbox');
    const firstRowCheckbox = checkboxes[1];
    fireEvent.click(firstRowCheckbox);

    // Click delete
    const deleteButton = screen.getByTitle(/delete 1 selected item/i);
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(onBulkDelete).toHaveBeenCalledWith([testData[0]]);
    });
  });

  it('shows confirmation dialog when deleteConfirmation is true', async () => {
    const onBulkDelete = jest.fn();
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <DataGrid
        data={testData}
        enableSelection={true}
        enableDelete={true}
        deleteConfirmation={true}
        onBulkDelete={onBulkDelete}
      />
    );

    // Select multiple rows
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]); // First row
    fireEvent.click(checkboxes[2]); // Second row

    // Click delete
    const deleteButton = screen.getByTitle(/delete 2 selected item/i);
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete 2 selected items?');
      expect(onBulkDelete).toHaveBeenCalledWith(testData);
    });

    confirmSpy.mockRestore();
  });

  it('does not call onBulkDelete when confirmation is cancelled', async () => {
    const onBulkDelete = jest.fn();
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

    render(
      <DataGrid
        data={testData}
        enableSelection={true}
        enableDelete={true}
        deleteConfirmation={true}
        onBulkDelete={onBulkDelete}
      />
    );

    // Select a row
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]);

    // Click delete
    const deleteButton = screen.getByTitle(/delete 1 selected item/i);
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete 1 selected item?');
      expect(onBulkDelete).not.toHaveBeenCalled();
    });

    confirmSpy.mockRestore();
  });

  it('updates delete button text based on selection count', async () => {
    render(<DataGrid data={testData} enableSelection={true} enableDelete={true} />);

    const checkboxes = screen.getAllByRole('checkbox');

    // Select first row
    fireEvent.click(checkboxes[1]);
    await waitFor(() => {
      const deleteButton = screen.getByTitle(/delete 1 selected item/i);
      expect(deleteButton).toHaveTextContent('(1 selected)');
    });

    // Select second row
    fireEvent.click(checkboxes[2]);
    await waitFor(() => {
      const deleteButton = screen.getByTitle(/delete 2 selected item/i);
      expect(deleteButton).toHaveTextContent('(2 selected)');
    });

    // Deselect first row
    fireEvent.click(checkboxes[1]);
    await waitFor(() => {
      const deleteButton = screen.getByTitle(/delete 1 selected item/i);
      expect(deleteButton).toHaveTextContent('(1 selected)');
    });
  });
});

// =============================================================================
// Filter Callback Tests (NEW)
// =============================================================================

describe('DataGrid Filter Callbacks', () => {
  it('calls onApplyFilter when Apply Filter button is clicked', async () => {
    const onApplyFilter = jest.fn();
    render(<DataGrid data={testData} enableFilters={true} onApplyFilter={onApplyFilter} />);

    // Select a column - first combobox in the filter section
    const selects = screen.getAllByRole('combobox');
    const columnSelect = selects[0]; // Column select
    fireEvent.change(columnSelect, { target: { value: 'name' } });

    // Enter a value
    const valueInput = screen.getByPlaceholderText('Enter value');
    fireEvent.change(valueInput, { target: { value: 'John' } });

    // Click Apply Filter
    const applyButton = screen.getByRole('button', { name: /apply filter/i });
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(onApplyFilter).toHaveBeenCalledWith(
        expect.objectContaining({
          column: 'name',
          operator: 'eq',
          value: 'John',
        }),
        expect.any(Array)
      );
    });
  });

  it('calls onFilterChange when filters change', async () => {
    const onFilterChange = jest.fn();
    render(<DataGrid data={testData} enableFilters={true} onFilterChange={onFilterChange} />);

    // Select a column
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'email' } });

    // Enter a value
    const valueInput = screen.getByPlaceholderText('Enter value');
    fireEvent.change(valueInput, { target: { value: 'test' } });

    // Click Apply Filter
    const applyButton = screen.getByRole('button', { name: /apply filter/i });
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(onFilterChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            column: 'email',
            value: 'test',
          }),
        ])
      );
    });
  });

  it('calls onClearFilters when Clear All is clicked', async () => {
    const onClearFilters = jest.fn();
    const onFilterChange = jest.fn();
    render(
      <DataGrid
        data={testData}
        enableFilters={true}
        onClearFilters={onClearFilters}
        onFilterChange={onFilterChange}
      />
    );

    // First add a filter
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'name' } });

    const valueInput = screen.getByPlaceholderText('Enter value');
    fireEvent.change(valueInput, { target: { value: 'John' } });

    const applyButton = screen.getByRole('button', { name: /apply filter/i });
    fireEvent.click(applyButton);

    // Now clear all
    const clearButton = screen.getByRole('button', { name: /clear all/i });
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(onClearFilters).toHaveBeenCalled();
      expect(onFilterChange).toHaveBeenLastCalledWith([]);
    });
  });

  it('calls onRemoveFilter when filter tag is removed', async () => {
    const onRemoveFilter = jest.fn();
    render(<DataGrid data={testData} enableFilters={true} onRemoveFilter={onRemoveFilter} />);

    // Add a filter first
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'name' } });

    const valueInput = screen.getByPlaceholderText('Enter value');
    fireEvent.change(valueInput, { target: { value: 'John' } });

    const applyButton = screen.getByRole('button', { name: /apply filter/i });
    fireEvent.click(applyButton);

    // Wait for filter tag to appear
    await waitFor(() => {
      expect(screen.getByText(/active filters/i)).toBeInTheDocument();
    });

    // Find and click the remove button on the filter tag
    const removeButton = screen.getByRole('button', { name: /remove filter/i });
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(onRemoveFilter).toHaveBeenCalledWith(
        expect.objectContaining({ column: 'name' }),
        [] // remaining filters
      );
    });
  });

  it('displays active filter tags', async () => {
    render(<DataGrid data={testData} enableFilters={true} />);

    // Add a filter
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'name' } });

    const valueInput = screen.getByPlaceholderText('Enter value');
    fireEvent.change(valueInput, { target: { value: 'John' } });

    const applyButton = screen.getByRole('button', { name: /apply filter/i });
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(screen.getByText(/active filters/i)).toBeInTheDocument();
      expect(screen.getByText(/name eq "John"/i)).toBeInTheDocument();
    });
  });

  it('filters data client-side when filter is applied', async () => {
    render(<DataGrid data={testData} enableFilters={true} />);

    // Initially both rows visible
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();

    // Add a filter for "John"
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'name' } });

    // Change operator to "contains"
    fireEvent.change(selects[1], { target: { value: 'contains' } });

    const valueInput = screen.getByPlaceholderText('Enter value');
    fireEvent.change(valueInput, { target: { value: 'John' } });

    const applyButton = screen.getByRole('button', { name: /apply filter/i });
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });
  });
});

// =============================================================================
// Page Size Change Tests
// =============================================================================

describe('DataGrid Page Size', () => {
  it('calls onPageSizeChange when page size is changed', async () => {
    const onPageSizeChange = jest.fn();
    render(
      <DataGrid
        data={testData}
        pageSize={5}
        enableFilters={false}
        onPageSizeChange={onPageSizeChange}
      />
    );

    // Find the page size select by its current value
    const pageSizeSelect = screen.getByDisplayValue('5');
    fireEvent.change(pageSizeSelect, { target: { value: '10' } });

    await waitFor(() => {
      expect(onPageSizeChange).toHaveBeenCalledWith(10);
    });
  });
});
