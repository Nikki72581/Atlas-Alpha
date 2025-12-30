"use client"

/**
 * ENHANCED DATA TABLE - USAGE EXAMPLES
 *
 * This file demonstrates how to use the EnhancedDataTable component
 * with bulk actions, sorting, and row selection.
 */

import { useState } from "react"
import {
  EnhancedDataTable,
  BulkActionBar,
  useTableSelection,
  type ColumnDef,
  type BulkAction,
} from "./enhanced-data-table"
import { Trash2, CheckCircle, XCircle, Download } from "lucide-react"
import { Badge } from "@/components/ui/badge"

// ============================================================================
// Example 1: Basic Usage with Sorting
// ============================================================================

type User = {
  id: string
  name: string
  email: string
  role: string
  status: "active" | "inactive"
}

export function BasicExample() {
  const users: User[] = [
    { id: "1", name: "John Doe", email: "john@example.com", role: "Admin", status: "active" },
    { id: "2", name: "Jane Smith", email: "jane@example.com", role: "User", status: "active" },
    { id: "3", name: "Bob Johnson", email: "bob@example.com", role: "User", status: "inactive" },
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
      className: "text-muted-foreground",
    },
    {
      id: "role",
      header: "Role",
      accessorKey: "role",
      sortable: true,
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "status",
      sortable: true,
      cell: (row) => (
        <Badge variant={row.status === "active" ? "default" : "secondary"}>
          {row.status}
        </Badge>
      ),
    },
  ]

  return (
    <EnhancedDataTable
      data={users}
      columns={columns}
      getRowId={(row) => row.id}
      enableSelection={false} // Disable selection for this simple example
    />
  )
}

// ============================================================================
// Example 2: Full Featured with Bulk Actions
// ============================================================================

export function FullFeaturedExample() {
  const [users, setUsers] = useState<User[]>([
    { id: "1", name: "John Doe", email: "john@example.com", role: "Admin", status: "active" },
    { id: "2", name: "Jane Smith", email: "jane@example.com", role: "User", status: "active" },
    { id: "3", name: "Bob Johnson", email: "bob@example.com", role: "User", status: "inactive" },
    { id: "4", name: "Alice Williams", email: "alice@example.com", role: "User", status: "active" },
  ])

  const { selectedIds, setSelectedIds, clearSelection, selectedCount } = useTableSelection()

  const columns: ColumnDef<User>[] = [
    {
      id: "name",
      header: "Name",
      accessorKey: "name",
      sortable: true,
      className: "font-medium",
    },
    {
      id: "email",
      header: "Email",
      accessorKey: "email",
      sortable: true,
      className: "text-muted-foreground",
    },
    {
      id: "role",
      header: "Role",
      accessorKey: "role",
      sortable: true,
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "status",
      sortable: true,
      cell: (row) => (
        <Badge variant={row.status === "active" ? "default" : "secondary"}>
          {row.status}
        </Badge>
      ),
    },
  ]

  const bulkActions: BulkAction[] = [
    {
      label: "Activate",
      icon: <CheckCircle className="h-4 w-4" />,
      variant: "outline",
      onClick: async (ids) => {
        console.log("Activating users:", selectedIds)
        setUsers((prev) =>
          prev.map((user) =>
            selectedIds.includes(user.id) ? { ...user, status: "active" as const } : user
          )
        )
        clearSelection()
      },
    },
    {
      label: "Deactivate",
      icon: <XCircle className="h-4 w-4" />,
      variant: "outline",
      onClick: async (ids) => {
        console.log("Deactivating users:", selectedIds)
        setUsers((prev) =>
          prev.map((user) =>
            selectedIds.includes(user.id) ? { ...user, status: "inactive" as const } : user
          )
        )
        clearSelection()
      },
    },
    {
      label: "Export",
      icon: <Download className="h-4 w-4" />,
      variant: "outline",
      onClick: (ids) => {
        console.log("Exporting users:", selectedIds)
        // Export logic here
      },
    },
    {
      label: "Delete",
      icon: <Trash2 className="h-4 w-4" />,
      variant: "destructive",
      onClick: async (ids) => {
        if (confirm(`Delete ${selectedIds.length} users?`)) {
          console.log("Deleting users:", selectedIds)
          setUsers((prev) => prev.filter((user) => !selectedIds.includes(user.id)))
          clearSelection()
        }
      },
    },
  ]

  return (
    <div>
      <BulkActionBar
        selectedCount={selectedCount}
        totalCount={users.length}
        actions={bulkActions.map((action) => ({
          ...action,
          onClick: () => action.onClick(selectedIds),
        }))}
        onClearSelection={clearSelection}
      />
      <EnhancedDataTable
        data={users}
        columns={columns}
        getRowId={(row) => row.id}
        onSelectionChange={setSelectedIds}
        enableSelection={true}
        enableSorting={true}
      />
    </div>
  )
}

// ============================================================================
// Example 3: Custom Accessor Function
// ============================================================================

type Product = {
  id: string
  name: string
  price: number
  stock: number
}

export function CustomAccessorExample() {
  const products: Product[] = [
    { id: "1", name: "Widget A", price: 19.99, stock: 100 },
    { id: "2", name: "Widget B", price: 29.99, stock: 50 },
    { id: "3", name: "Widget C", price: 9.99, stock: 200 },
  ]

  const columns: ColumnDef<Product>[] = [
    {
      id: "name",
      header: "Product Name",
      accessorKey: "name",
      sortable: true,
    },
    {
      id: "price",
      header: "Price",
      accessorKey: "price",
      sortable: true,
      cell: (row) => `$${row.price.toFixed(2)}`,
    },
    {
      id: "stock",
      header: "Stock",
      accessorKey: "stock",
      sortable: true,
      cell: (row) => (
        <span className={row.stock < 100 ? "text-orange-600" : "text-green-600"}>
          {row.stock} units
        </span>
      ),
    },
    {
      id: "value",
      header: "Total Value",
      // Custom accessor function to calculate derived value
      accessorFn: (row) => row.price * row.stock,
      sortable: true,
      cell: (row) => `$${(row.price * row.stock).toFixed(2)}`,
    },
  ]

  return (
    <EnhancedDataTable
      data={products}
      columns={columns}
      getRowId={(row) => row.id}
      emptyMessage="No products found."
    />
  )
}
