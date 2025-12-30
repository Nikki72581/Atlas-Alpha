"use client"

/**
 * ADVANCED FEATURES - USAGE EXAMPLE
 *
 * This file demonstrates how to use column visibility, advanced filters,
 * and export functionality together with the EnhancedDataTable.
 */

import { useState } from "react"
import {
  EnhancedDataTable,
  BulkActionBar,
  useTableSelection,
  type ColumnDef,
} from "./enhanced-data-table"
import {
  ColumnVisibility,
  useColumnVisibility,
} from "./column-visibility"
import {
  AdvancedFilters,
  useAdvancedFilters,
  type FilterField,
} from "./advanced-filters"
import {
  ExportData,
  type ExportColumn,
} from "./export-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// ============================================================================
// Example Data Type
// ============================================================================

type Customer = {
  id: string
  number: string
  name: string
  email: string
  phone: string
  status: "active" | "inactive"
  termsNetDays: number
  totalOrders: number
  totalRevenue: number
}

// ============================================================================
// Example Component
// ============================================================================

export function AdvancedFeaturesExample() {
  const customers: Customer[] = [
    {
      id: "1",
      number: "C-001",
      name: "Acme Corp",
      email: "contact@acme.com",
      phone: "+1-555-0001",
      status: "active",
      termsNetDays: 30,
      totalOrders: 45,
      totalRevenue: 125000,
    },
    {
      id: "2",
      number: "C-002",
      name: "Global Industries",
      email: "info@global.com",
      phone: "+1-555-0002",
      status: "active",
      termsNetDays: 60,
      totalOrders: 32,
      totalRevenue: 89000,
    },
    {
      id: "3",
      number: "C-003",
      name: "Tech Solutions",
      email: "hello@tech.com",
      phone: "+1-555-0003",
      status: "inactive",
      termsNetDays: 30,
      totalOrders: 12,
      totalRevenue: 34000,
    },
  ]

  // Selection state
  const { selectedIds, setSelectedIds, clearSelection, selectedCount } =
    useTableSelection()

  // Column visibility state
  const { visibility, setVisibility, getVisibleColumns } = useColumnVisibility()

  // Advanced filters state
  const { filters, setFilters, applyFilters } = useAdvancedFilters()

  // Define columns
  const allColumns: ColumnDef<Customer>[] = [
    {
      id: "number",
      header: "Number",
      accessorKey: "number",
      sortable: true,
      className: "font-mono text-xs",
    },
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
      id: "phone",
      header: "Phone",
      accessorKey: "phone",
      sortable: true,
      className: "text-muted-foreground",
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
    {
      id: "termsNetDays",
      header: "Terms",
      accessorKey: "termsNetDays",
      sortable: true,
      cell: (row) => `Net ${row.termsNetDays}`,
    },
    {
      id: "totalOrders",
      header: "Orders",
      accessorKey: "totalOrders",
      sortable: true,
    },
    {
      id: "totalRevenue",
      header: "Revenue",
      accessorKey: "totalRevenue",
      sortable: true,
      cell: (row) => `$${row.totalRevenue.toLocaleString()}`,
    },
  ]

  // Get visible columns
  const visibleColumns = getVisibleColumns(allColumns)

  // Define filter fields
  const filterFields: FilterField[] = [
    { id: "name", label: "Name", type: "text" },
    { id: "email", label: "Email", type: "text" },
    { id: "number", label: "Number", type: "text" },
    {
      id: "status",
      label: "Status",
      type: "select",
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
      ],
    },
    { id: "termsNetDays", label: "Payment Terms", type: "number" },
    { id: "totalOrders", label: "Total Orders", type: "number" },
    { id: "totalRevenue", label: "Total Revenue", type: "number" },
  ]

  // Define export columns
  const exportColumns: ExportColumn<Customer>[] = [
    { id: "number", header: "Customer Number", accessorKey: "number" },
    { id: "name", header: "Customer Name", accessorKey: "name" },
    { id: "email", header: "Email", accessorKey: "email" },
    { id: "phone", header: "Phone", accessorKey: "phone" },
    {
      id: "status",
      header: "Status",
      accessorKey: "status",
      formatter: (val) => (val === "active" ? "Active" : "Inactive"),
    },
    {
      id: "termsNetDays",
      header: "Payment Terms",
      accessorKey: "termsNetDays",
      formatter: (val) => `Net ${val} days`,
    },
    { id: "totalOrders", header: "Total Orders", accessorKey: "totalOrders" },
    {
      id: "totalRevenue",
      header: "Total Revenue",
      accessorKey: "totalRevenue",
      formatter: (val) => `$${val.toLocaleString()}`,
    },
  ]

  // Column visibility config
  const columnVisibilityConfig = allColumns.map((col) => ({
    id: col.id,
    label: String(col.header),
    canToggle: !["number", "name"].includes(col.id), // Make number and name always visible
  }))

  // Apply filters to data
  const filteredData = applyFilters(customers)

  return (
    <div className="space-y-4">
      {/* Toolbar with advanced features */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ColumnVisibility
            columns={columnVisibilityConfig}
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
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">
            Customers
            {filteredData.length !== customers.length && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({filteredData.length} of {customers.length})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BulkActionBar
            selectedCount={selectedCount}
            totalCount={filteredData.length}
            actions={[]}
            onClearSelection={clearSelection}
          />
          <EnhancedDataTable
            data={filteredData}
            columns={visibleColumns}
            getRowId={(row) => row.id}
            onSelectionChange={setSelectedIds}
            enableSelection={true}
            enableSorting={true}
            emptyMessage="No customers match your filters."
          />
        </CardContent>
      </Card>
    </div>
  )
}
