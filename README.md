# @reactorui/datagrid

[![npm](https://img.shields.io/npm/dt/@reactorui/datagrid)](https://www.npmjs.com/package/@reactorui/datagrid)
[![npm version](https://img.shields.io/npm/v/@reactorui/datagrid)](https://www.npmjs.com/package/@reactorui/datagrid)
[![license](https://img.shields.io/npm/l/@reactorui/datagrid)](https://github.com/your-org/datagrid/blob/main/LICENSE)

A high-performance, feature-rich React data grid component with TypeScript support, pagination, and advanced filtering capabilities. Designed as a **controlled presentation component** for maximum flexibility.

## 🖼️ Screenshots

### Light Mode

![DataGrid Light Mode](./screenshots/datagrid-light.png)

### Dark Mode

![DataGrid Dark Mode](./screenshots/datagrid-dark.png)

## ✨ Features

- 🚀 **High Performance** - Optimized rendering with memoization
- 🔍 **Advanced Filtering** - Type-aware filters with multiple operators (string, number, date, boolean)
- 🔄 **Flexible Data Sources** - Works with any data fetching strategy (REST, GraphQL, local)
- 📱 **Responsive Design** - Mobile-first with touch-friendly interactions
- 🎨 **Customizable Theming** - Multiple built-in variants and custom styling
- 🌙 **Dark Mode Ready** - Built-in dark mode support
- ♿ **Accessibility First** - WCAG compliant with keyboard navigation and ARIA labels
- 🔧 **TypeScript Native** - Full type safety and comprehensive IntelliSense support
- 🎯 **Rich Event System** - 20+ events covering every user interaction
- 📊 **Granular Loading States** - Action-specific loading indicators
- 📜 **Scrollable Layout** - Fixed headers with `maxHeight` and `stickyHeader` props
- ⚡ **Zero Dependencies** - Only React as peer dependency

## 📦 Installation

```bash
npm install @reactorui/datagrid
# or
yarn add @reactorui/datagrid
# or
pnpm add @reactorui/datagrid
```

## 🚀 Basic Usage

```tsx
import { DataGrid } from '@reactorui/datagrid';

const data = [
  { id: 1, name: 'John Doe', email: 'john@example.com', age: 28 },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 34 },
];

function App() {
  return <DataGrid data={data} />;
}
```

## 🛠 With Custom Columns & Styling

```tsx
import { DataGrid, Column } from '@reactorui/datagrid';

interface User {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  joinDate: string;
}

const columns: Column<User>[] = [
  {
    key: 'name',
    label: 'Full Name',
    sortable: true,
    render: (value, row) => (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">
          {value.charAt(0)}
        </div>
        {value}
      </div>
    ),
  },
  { key: 'email', label: 'Email Address', sortable: true },
  {
    key: 'status',
    label: 'Status',
    dataType: 'string',
    render: (status) => (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${
          status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}
      >
        {status}
      </span>
    ),
  },
  {
    key: 'joinDate',
    label: 'Join Date',
    dataType: 'date',
    sortable: true,
  },
];

function App() {
  return (
    <DataGrid
      data={users}
      columns={columns}
      variant="bordered"
      size="lg"
      enableSelection={true}
      onSelectionChange={(selected) => console.log('Selected:', selected)}
    />
  );
}
```

## 🌐 Server-Side Data (Controlled Mode)

The DataGrid is a **controlled presentation component**. You handle data fetching; the grid handles display.

```tsx
import { useState, useEffect } from 'react';
import { DataGrid, LoadingState, ActiveFilter, SortConfig } from '@reactorui/datagrid';

function ServerSideExample() {
  const [data, setData] = useState([]);
  const [loadingState, setLoadingState] = useState<LoadingState>({});
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from your API
  const fetchData = async (page: number, filters: ActiveFilter[], search: string) => {
    setLoadingState({ data: true });
    setError(null);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page, pageSize: 25, filters, search }),
      });

      const result = await response.json();
      setData(result.items);
      setTotalRecords(result.totalRecords);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoadingState({});
    }
  };

  useEffect(() => {
    fetchData(1, [], '');
  }, []);

  return (
    <DataGrid
      data={data}
      loading={loadingState}
      totalRecords={totalRecords}
      currentPage={currentPage}
      error={error}
      pageSize={25}
      // Filter callbacks - YOU handle the server call
      onApplyFilter={(filter, allFilters) => {
        setLoadingState({ filter: true });
        fetchData(1, allFilters, '');
      }}
      onClearFilters={() => {
        fetchData(1, [], '');
      }}
      onSearchChange={(term) => {
        setLoadingState({ search: true });
        fetchData(1, [], term);
      }}
      onPageChange={(page) => {
        setCurrentPage(page);
        fetchData(page, [], '');
      }}
      onTableRefresh={() => {
        setLoadingState({ refresh: true });
        fetchData(currentPage, [], '');
      }}
    />
  );
}
```

## 📊 Granular Loading States

Instead of a single `loading` boolean, use `loadingState` for action-specific feedback:

```tsx
interface LoadingState {
  data?: boolean;     // Shows skeleton, disables all controls
  filter?: boolean;   // Spinner on "Apply Filter" button only
  search?: boolean;   // Spinner in search input only
  refresh?: boolean;  // Spinner on refresh button only
  delete?: boolean;   // Spinner on delete button only
}

// Usage
<DataGrid
  data={data}
  loadingState={{ filter: true }}  // Only Apply Filter shows spinner
/>

// Backward compatible - still works
<DataGrid data={data} loading={true} />
```

**Visual Result:**

- Click "Apply Filter" → only that button shows `[⟳ Applying...]`
- Click "Refresh" → only that button spins
- Click "Delete" → only that button shows `[⟳ Deleting...]`
- Initial load → table skeleton, all controls disabled

## 📜 Scrollable Layout

For large datasets, enable scrollable body with fixed headers:

```tsx
// Fixed pixel height
<DataGrid data={data} maxHeight="400px" />

// Viewport-relative height
<DataGrid data={data} maxHeight="60vh" />

// Dynamic height
<DataGrid data={data} maxHeight="calc(100vh - 200px)" />

// Just sticky headers (browser determines scroll)
<DataGrid data={data} stickyHeader={true} />

// Numeric value (converted to pixels)
<DataGrid data={data} maxHeight={500} />
```

## 🎯 Event System

### Filter Events (NEW)

```tsx
<DataGrid
  data={data}
  enableFilters={true}
  // Called when "Apply Filter" is clicked
  onApplyFilter={(filter, allFilters) => {
    console.log('New filter:', filter);
    console.log('All active filters:', allFilters);
    // Make your API call here
  }}
  // Called when a filter tag X is clicked
  onRemoveFilter={(removedFilter, remainingFilters) => {
    console.log('Removed:', removedFilter);
    // Refetch with remaining filters
  }}
  // Called when "Clear All" is clicked
  onClearFilters={() => {
    console.log('All filters cleared');
    // Refetch without filters
  }}
  // Called on any filter change (convenience callback)
  onFilterChange={(filters) => {
    console.log('Filters changed:', filters.length);
  }}
/>
```

### Pagination & Sort Events

```tsx
<DataGrid
  data={data}
  onPageChange={(page, paginationInfo) => {
    console.log(`Page ${page} of ${paginationInfo.totalPages}`);
  }}
  onPageSizeChange={(pageSize) => {
    console.log(`Now showing ${pageSize} per page`);
  }}
  onSortChange={(sortConfig) => {
    console.log(`Sorted by ${sortConfig.column} ${sortConfig.direction}`);
  }}
  onSearchChange={(searchTerm) => {
    console.log(`Searching: "${searchTerm}"`);
  }}
  onTableRefresh={() => {
    console.log('Refresh clicked');
  }}
/>
```

### Row & Cell Events

```tsx
<DataGrid
  data={data}
  onTableRowClick={(row, event) => {
    console.log('Clicked:', row);
  }}
  onTableRowDoubleClick={(row, event) => {
    openEditModal(row);
    return false; // Prevent selection toggle
  }}
  onTableRowHover={(row, event) => {
    row ? showTooltip(row) : hideTooltip();
  }}
  onRowSelect={(row, isSelected) => {
    console.log(`${row.name} ${isSelected ? 'selected' : 'deselected'}`);
  }}
  onSelectionChange={(selectedRows) => {
    setBulkActionsEnabled(selectedRows.length > 0);
  }}
  onCellClick={(value, row, column, event) => {
    if (column.key === 'email') {
      window.open(`mailto:${value}`);
    }
  }}
/>
```

## 🗑️ Delete Functionality

```tsx
<DataGrid
  data={data}
  enableSelection={true}
  enableDelete={true}
  deleteConfirmation={true} // Shows confirm dialog
  loadingState={{ delete: isDeleting }}
  onBulkDelete={async (selectedRows) => {
    setLoadingState({ delete: true });
    await deleteUsers(selectedRows.map((r) => r.id));
    setLoadingState({});
    refetchData();
  }}
/>
```

## 📋 Props Reference

### Data & State

| Prop           | Type             | Default       | Description                              |
| -------------- | ---------------- | ------------- | ---------------------------------------- |
| `data`         | `T[]`            | **Required**  | Array of data to display                 |
| `columns`      | `Column<T>[]`    | Auto-detected | Column definitions                       |
| `loading`      | `boolean`        | `false`       | Simple loading state (backward compat)   |
| `loadingState` | `LoadingState`   | `{}`          | Granular loading states                  |
| `totalRecords` | `number`         | -             | Total records for server-side pagination |
| `currentPage`  | `number`         | -             | Controlled current page                  |
| `error`        | `string \| null` | -             | Error message to display                 |

### Layout

| Prop           | Type                                   | Default     | Description                       |
| -------------- | -------------------------------------- | ----------- | --------------------------------- |
| `maxHeight`    | `string \| number`                     | -           | Fixed height with scrollable body |
| `stickyHeader` | `boolean`                              | `false`     | Enable sticky table header        |
| `className`    | `string`                               | `''`        | Additional CSS classes            |
| `variant`      | `'default' \| 'striped' \| 'bordered'` | `'default'` | Visual theme                      |
| `size`         | `'sm' \| 'md' \| 'lg'`                 | `'md'`      | Padding/text size                 |

### Features

| Prop                 | Type      | Default | Description           |
| -------------------- | --------- | ------- | --------------------- |
| `enableSearch`       | `boolean` | `true`  | Show search input     |
| `enableSorting`      | `boolean` | `true`  | Enable column sorting |
| `enableFilters`      | `boolean` | `true`  | Show filter controls  |
| `enableSelection`    | `boolean` | `true`  | Show row checkboxes   |
| `enableDelete`       | `boolean` | `false` | Show delete button    |
| `enableRefresh`      | `boolean` | `false` | Show refresh button   |
| `deleteConfirmation` | `boolean` | `false` | Confirm before delete |

### Pagination

| Prop              | Type       | Default            | Description                |
| ----------------- | ---------- | ------------------ | -------------------------- |
| `pageSize`        | `number`   | `10`               | Items per page             |
| `pageSizeOptions` | `number[]` | `[5,10,25,50,100]` | Page size dropdown options |

### Event Callbacks

| Event                   | Signature                             | Description          |
| ----------------------- | ------------------------------------- | -------------------- |
| `onApplyFilter`         | `(filter, allFilters) => void`        | Filter applied       |
| `onRemoveFilter`        | `(removed, remaining) => void`        | Filter tag removed   |
| `onClearFilters`        | `() => void`                          | Clear All clicked    |
| `onFilterChange`        | `(filters) => void`                   | Any filter change    |
| `onSearchChange`        | `(term) => void`                      | Search input changed |
| `onSortChange`          | `(sortConfig) => void`                | Column sort changed  |
| `onPageChange`          | `(page, info) => void`                | Page navigation      |
| `onPageSizeChange`      | `(size) => void`                      | Page size changed    |
| `onTableRefresh`        | `() => void`                          | Refresh clicked      |
| `onTableRowClick`       | `(row, event) => void`                | Row clicked          |
| `onTableRowDoubleClick` | `(row, event) => boolean \| void`     | Row double-clicked   |
| `onTableRowHover`       | `(row \| null, event) => void`        | Row hover            |
| `onRowSelect`           | `(row, isSelected) => void`           | Single row selection |
| `onSelectionChange`     | `(rows) => void`                      | Selection changed    |
| `onCellClick`           | `(value, row, column, event) => void` | Cell clicked         |
| `onBulkDelete`          | `(rows) => void`                      | Delete clicked       |

## Column Configuration

```tsx
interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean; // Default: true
  filterable?: boolean; // Default: true
  dataType?: 'string' | 'number' | 'boolean' | 'date' | 'datetime';
  width?: string | number;
  minWidth?: string | number;
  maxWidth?: string | number;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T, index: number) => ReactNode;
}
```

## 🎨 Theming & Styling

```tsx
// Clean, minimal design
<DataGrid variant="default" data={data} />

// Alternating row colors
<DataGrid variant="striped" data={data} />

// Full borders around cells
<DataGrid variant="bordered" data={data} />

// Size variants
<DataGrid size="sm" data={data} />  // Compact
<DataGrid size="md" data={data} />  // Standard
<DataGrid size="lg" data={data} />  // Comfortable

// Dark mode (automatic with Tailwind)
<div className="dark">
  <DataGrid data={data} />
</div>
```

## 🧪 Testing

```bash
npm test              # Run tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { DataGrid } from '@reactorui/datagrid';

test('handles filter application', async () => {
  const onApplyFilter = jest.fn();
  render(<DataGrid data={testData} enableFilters={true} onApplyFilter={onApplyFilter} />);

  // Select column, enter value, click Apply
  const selects = screen.getAllByRole('combobox');
  fireEvent.change(selects[0], { target: { value: 'name' } });

  const input = screen.getByPlaceholderText('Enter value');
  fireEvent.change(input, { target: { value: 'John' } });

  fireEvent.click(screen.getByRole('button', { name: /apply filter/i }));

  expect(onApplyFilter).toHaveBeenCalledWith(
    expect.objectContaining({ column: 'name', value: 'John' }),
    expect.any(Array)
  );
});
```

## 🔧 Development

```bash
npm install        # Install dependencies
npm test           # Run tests
npm run build      # Build library
npm run typecheck  # Type checking
npm run lint       # Linting
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## Related Projects

Part of the ReactorUI ecosystem:

- 📊 [@reactorui/recurrence](https://www.npmjs.com/package/@reactorui/recurrence) - Recurrence rule builder
- 🔜 More components coming soon!

---

**Made with ❤️ by ReactorUI**
