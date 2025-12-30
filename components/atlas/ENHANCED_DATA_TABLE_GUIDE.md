# Enhanced DataTable Component Guide

## Overview

The `EnhancedDataTable` component is a powerful, feature-rich table component that provides:

- ✅ **Row Selection** - Multi-select with checkboxes and "select all" functionality
- ✅ **Column Sorting** - Click-to-sort with visual indicators (asc/desc/none)
- ✅ **Bulk Actions** - Perform operations on multiple rows at once
- ✅ **Type Safety** - Full TypeScript support with generics
- ✅ **Flexible Cell Rendering** - Custom cell renderers for complex content
- ✅ **Accessibility** - ARIA labels and keyboard navigation support

## Basic Usage

```tsx
import { EnhancedDataTable, type ColumnDef } from "@/components/atlas/enhanced-data-table"

type User = {
  id: string
  name: string
  email: string
}

function MyTable() {
  const users: User[] = [
    { id: "1", name: "John", email: "john@example.com" },
    { id: "2", name: "Jane", email: "jane@example.com" },
  ]

  const columns: ColumnDef<User>[] = [
    {
      id: "name",
      header: "Name",
      accessorKey: "name",
      sortable: true,
    },
    {
      id: "email",
      header: "Email",
      accessorKey: "email",
      sortable: true,
    },
  ]

  return (
    <EnhancedDataTable
      data={users}
      columns={columns}
      getRowId={(row) => row.id}
    />
  )
}
```

## Column Definition

Each column in the `columns` array can have the following properties:

### Required Properties

- `id: string` - Unique identifier for the column
- `header: string | React.ReactNode` - Column header content

### Optional Properties

- `accessorKey?: keyof TData` - Direct property access (e.g., `"name"`)
- `accessorFn?: (row: TData) => any` - Custom function to extract cell value
- `cell?: (row: TData) => React.ReactNode` - Custom cell renderer
- `sortable?: boolean` - Enable/disable sorting (default: true if sorting enabled)
- `className?: string` - CSS classes for cell
- `headerClassName?: string` - CSS classes for header

### Column Examples

#### Simple Column (Direct Property Access)
```tsx
{
  id: "name",
  header: "Name",
  accessorKey: "name",
  sortable: true,
}
```

#### Custom Cell Renderer
```tsx
{
  id: "status",
  header: "Status",
  accessorKey: "isActive",
  cell: (row) => (
    <Badge variant={row.isActive ? "default" : "secondary"}>
      {row.isActive ? "Active" : "Inactive"}
    </Badge>
  ),
}
```

#### Derived/Calculated Column
```tsx
{
  id: "totalValue",
  header: "Total Value",
  accessorFn: (row) => row.price * row.quantity,
  cell: (row) => `$${(row.price * row.quantity).toFixed(2)}`,
  sortable: true,
}
```

#### Actions Column (Non-sortable)
```tsx
{
  id: "actions",
  header: "Actions",
  sortable: false,
  headerClassName: "text-right",
  className: "text-right",
  cell: (row) => (
    <div className="flex gap-2 justify-end">
      <Button size="sm" onClick={() => handleEdit(row)}>Edit</Button>
      <Button size="sm" variant="destructive" onClick={() => handleDelete(row)}>Delete</Button>
    </div>
  ),
}
```

## Props Reference

### EnhancedDataTable Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `data` | `TData[]` | ✅ | - | Array of data to display |
| `columns` | `ColumnDef<TData>[]` | ✅ | - | Column definitions |
| `getRowId` | `(row: TData) => string` | ✅ | - | Function to extract unique row ID |
| `onSelectionChange` | `(selectedIds: string[]) => void` | ❌ | - | Callback when selection changes |
| `enableSelection` | `boolean` | ❌ | `true` | Enable row selection checkboxes |
| `enableSorting` | `boolean` | ❌ | `true` | Enable column sorting |
| `className` | `string` | ❌ | - | Additional CSS classes |
| `emptyMessage` | `string` | ❌ | `"No data available."` | Message shown when no data |
| `stickyHeader` | `boolean` | ❌ | `false` | Make header sticky on scroll |

## Bulk Actions

### Using the BulkActionBar Component

```tsx
import { BulkActionBar, useTableSelection, type BulkAction } from "@/components/atlas/enhanced-data-table"

function MyTable() {
  const { selectedIds, setSelectedIds, clearSelection, selectedCount } = useTableSelection()

  const bulkActions: BulkAction[] = [
    {
      label: "Delete",
      icon: <Trash2 className="h-4 w-4" />,
      variant: "destructive",
      onClick: async () => {
        if (confirm(`Delete ${selectedCount} items?`)) {
          await deleteItems(selectedIds)
          clearSelection()
        }
      },
    },
    {
      label: "Export",
      icon: <Download className="h-4 w-4" />,
      variant: "outline",
      onClick: () => exportItems(selectedIds),
    },
  ]

  return (
    <>
      <BulkActionBar
        selectedCount={selectedCount}
        totalCount={data.length}
        actions={bulkActions}
        onClearSelection={clearSelection}
      />
      <EnhancedDataTable
        data={data}
        columns={columns}
        getRowId={(row) => row.id}
        onSelectionChange={setSelectedIds}
      />
    </>
  )
}
```

### BulkAction Type

```tsx
type BulkAction = {
  label: string                    // Button label
  icon?: React.ReactNode           // Optional icon
  onClick: (selectedIds: string[]) => void | Promise<void>
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost"
  disabled?: boolean               // Disable the action button
}
```

## Managing Selection State

### useTableSelection Hook

The `useTableSelection` hook provides convenient state management for row selection:

```tsx
const {
  selectedIds,      // string[] - Currently selected row IDs
  setSelectedIds,   // (ids: string[]) => void - Set selected IDs
  clearSelection,   // () => void - Clear all selections
  selectAll,        // (ids: string[]) => void - Select all provided IDs
  toggleSelection,  // (id: string) => void - Toggle single row
  selectedCount,    // number - Count of selected rows
} = useTableSelection()
```

## Sorting Behavior

- Click a sortable column header to sort ascending
- Click again to sort descending
- Click a third time to remove sorting (return to original order)
- Visual indicators show current sort state:
  - `↕` - No sort applied
  - `↑` - Ascending sort
  - `↓` - Descending sort

### Sorting Algorithm

The component handles different data types automatically:
- **Strings**: Case-insensitive locale-aware comparison
- **Numbers**: Numeric comparison
- **Booleans**: false < true
- **Null/Undefined**: Always sorted to the end
- **Other**: Converted to string and compared

## Complete Example

See [enhanced-data-table-example.tsx](./enhanced-data-table-example.tsx) for comprehensive usage examples including:

1. Basic usage with sorting only
2. Full-featured with bulk actions
3. Custom accessor functions for derived columns

## Migration from Basic DataTable

If you're currently using the basic `DataTable` component, here's how to migrate:

### Before (Basic DataTable)
```tsx
<DataTable>
  <thead>
    <tr>
      <Th>Name</Th>
      <Th>Email</Th>
    </tr>
  </thead>
  <tbody>
    {users.map((user) => (
      <Tr key={user.id}>
        <Td>{user.name}</Td>
        <Td>{user.email}</Td>
      </Tr>
    ))}
  </tbody>
</DataTable>
```

### After (Enhanced DataTable)
```tsx
const columns: ColumnDef<User>[] = [
  { id: "name", header: "Name", accessorKey: "name" },
  { id: "email", header: "Email", accessorKey: "email" },
]

<EnhancedDataTable
  data={users}
  columns={columns}
  getRowId={(row) => row.id}
  enableSelection={false}  // Add this if you don't need selection
/>
```

## Styling Customization

The component uses Tailwind CSS and follows your existing design system. You can customize:

- Table wrapper: Pass `className` prop
- Column headers: Use `headerClassName` in column definition
- Cells: Use `className` in column definition
- Selected rows: Automatically highlighted with `bg-muted/30`

## Performance Considerations

- Sorting is memoized and only recalculates when data or sort state changes
- Selection state is optimized using Sets for O(1) lookups
- Large datasets (>1000 rows) should implement pagination (see future enhancements)

## Future Enhancements

Potential additions for Phase 5:

- Column visibility controls
- Column resizing
- Column reordering (drag & drop)
- Pagination
- Virtual scrolling for large datasets
- Advanced filtering UI
- Export to CSV/Excel
- Keyboard navigation
- Row expansion/collapsible details

## Troubleshooting

### Selection not working
- Ensure `enableSelection={true}` is set (it's true by default)
- Make sure `onSelectionChange` callback is provided
- Verify `getRowId` returns unique strings for each row

### Sorting not working
- Ensure `enableSorting={true}` is set (it's true by default)
- Make sure column has `sortable: true` or doesn't explicitly set it to false
- Verify `accessorKey` or `accessorFn` is defined for the column

### TypeScript errors
- Ensure your data type is properly defined
- Use `ColumnDef<YourDataType>[]` for columns array
- Make sure `accessorKey` values match your data type properties
