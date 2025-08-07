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
      <DataGrid 
        data={testData} 
        enableSelection={true}
        onSelectionChange={onSelectionChange}
      />
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
    render(
      <DataGrid 
        data={testData} 
        onTableRowDoubleClick={onTableRowDoubleClick}
      />
    );
    
    const firstRow = screen.getByText('John Doe').closest('tr');
    if (firstRow) {
      fireEvent.doubleClick(firstRow);
    }
    
    await waitFor(() => {
      expect(onTableRowDoubleClick).toHaveBeenCalledWith(testData[0], expect.any(Object));
    });
  });
});
