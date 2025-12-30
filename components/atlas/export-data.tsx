"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download, FileSpreadsheet, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

// ============================================================================
// Types
// ============================================================================

export type ExportColumn<T> = {
  id: string
  header: string
  accessorKey?: keyof T
  accessorFn?: (row: T) => any
  formatter?: (value: any) => string
}

export type ExportDataProps<T> = {
  data: T[]
  columns: ExportColumn<T>[]
  filename?: string
  selectedIds?: string[]
  getRowId?: (row: T) => string
  className?: string
}

// ============================================================================
// Export Functions
// ============================================================================

function exportToCSV<T>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string = "export.csv"
) {
  // Build CSV header
  const headers = columns.map((col) => escapeCSV(col.header))
  const csvRows = [headers.join(",")]

  // Build CSV rows
  data.forEach((row) => {
    const values = columns.map((col) => {
      let value: any

      if (col.accessorFn) {
        value = col.accessorFn(row)
      } else if (col.accessorKey) {
        value = row[col.accessorKey]
      } else {
        value = ""
      }

      // Apply formatter if provided
      if (col.formatter) {
        value = col.formatter(value)
      }

      // Handle different value types
      if (value == null) {
        return ""
      }
      if (typeof value === "boolean") {
        return value ? "Yes" : "No"
      }
      if (value instanceof Date) {
        return value.toLocaleDateString()
      }

      return escapeCSV(String(value))
    })

    csvRows.push(values.join(","))
  })

  // Create and download file
  const csvContent = csvRows.join("\n")
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  downloadBlob(blob, filename)
}

function exportToJSON<T>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string = "export.json"
) {
  // Build JSON objects
  const jsonData = data.map((row) => {
    const obj: Record<string, any> = {}

    columns.forEach((col) => {
      let value: any

      if (col.accessorFn) {
        value = col.accessorFn(row)
      } else if (col.accessorKey) {
        value = row[col.accessorKey]
      } else {
        value = null
      }

      // Apply formatter if provided
      if (col.formatter && value != null) {
        value = col.formatter(value)
      }

      obj[col.id] = value
    })

    return obj
  })

  // Create and download file
  const jsonContent = JSON.stringify(jsonData, null, 2)
  const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" })
  downloadBlob(blob, filename)
}

function escapeCSV(value: string): string {
  // Escape double quotes and wrap in quotes if needed
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ============================================================================
// Export Data Component
// ============================================================================

export function ExportData<T>({
  data,
  columns,
  filename = "export",
  selectedIds = [],
  getRowId,
  className,
}: ExportDataProps<T>) {
  const hasSelection = selectedIds.length > 0

  const getExportData = (exportSelected: boolean): T[] => {
    if (!exportSelected || !hasSelection || !getRowId) {
      return data
    }
    return data.filter((row) => selectedIds.includes(getRowId(row)))
  }

  const handleExportCSV = (exportSelected: boolean) => {
    const exportData = getExportData(exportSelected)
    const baseFilename = filename.replace(/\.[^/.]+$/, "")
    const csvFilename = `${baseFilename}${exportSelected ? "-selected" : ""}.csv`
    exportToCSV(exportData, columns, csvFilename)
  }

  const handleExportJSON = (exportSelected: boolean) => {
    const exportData = getExportData(exportSelected)
    const baseFilename = filename.replace(/\.[^/.]+$/, "")
    const jsonFilename = `${baseFilename}${exportSelected ? "-selected" : ""}.json`
    exportToJSON(exportData, columns, jsonFilename)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={cn("h-9", className)}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Export format</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => handleExportCSV(false)}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export all as CSV
          <span className="ml-auto text-xs text-muted-foreground">
            {data.length} rows
          </span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleExportJSON(false)}>
          <FileText className="h-4 w-4 mr-2" />
          Export all as JSON
          <span className="ml-auto text-xs text-muted-foreground">
            {data.length} rows
          </span>
        </DropdownMenuItem>

        {hasSelection && getRowId && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Selected only
            </DropdownMenuLabel>

            <DropdownMenuItem onClick={() => handleExportCSV(true)}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export selected as CSV
              <span className="ml-auto text-xs text-muted-foreground">
                {selectedIds.length} rows
              </span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => handleExportJSON(true)}>
              <FileText className="h-4 w-4 mr-2" />
              Export selected as JSON
              <span className="ml-auto text-xs text-muted-foreground">
                {selectedIds.length} rows
              </span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ============================================================================
// Simple export function for programmatic use
// ============================================================================

export function exportData<T>(
  data: T[],
  columns: ExportColumn<T>[],
  format: "csv" | "json" = "csv",
  filename: string = "export"
) {
  const baseFilename = filename.replace(/\.[^/.]+$/, "")

  if (format === "csv") {
    exportToCSV(data, columns, `${baseFilename}.csv`)
  } else {
    exportToJSON(data, columns, `${baseFilename}.json`)
  }
}
