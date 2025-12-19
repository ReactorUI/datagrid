import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DataGrid } from './DataGrid';

const testData = [
  { id: 1, name: 'John Doe', email: 'john@example.com', age: 30 },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 25 },
];

// =============================================================================
// Pagination Events
// =============================================================================

describe('DataGrid Pagination Events', () => {
  it('calls onPageChange when page changes', async () => {
    const onPageChange = jest.fn();
    render(<DataGrid data={testData} pageSize={1} onPageChange={onPageChange} />);

    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(onPageChange).toHaveBeenCalledWith(2, expect.any(Object));
    });
  });

  it('displays correct pagination info', () => {
    render(<DataGrid data={testData} pageSize={1} />);
    expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument();
  });

  it('calls onPageSizeChange when page size changes', async () => {
    const onPageSizeChange = jest.fn();
    render(
      <DataGrid
        data={testData}
        pageSize={5}
        enableFilters={false}
        onPageSizeChange={onPageSizeChange}
      />
    );

    const pageSizeSelect = screen.getByDisplayValue('5');
    fireEvent.change(pageSizeSelect, { target: { value: '10' } });

    await waitFor(() => {
      expect(onPageSizeChange).toHaveBeenCalledWith(10);
    });
  });

  it('disables Previous on first page', () => {
    render(<DataGrid data={testData} pageSize={1} />);
    expect(screen.getByText('Previous')).toBeDisabled();
  });

  it('disables Next on last page', () => {
    render(<DataGrid data={testData} pageSize={10} />);
    expect(screen.getByText('Next')).toBeDisabled();
  });
});

// =============================================================================
// Sort Events
// =============================================================================

describe('DataGrid Sort Events', () => {
  it('calls onSortChange when column header is clicked', async () => {
    const onSortChange = jest.fn();
    render(<DataGrid data={testData} enableSorting={true} onSortChange={onSortChange} />);

    const headers = screen.getAllByRole('columnheader');
    const nameHeader = headers.find((h) => h.textContent?.includes('Name'));
    fireEvent.click(nameHeader!);

    await waitFor(() => {
      expect(onSortChange).toHaveBeenCalledWith({
        column: 'name',
        direction: 'asc',
      });
    });
  });

  it('toggles sort direction on second click', async () => {
    const onSortChange = jest.fn();
    render(<DataGrid data={testData} enableSorting={true} onSortChange={onSortChange} />);

    const headers = screen.getAllByRole('columnheader');
    const nameHeader = headers.find((h) => h.textContent?.includes('Name'));

    fireEvent.click(nameHeader!);
    fireEvent.click(nameHeader!);

    await waitFor(() => {
      expect(onSortChange).toHaveBeenLastCalledWith({
        column: 'name',
        direction: 'desc',
      });
    });
  });
});

// =============================================================================
// Search Events
// =============================================================================

describe('DataGrid Search Events', () => {
  it('calls onSearchChange when search input changes', async () => {
    const onSearchChange = jest.fn();
    render(<DataGrid data={testData} enableSearch={true} onSearchChange={onSearchChange} />);

    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.change(searchInput, { target: { value: 'John' } });

    await waitFor(() => {
      expect(onSearchChange).toHaveBeenCalledWith('John');
    });
  });

  it('filters data client-side when searching', async () => {
    render(<DataGrid data={testData} enableSearch={true} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.change(searchInput, { target: { value: 'John' } });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });
  });
});

// =============================================================================
// Refresh Events
// =============================================================================

describe('DataGrid Refresh Events', () => {
  it('does not show refresh button by default', () => {
    render(<DataGrid data={testData} />);
    expect(screen.queryByTitle(/refresh/i)).not.toBeInTheDocument();
  });

  it('shows refresh button when enableRefresh is true', () => {
    render(<DataGrid data={testData} enableRefresh={true} />);
    expect(screen.getByTitle(/refresh/i)).toBeInTheDocument();
  });

  it('calls onTableRefresh when refresh button is clicked', async () => {
    const onTableRefresh = jest.fn();
    render(<DataGrid data={testData} enableRefresh={true} onTableRefresh={onTableRefresh} />);

    fireEvent.click(screen.getByTitle(/refresh/i));

    await waitFor(() => {
      expect(onTableRefresh).toHaveBeenCalled();
    });
  });
});

// =============================================================================
// Delete Events
// =============================================================================

describe('DataGrid Delete Events', () => {
  it('does not show delete button by default', () => {
    render(<DataGrid data={testData} enableSelection={true} />);
    expect(screen.queryByTitle(/delete/i)).not.toBeInTheDocument();
  });

  it('shows delete button when enableDelete is true', () => {
    render(<DataGrid data={testData} enableSelection={true} enableDelete={true} />);
    expect(screen.getByTitle(/select rows to delete/i)).toBeInTheDocument();
  });

  it('delete button is disabled when no rows selected', () => {
    render(<DataGrid data={testData} enableSelection={true} enableDelete={true} />);
    expect(screen.getByTitle(/select rows to delete/i)).toBeDisabled();
  });

  it('delete button shows selection count', async () => {
    render(<DataGrid data={testData} enableSelection={true} enableDelete={true} />);

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]);

    await waitFor(() => {
      expect(screen.getByText('(1 selected)')).toBeInTheDocument();
    });
  });

  it('calls onBulkDelete when delete is clicked without confirmation', async () => {
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

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]);

    const deleteButton = screen.getByTitle(/delete 1 selected/i);
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

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]);
    fireEvent.click(checkboxes[2]);

    const deleteButton = screen.getByTitle(/delete 2 selected/i);
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalled();
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

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]);

    const deleteButton = screen.getByTitle(/delete 1 selected/i);
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalled();
      expect(onBulkDelete).not.toHaveBeenCalled();
    });

    confirmSpy.mockRestore();
  });
});

// =============================================================================
// Filter Callbacks
// =============================================================================

describe('DataGrid Filter Callbacks', () => {
  it('calls onApplyFilter when filter is applied', async () => {
    const onApplyFilter = jest.fn();
    render(<DataGrid data={testData} enableFilters={true} onApplyFilter={onApplyFilter} />);

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'name' } });

    const valueInput = screen.getByPlaceholderText('Enter value');
    fireEvent.change(valueInput, { target: { value: 'John' } });

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

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'email' } });

    const valueInput = screen.getByPlaceholderText('Enter value');
    fireEvent.change(valueInput, { target: { value: 'test' } });

    const applyButton = screen.getByRole('button', { name: /apply filter/i });
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(onFilterChange).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ column: 'email', value: 'test' })])
      );
    });
  });

  it('calls onClearFilters when Clear All is clicked', async () => {
    const onClearFilters = jest.fn();
    render(<DataGrid data={testData} enableFilters={true} onClearFilters={onClearFilters} />);

    // Add a filter first
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'name' } });

    const valueInput = screen.getByPlaceholderText('Enter value');
    fireEvent.change(valueInput, { target: { value: 'John' } });

    fireEvent.click(screen.getByRole('button', { name: /apply filter/i }));

    // Clear all
    fireEvent.click(screen.getByRole('button', { name: /clear all/i }));

    await waitFor(() => {
      expect(onClearFilters).toHaveBeenCalled();
    });
  });

  it('calls onRemoveFilter when filter tag is removed', async () => {
    const onRemoveFilter = jest.fn();
    render(<DataGrid data={testData} enableFilters={true} onRemoveFilter={onRemoveFilter} />);

    // Add a filter
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'name' } });

    const valueInput = screen.getByPlaceholderText('Enter value');
    fireEvent.change(valueInput, { target: { value: 'John' } });

    fireEvent.click(screen.getByRole('button', { name: /apply filter/i }));

    // Wait for filter tag and remove it
    await waitFor(() => {
      expect(screen.getByText(/active filters/i)).toBeInTheDocument();
    });

    const removeButton = screen.getByRole('button', { name: /remove filter/i });
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(onRemoveFilter).toHaveBeenCalledWith(expect.objectContaining({ column: 'name' }), []);
    });
  });

  it('displays active filter tags', async () => {
    render(<DataGrid data={testData} enableFilters={true} />);

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'name' } });

    const valueInput = screen.getByPlaceholderText('Enter value');
    fireEvent.change(valueInput, { target: { value: 'John' } });

    fireEvent.click(screen.getByRole('button', { name: /apply filter/i }));

    await waitFor(() => {
      expect(screen.getByText(/active filters/i)).toBeInTheDocument();
      expect(screen.getByText(/name eq "John"/i)).toBeInTheDocument();
    });
  });

  it('filters data client-side when filter is applied', async () => {
    render(<DataGrid data={testData} enableFilters={true} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'name' } });
    fireEvent.change(selects[1], { target: { value: 'contains' } });

    const valueInput = screen.getByPlaceholderText('Enter value');
    fireEvent.change(valueInput, { target: { value: 'John' } });

    fireEvent.click(screen.getByRole('button', { name: /apply filter/i }));

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });
  });
});
