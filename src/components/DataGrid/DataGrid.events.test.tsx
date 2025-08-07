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
