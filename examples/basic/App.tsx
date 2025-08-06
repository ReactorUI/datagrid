import React from 'react';
import { DataGrid } from '@reactorui/datagrid';

const sampleData = [
  { id: 1, name: 'John Doe', email: 'john@example.com', department: 'Engineering', salary: 75000 },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', department: 'Marketing', salary: 65000 },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', department: 'Sales', salary: 55000 },
  { id: 4, name: 'Alice Brown', email: 'alice@example.com', department: 'Engineering', salary: 80000 },
  { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', department: 'HR', salary: 60000 },
];

function BasicExample() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Basic DataGrid Example</h1>
      <DataGrid data={sampleData} />
    </div>
  );
}

export default BasicExample;
