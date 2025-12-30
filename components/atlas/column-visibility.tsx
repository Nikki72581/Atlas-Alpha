"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Columns3 } from "lucide-react"
import { cn } from "@/lib/utils"

// ============================================================================
// Types
// ============================================================================

export type ColumnVisibilityState = Record<string, boolean>

export type ColumnVisibilityProps = {
  columns: Array<{
    id: string
    label: string
    canToggle?: boolean
  }>
  visibility: ColumnVisibilityState
  onVisibilityChange: (visibility: ColumnVisibilityState) => void
  className?: string
}

// ============================================================================
// Column Visibility Control Component
// ============================================================================

export function ColumnVisibility({
  columns,
  visibility,
  onVisibilityChange,
  className,
}: ColumnVisibilityProps) {
  const toggleableColumns = columns.filter((col) => col.canToggle !== false)
  const visibleCount = toggleableColumns.filter((col) => visibility[col.id] !== false).length

  const handleToggle = (columnId: string) => {
    onVisibilityChange({
      ...visibility,
      [columnId]: !(visibility[columnId] ?? true),
    })
  }

  const handleShowAll = () => {
    const newVisibility = { ...visibility }
    toggleableColumns.forEach((col) => {
      newVisibility[col.id] = true
    })
    onVisibilityChange(newVisibility)
  }

  const handleHideAll = () => {
    const newVisibility = { ...visibility }
    toggleableColumns.forEach((col) => {
      newVisibility[col.id] = false
    })
    onVisibilityChange(newVisibility)
  }

  const handleReset = () => {
    onVisibilityChange({})
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={cn("h-9", className)}>
          <Columns3 className="h-4 w-4 mr-2" />
          Columns
          {visibleCount < toggleableColumns.length && (
            <span className="ml-2 rounded-md bg-primary/10 px-2 py-0.5 text-xs">
              {visibleCount}/{toggleableColumns.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="p-2 space-y-1">
          {toggleableColumns.map((column) => {
            const isVisible = visibility[column.id] ?? true
            return (
              <div
                key={column.id}
                className="flex items-center space-x-2 rounded-sm px-2 py-1.5 hover:bg-accent cursor-pointer"
                onClick={() => handleToggle(column.id)}
              >
                <Checkbox
                  checked={isVisible}
                  onCheckedChange={() => handleToggle(column.id)}
                  aria-label={`Toggle ${column.label} column`}
                />
                <label className="text-sm cursor-pointer flex-1">
                  {column.label}
                </label>
              </div>
            )
          })}
        </div>

        <DropdownMenuSeparator />

        <div className="p-2 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleShowAll}
            className="flex-1 h-8"
          >
            Show all
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleHideAll}
            className="flex-1 h-8"
          >
            Hide all
          </Button>
        </div>

        <div className="p-2 pt-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="w-full h-8"
          >
            Reset
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ============================================================================
// Hook for managing column visibility
// ============================================================================

export function useColumnVisibility(defaultVisibility: ColumnVisibilityState = {}) {
  const [visibility, setVisibility] = React.useState<ColumnVisibilityState>(defaultVisibility)

  const isColumnVisible = React.useCallback(
    (columnId: string) => {
      return visibility[columnId] ?? true
    },
    [visibility]
  )

  const getVisibleColumns = React.useCallback(
    <T extends { id: string }>(columns: T[]): T[] => {
      return columns.filter((col) => isColumnVisible(col.id))
    },
    [isColumnVisible]
  )

  const reset = React.useCallback(() => {
    setVisibility({})
  }, [])

  return {
    visibility,
    setVisibility,
    isColumnVisible,
    getVisibleColumns,
    reset,
  }
}
