# Quick Preview Panel Guide

## Overview

The Quick Preview Panel component provides a slide-out drawer interface for viewing detailed information without losing context. It's perfect for implementing the UI/UX principle of **"quick preview without context-switching"**.

### Key Features

- ✅ **Context Preservation** - View details without leaving the list view
- ✅ **Multiple Layouts** - Supports structured sections or custom children
- ✅ **Action Integration** - Built-in footer for quick actions (edit, delete, etc.)
- ✅ **Type Safety** - Full TypeScript generics support
- ✅ **Flexible Positioning** - Slide from right, left, top, or bottom
- ✅ **Customizable Width** - Multiple preset widths (sm, md, lg, xl, 2xl)
- ✅ **Dynamic Content** - Use functions to compute content based on selected data

## Basic Usage

### 1. Import Components

```tsx
import {
  QuickPreviewPanel,
  useQuickPreview,
  createPreviewSection,
  type PreviewAction,
} from "@/components/atlas/quick-preview-panel"
```

### 2. Set Up Preview State

```tsx
const { isOpen, selectedItem, openPreview, setIsOpen } = useQuickPreview<YourDataType>()
```

### 3. Add Preview Trigger

```tsx
<Button onClick={() => openPreview(data)}>
  <Eye className="h-4 w-4" />
</Button>
```

### 4. Render Preview Panel

```tsx
<QuickPreviewPanel
  open={isOpen}
  onOpenChange={setIsOpen}
  data={selectedItem}
  title="Item Details"
  sections={sections}
  actions={actions}
/>
```

## Component API

### QuickPreviewPanel Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `open` | `boolean` | ✅ | - | Controls panel visibility |
| `onOpenChange` | `(open: boolean) => void` | ✅ | - | Callback when panel opens/closes |
| `data` | `TData \| null` | ✅ | - | Data to display in preview |
| `title` | `string \| ((data: TData) => string)` | ✅ | - | Panel title |
| `description` | `string \| ((data: TData) => string)` | ❌ | - | Optional description |
| `sections` | `PreviewSection[] \| ((data: TData) => PreviewSection[])` | ✅* | - | Structured data sections |
| `actions` | `PreviewAction[] \| ((data: TData) => PreviewAction[])` | ❌ | - | Action buttons in footer |
| `children` | `React.ReactNode \| ((data: TData) => React.ReactNode)` | ❌ | - | Custom content (replaces sections) |
| `side` | `"left" \| "right" \| "top" \| "bottom"` | ❌ | `"right"` | Panel slide direction |
| `width` | `"sm" \| "md" \| "lg" \| "xl" \| "2xl"` | ❌ | `"lg"` | Panel width |
| `className` | `string` | ❌ | - | Additional CSS classes |

\* Required unless using `children` for custom layout

### PreviewSection Type

```tsx
type PreviewSection = {
  title?: string              // Optional section title
  fields: PreviewField[]      // Array of fields to display
  className?: string          // Optional CSS classes
}

type PreviewField = {
  label: string              // Field label
  value: React.ReactNode     // Field value (can be JSX)
  fullWidth?: boolean        // Span both columns
  className?: string         // Optional CSS classes
}
```

### PreviewAction Type

```tsx
type PreviewAction = {
  label: string                    // Button label
  icon?: React.ReactNode           // Optional icon
  onClick: () => void | Promise<void>
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost"
  disabled?: boolean
}
```

## Usage Patterns

### Pattern 1: Static Sections

Use when preview content doesn't change based on selected data structure.

```tsx
const sections: PreviewSection[] = [
  createPreviewSection("Personal Info", [
    { label: "Name", value: selectedItem?.name || "" },
    { label: "Email", value: selectedItem?.email || "" },
  ]),
]

<QuickPreviewPanel
  open={isOpen}
  onOpenChange={setIsOpen}
  data={selectedItem}
  title="User Details"
  sections={sections}
/>
```

### Pattern 2: Dynamic Sections with Functions

Use when content adapts to the selected data.

```tsx
<QuickPreviewPanel
  open={isOpen}
  onOpenChange={setIsOpen}
  data={selectedItem}
  title={(user) => `${user.name} - ${user.role}`}
  description={(user) => user.email}
  sections={(user) => [
    createPreviewSection("Details", [
      { label: "Status", value: user.isActive ? "Active" : "Inactive" },
      { label: "Join Date", value: user.joinDate },
    ]),
  ]}
  actions={(user) => [
    {
      label: "Edit",
      onClick: () => handleEdit(user),
    },
    {
      label: user.isActive ? "Deactivate" : "Activate",
      onClick: () => toggleStatus(user),
    },
  ]}
/>
```

### Pattern 3: Custom Layout with Children

Use for complex layouts that don't fit the section pattern.

```tsx
<QuickPreviewPanel
  open={isOpen}
  onOpenChange={setIsOpen}
  data={selectedItem}
  title="Order Details"
  sections={[]} // Required but empty when using children
>
  {(order) => (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-2">Items</h3>
        {order.items.map((item) => (
          <div key={item.id} className="p-3 bg-muted rounded-lg">
            {item.name} - ${item.price}
          </div>
        ))}
      </div>
      <div>
        <h3 className="font-semibold mb-2">Shipping</h3>
        <p>{order.shippingAddress}</p>
      </div>
    </div>
  )}
</QuickPreviewPanel>
```

## Integration with EnhancedDataTable

### Adding Preview Button to Table

```tsx
const columns: ColumnDef<User>[] = [
  // ... other columns
  {
    id: "preview",
    header: "",
    sortable: false,
    className: "w-12",
    cell: (row) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => openPreview(row)}
        className="h-8 w-8 p-0"
      >
        <Eye className="h-4 w-4" />
      </Button>
    ),
  },
]
```

### Complete Integration Example

```tsx
function MyTable() {
  const { selectedIds, setSelectedIds } = useTableSelection()
  const { isOpen, selectedItem, openPreview, setIsOpen } = useQuickPreview<User>()

  return (
    <>
      <EnhancedDataTable
        data={users}
        columns={columnsWithPreviewButton}
        getRowId={(row) => row.id}
        onSelectionChange={setSelectedIds}
      />

      <QuickPreviewPanel
        open={isOpen}
        onOpenChange={setIsOpen}
        data={selectedItem}
        title={(user) => user.name}
        sections={(user) => [...]}
        actions={(user) => [...]}
      />
    </>
  )
}
```

## Helper Functions

### createPreviewSection

Utility to create sections with less boilerplate.

```tsx
const section = createPreviewSection("Title", [
  { label: "Field 1", value: "Value 1" },
  { label: "Field 2", value: "Value 2", fullWidth: true },
])
```

### useQuickPreview Hook

Manages preview panel state.

```tsx
const {
  isOpen,           // boolean - Panel open state
  selectedItem,     // TData | null - Currently previewed item
  openPreview,      // (item: TData) => void - Open with item
  closePreview,     // () => void - Close panel
  togglePreview,    // (item: TData) => void - Toggle for item
  setIsOpen,        // (open: boolean) => void - Set open state
} = useQuickPreview<TData>()
```

## Utility Components

### PreviewBadge

Styled badge for status indicators in preview.

```tsx
import { PreviewBadge } from "@/components/atlas/quick-preview-panel"

<PreviewBadge variant="success">Active</PreviewBadge>
<PreviewBadge variant="error">Inactive</PreviewBadge>
<PreviewBadge variant="warning">Pending</PreviewBadge>
<PreviewBadge variant="info">Draft</PreviewBadge>
```

### PreviewFieldValue

Emphasized text for important values.

```tsx
import { PreviewFieldValue } from "@/components/atlas/quick-preview-panel"

{
  label: "Total",
  value: <PreviewFieldValue>${total}</PreviewFieldValue>
}
```

## Styling Customization

### Panel Width

```tsx
<QuickPreviewPanel
  width="sm"   // 384px max
  width="md"   // 448px max
  width="lg"   // 512px max (default)
  width="xl"   // 576px max
  width="2xl"  // 672px max
/>
```

### Panel Position

```tsx
<QuickPreviewPanel
  side="right"  // Slide from right (default)
  side="left"   // Slide from left
  side="top"    // Slide from top
  side="bottom" // Slide from bottom
/>
```

### Field Layout

```tsx
// Two-column layout (default)
{ label: "Name", value: "John" }

// Full-width field
{ label: "Description", value: "Long text...", fullWidth: true }

// Custom styling
{
  label: "Status",
  value: <Badge>Active</Badge>,
  className: "border-t pt-3"
}
```

## Best Practices

### 1. Use Dynamic Functions for Computed Content

```tsx
// ✅ Good - Computed based on data
sections={(account) => [
  createPreviewSection("Balance", [
    {
      label: "Amount",
      value: (
        <span className={account.balance > 0 ? "text-green-600" : "text-red-600"}>
          ${account.balance}
        </span>
      ),
    },
  ]),
]}

// ❌ Bad - Static content that doesn't adapt
sections={staticSections}
```

### 2. Group Related Information

```tsx
// ✅ Good - Logical grouping
[
  createPreviewSection("Contact Information", [
    { label: "Email", value: user.email },
    { label: "Phone", value: user.phone },
  ]),
  createPreviewSection("Employment", [
    { label: "Department", value: user.department },
    { label: "Role", value: user.role },
  ]),
]
```

### 3. Use Appropriate Action Variants

```tsx
actions={[
  { label: "Edit", variant: "outline" },        // Primary actions
  { label: "Export", variant: "secondary" },    // Secondary actions
  { label: "Delete", variant: "destructive" },  // Dangerous actions
]}
```

### 4. Handle Loading States

```tsx
const { isOpen, selectedItem, openPreview } = useQuickPreview<User>()
const [isLoading, setIsLoading] = useState(false)

const handlePreview = async (user: User) => {
  openPreview(user)
  setIsLoading(true)
  await fetchAdditionalData(user.id)
  setIsLoading(false)
}
```

## Examples

See [quick-preview-panel-example.tsx](./quick-preview-panel-example.tsx) for comprehensive examples:

1. Basic preview with static sections
2. Dynamic preview with function-based content
3. Custom layout with children

## Accessibility

The component uses Radix UI Dialog primitive with:
- ARIA labels for screen readers
- Keyboard navigation (ESC to close)
- Focus management
- Proper semantic HTML

## Performance

- Panel content only renders when `data` is not null
- Exit animations delay state clearing for smooth transitions
- Memoize expensive computations in dynamic functions

## Common Issues

### Preview not showing
- Ensure `open={isOpen}` is properly connected to state
- Verify `data` is not null when panel should be visible
- Check that `onOpenChange` updates state correctly

### Content not updating
- Use function-based props for dynamic content
- Ensure `data` changes trigger re-renders
- Check memoization isn't preventing updates

### Actions not working
- Verify `onClick` handlers are defined
- Check for async errors (use try/catch)
- Ensure panel doesn't close before action completes
