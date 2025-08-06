# @reactorui/datagrid

A high-performance, feature-rich React data grid component with TypeScript support, server-side integration, and advanced filtering capabilities.

## ✨ Features

- 🚀 **High Performance** - Optimized rendering and data processing
- 🔍 **Advanced Filtering** - Type-aware filters with multiple operators
- 🔄 **Flexible Data Sources** - Static data or server-side with any API
- 📱 **Responsive Design** - Mobile-first with touch-friendly interactions
- 🎨 **Customizable Theming** - Multiple built-in variants and custom styling
- ♿ **Accessibility First** - WCAG compliant with keyboard navigation
- 🔧 **TypeScript Native** - Full type safety and IntelliSense support

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

## 🛠 With Custom Columns

```tsx
import { DataGrid, Column } from '@reactorui/datagrid';

interface User {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'inactive';
}

const users: User[] = [
  { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'inactive' },
];

const columns: Column<User>[] = [
  { key: 'name', label: 'Full Name', sortable: true },
  { key: 'email', label: 'Email Address', sortable: true },
  {
    key: 'status',
    label: 'Status',
    render: (status) => (
      <span className={`badge ${status === 'active' ? 'success' : 'danger'}`}>{status}</span>
    ),
  },
];

function App() {
  return <DataGrid data={users} columns={columns} />;
}
```

## 🌐 Server-Side Data

```tsx
import { DataGrid } from '@reactorui/datagrid';

function App() {
  return (
    <DataGrid
      endpoint="/api/users"
      httpConfig={{
        bearerToken: 'your-auth-token',
        method: 'POST',
      }}
      serverPageSize={100}
      pageSize={25}
      onDataLoad={(data) => console.log('Loaded:', data)}
    />
  );
}
```

## 📖 API Reference

| Prop              | Type               | Default                          | Description                       |                                      |                      |
| ----------------- | ------------------ | -------------------------------- | --------------------------------- | ------------------------------------ | -------------------- |
| `data`            | `T[]`              | –                                | Static data array                 |                                      |                      |
| `endpoint`        | `string`           | –                                | API endpoint for server-side data |                                      |                      |
| `columns`         | `Column<T>[]`      | Auto                             | Column configuration              |                                      |                      |
| `enableSearch`    | `boolean`          | `true`                           | Enable search functionality       |                                      |                      |
| `enableSorting`   | `boolean`          | `true`                           | Enable column sorting             |                                      |                      |
| `enableFilters`   | `boolean`          | `true`                           | Enable advanced filtering         |                                      |                      |
| `enableSelection` | `boolean`          | `true`                           | Enable row selection              |                                      |                      |
| `pageSize`        | `number`           | `10`                             | Client-side page size             |                                      |                      |
| `serverPageSize`  | `number`           | `100`                            | Server request page size          |                                      |                      |
| `variant`         | \`'default'        | 'striped'                        | 'bordered'\`                      | `'default'`                          | Visual style variant |
| `size`            | \`'sm'             | 'md'                             | 'lg'\`                            | `'md'`                               | Size variant         |
| `httpConfig`      | \`{ method?: 'GET' | 'POST'; bearerToken?: string }\` | –                                 | HTTP config for server-side requests |                      |

## 📚 Examples

Check out the examples/ directory for complete working examples:
examples/basic/ - Basic usage with static data
examples/advanced/ - Advanced features with custom rendering
examples/server-side/ - Server-side data integration

🤝 Contributing
We welcome contributions! Please see our Contributing Guide for details.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
