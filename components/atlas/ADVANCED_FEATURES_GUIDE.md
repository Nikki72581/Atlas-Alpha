# Advanced Features Guide - Phase 5

## Overview

Phase 5 adds powerful advanced features to enhance data discovery, customization, and export capabilities:

- **Column Visibility** - Show/hide columns with visual controls
- **Advanced Filters** - Multi-criteria filtering with various operators
- **Data Export** - CSV and JSON export for all or selected data

These features integrate seamlessly with the Enhanced DataTable from Phase 1.

---

## 1. Column Visibility

### Component: `ColumnVisibility`

Allows users to show/hide table columns with a dropdown interface.

### Basic Usage

```tsx
import { ColumnVisibility, useColumnVisibility } from "@/components/atlas/column-visibility"

function MyTable() {
  const { visibility, setVisibility, getVisibleColumns } = useColumnVisibility()

  const allColumns = [
    { id: "name", header: "Name", ... },
    { id: "email", header: "Email", ... },
    { id: "phone", header: "Phone", ... },
  ]

  const visibleColumns = getVisibleColumns(allColumns)

  const columnConfig = allColumns.map(col => ({
    id: col.id,
    label: String(col.header),
    canToggle: col.id !== "name", // Make "name" always visible
  }))

  return (
    <>
      <ColumnVisibility
        columns={columnConfig}
        visibility={visibility}
        onVisibilityChange={setVisibility}
      />

      <EnhancedDataTable
        columns={visibleColumns}
        {...otherProps}
      />
    </>
  )
}
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `columns` | `Array<{id, label, canToggle?}>` | ✅ | Column definitions |
| `visibility` | `Record<string, boolean>` | ✅ | Visibility state |
| `onVisibilityChange` | `(visibility) => void` | ✅ | Change handler |
| `className` | `string` | ❌ | Additional CSS classes |

### useColumnVisibility Hook

```tsx
const {
  visibility,          // Current visibility state
  setVisibility,       // Update visibility
  isColumnVisible,     // Check if column is visible
  getVisibleColumns,   // Filter columns by visibility
  reset,               // Reset to defaults
} = useColumnVisibility(defaultVisibility)
```

### Features

- ✅ Show/Hide individual columns via checkboxes
- ✅ "Show all" / "Hide all" buttons
- ✅ Reset to defaults
- ✅ Visual indicator showing X/Y columns visible
- ✅ Prevent hiding required columns (canToggle: false)
- ✅ Persistent state (hook-based)

---

## 2. Advanced Filters

### Component: `AdvancedFilters`

Multi-criteria filtering with various operators for complex queries.

### Basic Usage

```tsx
import { AdvancedFilters, useAdvancedFilters } from "@/components/atlas/advanced-filters"

function MyTable() {
  const { filters, setFilters, applyFilters } = useAdvancedFilters()

  const filterFields = [
    { id: "name", label: "Name", type: "text" },
    { id: "email", label: "Email", type: "text" },
    { id: "status", label: "Status", type: "select", options: [
      { label: "Active", value: "active" },
      { label: "Inactive", value: "inactive" },
    ]},
    { id: "revenue", label: "Revenue", type: "number" },
  ]

  const filteredData = applyFilters(data)

  return (
    <>
      <AdvancedFilters
        fields={filterFields}
        filters={filters}
        onFiltersChange={setFilters}
      />

      <EnhancedDataTable data={filteredData} {...otherProps} />
    </>
  )
}
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `fields` | `FilterField[]` | ✅ | Available filter fields |
| `filters` | `FilterCondition[]` | ✅ | Current filters |
| `onFiltersChange` | `(filters) => void` | ✅ | Change handler |
| `className` | `string` | ❌ | Additional CSS classes |

### Filter Field Types

```tsx
type FilterField = {
  id: string
  label: string
  type: "text" | "number" | "date" | "select"
  options?: Array<{ label: string; value: string }> // For select type
}
```

### Available Operators

**Text Operators:**
- `equals` - Exact match (case-insensitive)
- `notEquals` - Not equal to
- `contains` - Contains text
- `notContains` - Does not contain text
- `startsWith` - Starts with text
- `endsWith` - Ends with text
- `isEmpty` - Is empty/null
- `isNotEmpty` - Has a value

**Number Operators:**
- `equals` - Equal to
- `notEquals` - Not equal to
- `greaterThan` - Greater than
- `lessThan` - Less than
- `greaterThanOrEqual` - Greater than or equal
- `lessThanOrEqual` - Less than or equal
- `isEmpty` - Is null
- `isNotEmpty` - Has a value

### Filter Condition Type

```tsx
type FilterCondition = {
  id: string              // Unique ID
  field: string           // Field to filter on
  operator: FilterOperator
  value: string           // Filter value
}
```

### useAdvancedFilters Hook

```tsx
const {
  filters,           // Current filter conditions
  setFilters,        // Update filters
  applyFilters,      // Apply filters to data array
  clearFilters,      // Remove all filters
  hasFilters,        // Boolean: any filters applied?
} = useAdvancedFilters(initialFilters)
```

### Features

- ✅ Multiple filter conditions (AND logic)
- ✅ Field-appropriate operators
- ✅ Select fields with dropdown options
- ✅ Add/remove individual filters
- ✅ Clear all filters
- ✅ Visual badge showing filter count
- ✅ Client-side filtering (instant results)

### Examples

**Filter for customers with revenue > $50,000:**
```tsx
{
  id: "rev1",
  field: "revenue",
  operator: "greaterThan",
  value: "50000"
}
```

**Filter for names containing "Acme":**
```tsx
{
  id: "name1",
  field: "name",
  operator: "contains",
  value: "Acme"
}
```

**Filter for active status:**
```tsx
{
  id: "status1",
  field: "status",
  operator: "equals",
  value: "active"
}
```

---

## 3. Data Export

### Component: `ExportData`

Export table data to CSV or JSON format.

### Basic Usage

```tsx
import { ExportData } from "@/components/atlas/export-data"

function MyTable() {
  const { selectedIds } = useTableSelection()

  const exportColumns = [
    { id: "number", header: "Customer Number", accessorKey: "number" },
    { id: "name", header: "Customer Name", accessorKey: "name" },
    { id: "revenue", header: "Revenue", accessorKey: "revenue",
      formatter: (val) => `$${val.toLocaleString()}` },
  ]

  return (
    <ExportData
      data={filteredData}
      columns={exportColumns}
      filename="customers"
      selectedIds={selectedIds}
      getRowId={(row) => row.id}
    />
  )
}
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `data` | `T[]` | ✅ | Data to export |
| `columns` | `ExportColumn<T>[]` | ✅ | Column definitions |
| `filename` | `string` | ❌ | Base filename (default: "export") |
| `selectedIds` | `string[]` | ❌ | IDs of selected rows |
| `getRowId` | `(row: T) => string` | ❌ | Function to get row ID |
| `className` | `string` | ❌ | Additional CSS classes |

### Export Column Type

```tsx
type ExportColumn<T> = {
  id: string
  header: string              // Column header in export file
  accessorKey?: keyof T       // Direct property access
  accessorFn?: (row: T) => any // Custom accessor
  formatter?: (value: any) => string // Format value for export
}
```

### Export Formats

**CSV Export:**
- Headers as first row
- Comma-separated values
- Handles commas, quotes, newlines in data
- Compatible with Excel, Google Sheets

**JSON Export:**
- Array of objects
- Pretty-printed (indented)
- Preserves data types
- Easy to import into other systems

### Features

- ✅ Export all data or selected rows only
- ✅ CSV and JSON formats
- ✅ Custom formatters for complex values
- ✅ Proper CSV escaping (quotes, commas)
- ✅ Browser download (no server required)
- ✅ Visual row counts in menu
- ✅ Conditional "selected only" options

### Formatter Examples

**Currency:**
```tsx
{
  id: "revenue",
  header: "Total Revenue",
  accessorKey: "revenue",
  formatter: (val) => `$${val.toLocaleString()}`
}
```

**Date:**
```tsx
{
  id: "createdAt",
  header: "Created Date",
  accessorKey: "createdAt",
  formatter: (val) => new Date(val).toLocaleDateString()
}
```

**Boolean:**
```tsx
{
  id: "isActive",
  header: "Active",
  accessorKey: "isActive",
  formatter: (val) => val ? "Yes" : "No"
}
```

**Custom:**
```tsx
{
  id: "fullName",
  header: "Full Name",
  accessorFn: (row) => `${row.firstName} ${row.lastName}`
}
```

---

## Complete Integration Example

Here's how to use all three features together:

```tsx
import { useState } from "react"
import { EnhancedDataTable, useTableSelection } from "@/components/atlas/enhanced-data-table"
import { ColumnVisibility, useColumnVisibility } from "@/components/atlas/column-visibility"
import { AdvancedFilters, useAdvancedFilters } from "@/components/atlas/advanced-filters"
import { ExportData } from "@/components/atlas/export-data"

function AdvancedCustomersTable({ customers }) {
  // State management
  const { selectedIds, setSelectedIds, clearSelection } = useTableSelection()
  const { visibility, setVisibility, getVisibleColumns } = useColumnVisibility()
  const { filters, setFilters, applyFilters } = useAdvancedFilters()

  // Define columns (all)
  const allColumns = [
    { id: "number", header: "Number", accessorKey: "number", sortable: true },
    { id: "name", header: "Name", accessorKey: "name", sortable: true },
    { id: "email", header: "Email", accessorKey: "email", sortable: true },
    { id: "phone", header: "Phone", accessorKey: "phone", sortable: true },
    { id: "status", header: "Status", accessorKey: "status", sortable: true },
  ]

  // Get visible columns
  const visibleColumns = getVisibleColumns(allColumns)

  // Define filter fields
  const filterFields = [
    { id: "name", label: "Name", type: "text" },
    { id: "email", label: "Email", type: "text" },
    { id: "status", label: "Status", type: "select", options: [
      { label: "Active", value: "active" },
      { label: "Inactive", value: "inactive" },
    ]},
  ]

  // Define export columns
  const exportColumns = allColumns.map(col => ({
    id: col.id,
    header: String(col.header),
    accessorKey: col.accessorKey,
  }))

  // Column visibility config
  const columnConfig = allColumns.map(col => ({
    id: col.id,
    label: String(col.header),
    canToggle: col.id !== "name", // Keep "name" always visible
  }))

  // Apply filters
  const filteredData = applyFilters(customers)

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ColumnVisibility
            columns={columnConfig}
            visibility={visibility}
            onVisibilityChange={setVisibility}
          />
          <AdvancedFilters
            fields={filterFields}
            filters={filters}
            onFiltersChange={setFilters}
          />
        </div>
        <ExportData
          data={filteredData}
          columns={exportColumns}
          filename="customers"
          selectedIds={selectedIds}
          getRowId={(row) => row.id}
        />
      </div>

      {/* Table */}
      <EnhancedDataTable
        data={filteredData}
        columns={visibleColumns}
        getRowId={(row) => row.id}
        onSelectionChange={setSelectedIds}
        enableSelection={true}
        enableSorting={true}
      />
    </div>
  )
}
```

---

## Best Practices

### Column Visibility

1. **Always Visible Columns**: Mark key identifier columns (like ID or name) as `canToggle: false`
2. **Default State**: Start with all columns visible for first-time users
3. **Persistence**: Consider saving visibility preferences to localStorage
4. **Mobile**: Hide less important columns by default on small screens

### Advanced Filters

1. **Field Selection**: Only expose filterable fields (not computed/display-only columns)
2. **Operator Selection**: Match operators to field types (text vs number)
3. **Performance**: For large datasets (>1000 rows), consider server-side filtering
4. **User Guidance**: Provide examples or tooltips for complex filters

### Data Export

1. **Formatters**: Always format dates, currency, and booleans for readability
2. **Headers**: Use clear, business-friendly column headers in exports
3. **Selection**: Export selected rows when user has active selection
4. **Privacy**: Exclude sensitive fields (passwords, tokens) from export columns

---

## UI/UX Principles Addressed

From the UI/UX Concepts document:

**✅ High-signal dashboards and lists**
- Column visibility lets users focus on relevant data
- Advanced filters enable precise data discovery
- Export allows offline analysis

**✅ Search that actually works**
- Multiple filter criteria with various operators
- Instant client-side filtering
- Visual feedback on active filters

**✅ Defaults that feel psychic**
- Remember column visibility preferences
- Save frequently used filter combinations
- Smart operator suggestions based on field type

**✅ Performance and responsiveness**
- Client-side filtering for instant results
- Efficient column visibility toggling
- Browser-based export (no server delay)

---

## Keyboard Shortcuts (Future Enhancement)

Suggested shortcuts for power users:

- `Ctrl/Cmd + H` - Toggle column visibility menu
- `Ctrl/Cmd + F` - Open advanced filters
- `Ctrl/Cmd + E` - Export data
- `Ctrl/Cmd + Shift + C` - Toggle all columns
- `Ctrl/Cmd + Shift + R` - Reset filters

---

## Migration from Basic Features

If you're currently using basic search and filters, here's how to upgrade:

**Before:**
```tsx
const [searchTerm, setSearchTerm] = useState("")
const filtered = data.filter(item =>
  item.name.includes(searchTerm)
)
```

**After:**
```tsx
const { filters, setFilters, applyFilters } = useAdvancedFilters()
const filtered = applyFilters(data)

<AdvancedFilters
  fields={filterFields}
  filters={filters}
  onFiltersChange={setFilters}
/>
```

---

## Performance Considerations

- **Client-side Filtering**: Works well for up to ~5,000 rows
- **Large Datasets**: Consider server-side filtering with debounced requests
- **Export**: Browser handles up to ~50,000 rows comfortably
- **Column Visibility**: No performance impact (just filters array)

---

## Browser Compatibility

- **Column Visibility**: All modern browsers
- **Advanced Filters**: All modern browsers
- **Export**: IE11+ (uses Blob API and URL.createObjectURL)

---

## Examples

See [advanced-features-example.tsx](./advanced-features-example.tsx) for a complete working example integrating all three features.
