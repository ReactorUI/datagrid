import React, { useState } from 'react';
import { DataGrid } from '@reactorui/datagrid';

const sampleData = [
  { id: 1, name: 'John Doe', email: 'john@company.com', department: 'Engineering', age: 28 },
  { id: 2, name: 'Jane Smith', email: 'jane@company.com', department: 'Marketing', age: 34 },
  { id: 3, name: 'Bob Johnson', email: 'bob@company.com', department: 'Sales', age: 45 },
  { id: 4, name: 'Alice Brown', email: 'alice@company.com', department: 'Engineering', age: 29 },
];

function EventsExample() {
  const [eventLog, setEventLog] = useState<string[]>([]);

  const logEvent = (message: string) => {
    setEventLog((prev) => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">DataGrid Events Example</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* DataGrid */}
        <div className="lg:col-span-2">
          <DataGrid
            data={sampleData}
            pageSize={3}
            // Data & State Events
            onDataLoad={(data) => logEvent(`Data loaded: ${data.Count} items`)}
            onDataError={(error, context) => logEvent(`Error in ${context}: ${error.message}`)}
            onLoadingStateChange={(loading, context) => logEvent(`Loading ${context}: ${loading}`)}
            onPageChange={(page, info) =>
              logEvent(
                `Page changed to ${page} (${info.start}-${info.end} of ${info.totalRecords})`
              )
            }
            onPageSizeChange={(size, info) => logEvent(`Page size changed to ${size}`)}
            onSortChange={(sort) => logEvent(`Sort: ${sort.column} ${sort.direction}`)}
            onFilterChange={(filters) => logEvent(`Filters: ${filters.length} active`)}
            onSearchChange={(term) => logEvent(`Search: "${term}"`)}
            onTableRefresh={() => logEvent('Refresh triggered')}
            // Row & Cell Events
            onTableRowClick={(row) => logEvent(`Row clicked: ${row.name}`)}
            onTableRowDoubleClick={(row) => logEvent(`Row double-clicked: ${row.name}`)}
            onRowSelect={(row, selected) =>
              logEvent(`Row ${selected ? 'selected' : 'deselected'}: ${row.name}`)
            }
            onSelectionChange={(rows) => logEvent(`Selection: ${rows.length} rows selected`)}
            onTableRowHover={(row) => logEvent(row ? `Hovering: ${row.name}` : 'Hover ended')}
            onCellClick={(value, row, column) =>
              logEvent(`Cell clicked: ${column.label} = ${value}`)
            }
          />
        </div>

        {/* Event Log */}
        <div className="bg-gray-100 p-4 rounded-lg">
          <h3 className="font-bold mb-4">Event Log</h3>
          <div className="space-y-1 text-sm font-mono max-h-96 overflow-y-auto">
            {eventLog.length === 0 ? (
              <div className="text-gray-500">No events yet...</div>
            ) : (
              eventLog.map((event, index) => (
                <div key={index} className="text-xs">
                  {event}
                </div>
              ))
            )}
          </div>
          <button
            onClick={() => setEventLog([])}
            className="mt-4 px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
          >
            Clear Log
          </button>
        </div>
      </div>
    </div>
  );
}

export default EventsExample;
