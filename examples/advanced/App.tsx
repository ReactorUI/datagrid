import React from 'react';
import { DataGrid } from '@reactorui/datagrid';
import type { Column } from '@reactorui/datagrid';

interface Employee {
  id: number;
  name: string;
  email: string;
  department: string;
  salary: number;
  joinDate: string;
  isActive: boolean;
}

const employeeData: Employee[] = [
  { id: 1, name: 'John Doe', email: 'john@company.com', department: 'Engineering', salary: 75000, joinDate: '2022-01-15', isActive: true },
  { id: 2, name: 'Jane Smith', email: 'jane@company.com', department: 'Marketing', salary: 65000, joinDate: '2022-03-20', isActive: true },
  { id: 3, name: 'Bob Johnson', email: 'bob@company.com', department: 'Sales', salary: 55000, joinDate: '2021-11-10', isActive: false },
  { id: 4, name: 'Alice Brown', email: 'alice@company.com', department: 'Engineering', salary: 80000, joinDate: '2023-02-05', isActive: true },
  { id: 5, name: 'Charlie Wilson', email: 'charlie@company.com', department: 'HR', salary: 60000, joinDate: '2022-08-12', isActive: true },
];

const columns: Column<Employee>[] = [
  {
    key: 'name',
    label: 'Employee Name',
    sortable: true,
    render: (value, row) => (
      <div className="flex items-center">
        <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
          {value.charAt(0)}
        </div>
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-gray-500">{row.email}</div>
        </div>
      </div>
    ),
  },
  {
    key: 'department',
    label: 'Department',
    sortable: true,
    render: (value) => (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
        value === 'Engineering' ? 'bg-purple-100 text-purple-800' :
        value === 'Marketing' ? 'bg-pink-100 text-pink-800' :
        value === 'Sales' ? 'bg-green-100 text-green-800' :
        value === 'HR' ? 'bg-blue-100 text-blue-800' :
        'bg-gray-100 text-gray-800'
      }`}>
        {value}
      </span>
    ),
  },
  {
    key: 'salary',
    label: 'Salary',
    sortable: true,
    dataType: 'number',
    render: (value) => new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value),
  },
  {
    key: 'joinDate',
    label: 'Join Date',
    sortable: true,
    dataType: 'date',
    render: (value) => new Date(value).toLocaleDateString(),
  },
  {
    key: 'isActive',
    label: 'Status',
    sortable: true,
    dataType: 'boolean',
    render: (value) => (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
        value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {value ? 'Active' : 'Inactive'}
      </span>
    ),
  },
];

function AdvancedExample() {
  const handleSelectionChange = (selectedRows: Employee[]) => {
    console.log('Selected employees:', selectedRows);
  };

  const handleRowDoubleClick = (row: Employee) => {
    alert(`Viewing details for ${row.name}`);
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Advanced DataGrid Example</h1>
      <DataGrid
        data={employeeData}
        columns={columns}
        variant="bordered"
        size="md"
        pageSize={5}
        onSelectionChange={handleSelectionChange}
        onTableRowDoubleClick={handleRowDoubleClick}
        enableSearch={true}
        enableSorting={true}
        enableFilters={true}
        enableSelection={true}
      />
    </div>
  );
}

export default AdvancedExample;
