"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"

// ============================================================================
// Types
// ============================================================================

export type SortDirection = "asc" | "desc" | null

export type ColumnDef<TData> = {
  id: string
  header: string | React.ReactNode
  accessorKey?: keyof TData
  accessorFn?: (row: TData) => any
  cell?: (row: TData) => React.ReactNode
  sortable?: boolean
  className?: string
  headerClassName?: string
}

export type EnhancedDataTableProps<TData> = {
  data: TData[]
  columns: ColumnDef<TData>[]
  getRowId: (row: TData) => string
  onSelectionChange?: (selectedIds: string[]) => void
  enableSelection?: boolean
  enableSorting?: boolean
  className?: string
  emptyMessage?: string
  stickyHeader?: boolean
}

// ============================================================================
// Enhanced DataTable Component
// ============================================================================

export function EnhancedDataTable<TData>({
  data,
  columns,
  getRowId,
  onSelectionChange,
  enableSelection = true,
  enableSorting = true,
  className,
  emptyMessage = "No data available.",
  stickyHeader = false,
}: EnhancedDataTableProps<TData>) {
  const [selectedRows, setSelectedRows] = React.useState<Set<string>>(new Set())
  const [sortColumn, setSortColumn] = React.useState<string | null>(null)
  const [sortDirection, setSortDirection] = React.useState<SortDirection>(null)

  // Get all row IDs
  const allRowIds = React.useMemo(() => data.map(getRowId), [data, getRowId])

  // Check if all rows are selected
  const allSelected = allRowIds.length > 0 && allRowIds.every((id) => selectedRows.has(id))
  const someSelected = allRowIds.some((id) => selectedRows.has(id)) && !allSelected

  // Handle select all
  const handleSelectAll = React.useCallback(() => {
    if (allSelected) {
      setSelectedRows(new Set())
      onSelectionChange?.([])
    } else {
      const newSelection = new Set(allRowIds)
      setSelectedRows(newSelection)
      onSelectionChange?.(Array.from(newSelection))
    }
  }, [allSelected, allRowIds, onSelectionChange])

  // Handle individual row selection
  const handleRowSelect = React.useCallback(
    (rowId: string) => {
      setSelectedRows((prev) => {
        const newSelection = new Set(prev)
        if (newSelection.has(rowId)) {
          newSelection.delete(rowId)
        } else {
          newSelection.add(rowId)
        }
        onSelectionChange?.(Array.from(newSelection))
        return newSelection
      })
    },
    [onSelectionChange]
  )

  // Handle column sorting
  const handleSort = React.useCallback(
    (columnId: string) => {
      if (sortColumn === columnId) {
        // Cycle through: asc -> desc -> null
        if (sortDirection === "asc") {
          setSortDirection("desc")
        } else if (sortDirection === "desc") {
          setSortDirection(null)
          setSortColumn(null)
        }
      } else {
        setSortColumn(columnId)
        setSortDirection("asc")
      }
    },
    [sortColumn, sortDirection]
  )

  // Sort data
  const sortedData = React.useMemo(() => {
    if (!sortColumn || !sortDirection) return data

    const column = columns.find((col) => col.id === sortColumn)
    if (!column) return data

    return [...data].sort((a, b) => {
      let aValue: any
      let bValue: any

      if (column.accessorFn) {
        aValue = column.accessorFn(a)
        bValue = column.accessorFn(b)
      } else if (column.accessorKey) {
        aValue = a[column.accessorKey]
        bValue = b[column.accessorKey]
      } else {
        return 0
      }

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0
      if (aValue == null) return sortDirection === "asc" ? 1 : -1
      if (bValue == null) return sortDirection === "asc" ? -1 : 1

      // String comparison
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }

      // Numeric comparison
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue
      }

      // Boolean comparison
      if (typeof aValue === "boolean" && typeof bValue === "boolean") {
        return sortDirection === "asc"
          ? Number(aValue) - Number(bValue)
          : Number(bValue) - Number(aValue)
      }

      // Default: convert to string and compare
      return sortDirection === "asc"
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue))
    })
  }, [data, sortColumn, sortDirection, columns])

  // Get cell value
  const getCellValue = (row: TData, column: ColumnDef<TData>) => {
    if (column.cell) {
      return column.cell(row)
    }
    if (column.accessorFn) {
      return column.accessorFn(row)
    }
    if (column.accessorKey) {
      return row[column.accessorKey] as React.ReactNode
    }
    return null
  }

  // Render sort icon
  const renderSortIcon = (columnId: string) => {
    if (sortColumn !== columnId) {
      return <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
    }
    if (sortDirection === "asc") {
      return <ArrowUp className="h-3.5 w-3.5" />
    }
    return <ArrowDown className="h-3.5 w-3.5" />
  }

  return (
    <div className={cn("overflow-x-auto rounded-xl border", className)}>
      <table className="w-full text-sm">
        <thead className={cn(stickyHeader && "sticky top-0 z-10 bg-background")}>
          <tr>
            {enableSelection && (
              <th className="h-10 px-3 text-left font-medium text-muted-foreground border-b bg-muted/30 w-12">
                <Checkbox
                  checked={allSelected}
                  ref={(el) => {
                    if (el) {
                      el.indeterminate = someSelected
                    }
                  }}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all rows"
                />
              </th>
            )}
            {columns.map((column) => {
              const isSortable = enableSorting && column.sortable !== false
              return (
                <th
                  key={column.id}
                  className={cn(
                    "h-10 px-3 text-left font-medium text-muted-foreground border-b bg-muted/30",
                    column.headerClassName
                  )}
                >
                  {isSortable ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort(column.id)}
                      className="h-8 -ml-3 px-3 hover:bg-muted/50 font-medium text-muted-foreground hover:text-foreground"
                    >
                      {column.header}
                      {renderSortIcon(column.id)}
                    </Button>
                  ) : (
                    column.header
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {sortedData.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (enableSelection ? 1 : 0)}
                className="px-3 py-8 text-center text-muted-foreground border-b"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sortedData.map((row) => {
              const rowId = getRowId(row)
              const isSelected = selectedRows.has(rowId)

              return (
                <tr
                  key={rowId}
                  className={cn(
                    "hover:bg-muted/20 transition-colors",
                    isSelected && "bg-muted/30"
                  )}
                >
                  {enableSelection && (
                    <td className="px-3 py-2 border-b align-top">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleRowSelect(rowId)}
                        aria-label={`Select row ${rowId}`}
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={column.id}
                      className={cn("px-3 py-2 border-b align-top", column.className)}
                    >
                      {getCellValue(row, column)}
                    </td>
                  ))}
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}

// ============================================================================
// Bulk Action Bar Component
// ============================================================================

export type BulkAction = {
  label: string
  icon?: React.ReactNode
  onClick: (selectedIds: string[]) => void | Promise<void>
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost"
  disabled?: boolean
}

export type BulkActionBarProps = {
  selectedCount: number
  totalCount: number
  actions: BulkAction[]
  onClearSelection: () => void
  className?: string
}

export function BulkActionBar({
  selectedCount,
  totalCount,
  actions,
  onClearSelection,
  className,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 rounded-xl border bg-muted/50 px-4 py-3 mb-4",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          {selectedCount} of {totalCount} selected
        </span>
        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          Clear selection
        </Button>
      </div>
      <div className="flex items-center gap-2">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant || "outline"}
            size="sm"
            onClick={() => action.onClick([])}
            disabled={action.disabled}
          >
            {action.icon}
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// Hook for managing selection state
// ============================================================================

export function useTableSelection() {
  const [selectedIds, setSelectedIds] = React.useState<string[]>([])

  const clearSelection = React.useCallback(() => {
    setSelectedIds([])
  }, [])

  const selectAll = React.useCallback((ids: string[]) => {
    setSelectedIds(ids)
  }, [])

  const toggleSelection = React.useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }, [])

  return {
    selectedIds,
    setSelectedIds,
    clearSelection,
    selectAll,
    toggleSelection,
    selectedCount: selectedIds.length,
  }
}
