import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DataGrid } from './DataGrid';

const testData = [
  { id: 1, name: 'John Doe', email: 'john@example.com', age: 30 },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 25 },
];

// Generate larger dataset for pagination testing
const generateTestData = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    age: 20 + (i % 50),
  }));

const largeTestData = generateTestData(50);

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
// Page Size Changes - Client Side
// =============================================================================

describe('DataGrid Page Size - Client Side', () => {
  it('displays correct number of rows based on initial pageSize', () => {
    render(<DataGrid data={largeTestData} pageSize={10} enableFilters={false} />);

    const rows = screen.getAllByRole('row');
    expect(rows.length - 1).toBe(10); // Subtract header row
  });

  it('updates displayed rows when page size changes', async () => {
    render(<DataGrid data={largeTestData} pageSize={5} enableFilters={false} />);

    // Initially 5 rows
    let rows = screen.getAllByRole('row');
    expect(rows.length - 1).toBe(5);

    // Change page size to 10
    const pageSizeSelect = screen.getByDisplayValue('5');
    fireEvent.change(pageSizeSelect, { target: { value: '10' } });

    await waitFor(() => {
      rows = screen.getAllByRole('row');
      expect(rows.length - 1).toBe(10);
    });
  });

  it('updates dropdown value when page size changes', async () => {
    render(<DataGrid data={largeTestData} pageSize={5} enableFilters={false} />);

    const pageSizeSelect = screen.getByDisplayValue('5') as HTMLSelectElement;
    expect(pageSizeSelect.value).toBe('5');

    fireEvent.change(pageSizeSelect, { target: { value: '25' } });

    await waitFor(() => {
      expect(pageSizeSelect.value).toBe('25');
    });
  });

  it('resets to page 1 when page size changes', async () => {
    render(<DataGrid data={largeTestData} pageSize={5} enableFilters={false} />);

    // Navigate to page 3
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByText(/Page 3/)).toBeInTheDocument();
    });

    // Change page size
    const pageSizeSelect = screen.getByDisplayValue('5');
    fireEvent.change(pageSizeSelect, { target: { value: '10' } });

    // Should reset to page 1
    await waitFor(() => {
      expect(screen.getByText(/Page 1/)).toBeInTheDocument();
    });
  });

  it('updates pagination info when page size changes', async () => {
    render(<DataGrid data={largeTestData} pageSize={5} enableFilters={false} />);

    expect(screen.getByText(/Showing 1-5 of 50/)).toBeInTheDocument();

    const pageSizeSelect = screen.getByDisplayValue('5');
    fireEvent.change(pageSizeSelect, { target: { value: '25' } });

    await waitFor(() => {
      expect(screen.getByText(/Showing 1-25 of 50/)).toBeInTheDocument();
    });
  });

  it('correctly calculates total pages after page size change', async () => {
    render(<DataGrid data={largeTestData} pageSize={10} enableFilters={false} />);

    // 50 records / 10 per page = 5 pages
    expect(screen.getByText(/Page 1 of 5/)).toBeInTheDocument();

    // Change to 25 per page: 50 / 25 = 2 pages
    const pageSizeSelect = screen.getByDisplayValue('10');
    fireEvent.change(pageSizeSelect, { target: { value: '25' } });

    await waitFor(() => {
      expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument();
    });
  });

  it('disables Next button correctly after page size change', async () => {
    const smallData = generateTestData(15);
    render(<DataGrid data={smallData} pageSize={5} enableFilters={false} />);

    // With 15 records and 5 per page, Next should be enabled
    expect(screen.getByText('Next')).not.toBeDisabled();

    // Change to 25 per page - all fit on one page
    const pageSizeSelect = screen.getByDisplayValue('5');
    fireEvent.change(pageSizeSelect, { target: { value: '25' } });

    await waitFor(() => {
      expect(screen.getByText('Next')).toBeDisabled();
    });
  });

  it('shows all records when page size exceeds total', async () => {
    const smallData = generateTestData(8);
    render(<DataGrid data={smallData} pageSize={5} enableFilters={false} />);

    let rows = screen.getAllByRole('row');
    expect(rows.length - 1).toBe(5);

    const pageSizeSelect = screen.getByDisplayValue('5');
    fireEvent.change(pageSizeSelect, { target: { value: '10' } });

    await waitFor(() => {
      rows = screen.getAllByRole('row');
      expect(rows.length - 1).toBe(8); // All 8 records
    });
  });
});

// =============================================================================
// Pagination Navigation - Client Side
// =============================================================================

describe('DataGrid Pagination Navigation - Client Side', () => {
  it('navigates to next page and shows correct data', async () => {
    render(<DataGrid data={largeTestData} pageSize={5} enableFilters={false} />);

    expect(screen.getByText('User 1')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByText('User 6')).toBeInTheDocument();
      expect(screen.queryByText('User 1')).not.toBeInTheDocument();
    });
  });

  it('navigates to previous page', async () => {
    render(<DataGrid data={largeTestData} pageSize={5} enableFilters={false} />);

    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByText('User 6')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Previous'));

    await waitFor(() => {
      expect(screen.getByText('User 1')).toBeInTheDocument();
    });
  });

  it('calls onPageChange with correct parameters', async () => {
    const onPageChange = jest.fn();
    render(
      <DataGrid
        data={largeTestData}
        pageSize={5}
        enableFilters={false}
        onPageChange={onPageChange}
      />
    );

    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(onPageChange).toHaveBeenCalledWith(
        2,
        expect.objectContaining({
          currentPage: 2,
          pageSize: 5,
          totalRecords: 50,
        })
      );
    });
  });
});

// =============================================================================
// Pagination with Search - Client Side
// =============================================================================

describe('DataGrid Pagination with Search', () => {
  it('resets to page 1 when search term changes', async () => {
    render(<DataGrid data={largeTestData} pageSize={5} enableSearch={true} />);

    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByText(/Page 3/)).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.change(searchInput, { target: { value: 'User 1' } });

    await waitFor(() => {
      expect(screen.getByText(/Page 1/)).toBeInTheDocument();
    });
  });

  it('updates pagination info based on search results', async () => {
    render(<DataGrid data={largeTestData} pageSize={10} enableSearch={true} />);

    expect(screen.getByText(/of 50 records/)).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.change(searchInput, { target: { value: 'User 1' } });

    await waitFor(() => {
      // Should show filtered count (User 1, User 10-19 = 11 matches)
      expect(screen.getByText(/of 11 records/)).toBeInTheDocument();
    });
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
  const openFilterPopover = () => {
    const filterButton = screen.getByTitle(/filter/i);
    fireEvent.click(filterButton);
  };

  it('does NOT call onApplyFilter in client mode (default)', async () => {
    const onApplyFilter = jest.fn();
    render(<DataGrid data={testData} enableFilters={true} onApplyFilter={onApplyFilter} />);

    openFilterPopover();

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[1], { target: { value: 'name' } }); // First combobox is page size

    const valueInput = screen.getByPlaceholderText('Enter value');
    fireEvent.change(valueInput, { target: { value: 'John' } });

    fireEvent.click(screen.getByRole('button', { name: /apply filter/i }));

    // Should NOT fire in client mode
    await waitFor(() => {
      expect(onApplyFilter).not.toHaveBeenCalled();
    });
  });

  it('calls onApplyFilter when filterMode is server', async () => {
    const onApplyFilter = jest.fn();
    render(
      <DataGrid
        data={testData}
        enableFilters={true}
        filterMode="server"
        onApplyFilter={onApplyFilter}
      />
    );

    openFilterPopover();

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[1], { target: { value: 'name' } });

    const valueInput = screen.getByPlaceholderText('Enter value');
    fireEvent.change(valueInput, { target: { value: 'John' } });

    fireEvent.click(screen.getByRole('button', { name: /apply filter/i }));

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

  it('calls onApplyFilter when filterMode is client&server', async () => {
    const onApplyFilter = jest.fn();
    render(
      <DataGrid
        data={testData}
        enableFilters={true}
        filterMode="client&server"
        onApplyFilter={onApplyFilter}
      />
    );

    openFilterPopover();

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[1], { target: { value: 'name' } });

    const valueInput = screen.getByPlaceholderText('Enter value');
    fireEvent.change(valueInput, { target: { value: 'John' } });

    fireEvent.click(screen.getByRole('button', { name: /apply filter/i }));

    await waitFor(() => {
      expect(onApplyFilter).toHaveBeenCalled();
    });
  });

  it('calls onClearFilters when filterMode is server', async () => {
    const onClearFilters = jest.fn();
    render(
      <DataGrid
        data={testData}
        enableFilters={true}
        filterMode="server"
        onClearFilters={onClearFilters}
      />
    );

    // Add first filter
    openFilterPopover();
    let selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[1], { target: { value: 'name' } });
    let valueInput = screen.getByPlaceholderText('Enter value');
    fireEvent.change(valueInput, { target: { value: 'John' } });
    fireEvent.click(screen.getByRole('button', { name: /apply filter/i }));

    // Add second filter (Clear All only shows with 2+ filters)
    openFilterPopover();
    selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[1], { target: { value: 'email' } });
    valueInput = screen.getByPlaceholderText('Enter value');
    fireEvent.change(valueInput, { target: { value: 'test' } });
    fireEvent.click(screen.getByRole('button', { name: /apply filter/i }));

    // Clear all (now inline, not in popover)
    await waitFor(() => {
      expect(screen.getByText(/clear all/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(/clear all/i));

    await waitFor(() => {
      expect(onClearFilters).toHaveBeenCalled();
    });
  });

  it('calls onRemoveFilter when filterMode is server', async () => {
    const onRemoveFilter = jest.fn();
    render(
      <DataGrid
        data={testData}
        enableFilters={true}
        filterMode="server"
        onRemoveFilter={onRemoveFilter}
      />
    );

    openFilterPopover();

    // Add a filter
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[1], { target: { value: 'name' } });

    const valueInput = screen.getByPlaceholderText('Enter value');
    fireEvent.change(valueInput, { target: { value: 'John' } });

    fireEvent.click(screen.getByRole('button', { name: /apply filter/i }));

    // Filter tags are now inline (not in popover), find remove button
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /remove filter/i })).toBeInTheDocument();
    });

    const removeButton = screen.getByRole('button', { name: /remove filter/i });
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(onRemoveFilter).toHaveBeenCalledWith(expect.objectContaining({ column: 'name' }), []);
    });
  });

  it('shows filter count badge when filters are active', async () => {
    render(<DataGrid data={testData} enableFilters={true} />);

    openFilterPopover();

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[1], { target: { value: 'name' } });

    const valueInput = screen.getByPlaceholderText('Enter value');
    fireEvent.change(valueInput, { target: { value: 'John' } });

    fireEvent.click(screen.getByRole('button', { name: /apply filter/i }));

    await waitFor(() => {
      // Badge should show "1"
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  it('filters data client-side in client mode (default)', async () => {
    render(<DataGrid data={testData} enableFilters={true} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();

    openFilterPopover();

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[1], { target: { value: 'name' } });
    fireEvent.change(selects[2], { target: { value: 'contains' } });

    const valueInput = screen.getByPlaceholderText('Enter value');
    fireEvent.change(valueInput, { target: { value: 'John' } });

    fireEvent.click(screen.getByRole('button', { name: /apply filter/i }));

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });
  });

  it('does NOT filter data locally in server mode', async () => {
    render(<DataGrid data={testData} enableFilters={true} filterMode="server" />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();

    openFilterPopover();

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[1], { target: { value: 'name' } });
    fireEvent.change(selects[2], { target: { value: 'contains' } });

    const valueInput = screen.getByPlaceholderText('Enter value');
    fireEvent.change(valueInput, { target: { value: 'John' } });

    fireEvent.click(screen.getByRole('button', { name: /apply filter/i }));

    // Both should still be visible (server handles filtering)
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('filters data AND fires callback in client&server mode', async () => {
    const onApplyFilter = jest.fn();
    render(
      <DataGrid
        data={testData}
        enableFilters={true}
        filterMode="client&server"
        onApplyFilter={onApplyFilter}
      />
    );

    openFilterPopover();

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[1], { target: { value: 'name' } });
    fireEvent.change(selects[2], { target: { value: 'contains' } });

    const valueInput = screen.getByPlaceholderText('Enter value');
    fireEvent.change(valueInput, { target: { value: 'John' } });

    fireEvent.click(screen.getByRole('button', { name: /apply filter/i }));

    await waitFor(() => {
      // Should filter locally
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      // AND fire callback
      expect(onApplyFilter).toHaveBeenCalled();
    });
  });
});
