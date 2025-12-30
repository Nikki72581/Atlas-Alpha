"use client"

import * as React from "react"
import {
  EnhancedDataTable,
  type ColumnDef,
  type EnhancedDataTableProps,
} from "./enhanced-data-table"
import {
  QuickPreviewPanel,
  useQuickPreview,
  type PreviewSection,
  type PreviewAction,
} from "./quick-preview-panel"
import { Eye } from "lucide-react"
import { Button } from "@/components/ui/button"

// ============================================================================
// Types
// ============================================================================

export type DataTableWithPreviewProps<TData> = EnhancedDataTableProps<TData> & {
  // Preview configuration
  previewTitle: string | ((data: TData) => string)
  previewDescription?: string | ((data: TData) => string)
  previewSections: PreviewSection[] | ((data: TData) => PreviewSection[])
  previewActions?: PreviewAction[] | ((data: TData) => PreviewAction[])
  previewChildren?: React.ReactNode | ((data: TData) => React.ReactNode)
  previewSide?: "left" | "right" | "top" | "bottom"
  previewWidth?: "sm" | "md" | "lg" | "xl" | "2xl"

  // Behavior
  enableRowClickPreview?: boolean // Click row to open preview
  showPreviewButton?: boolean // Show preview icon button in table
  onPreviewOpen?: (data: TData) => void
  onPreviewClose?: () => void
}

// ============================================================================
// DataTable with Integrated Preview
// ============================================================================

export function DataTableWithPreview<TData>({
  // Preview props
  previewTitle,
  previewDescription,
  previewSections,
  previewActions,
  previewChildren,
  previewSide = "right",
  previewWidth = "lg",
  enableRowClickPreview = false,
  showPreviewButton = true,
  onPreviewOpen,
  onPreviewClose,

  // Table props
  columns,
  ...tableProps
}: DataTableWithPreviewProps<TData>) {
  const { isOpen, selectedItem, openPreview, closePreview, setIsOpen } =
    useQuickPreview<TData>()

  // Handle preview open
  const handleOpenPreview = React.useCallback(
    (row: TData) => {
      openPreview(row)
      onPreviewOpen?.(row)
    },
    [openPreview, onPreviewOpen]
  )

  // Handle preview close
  const handleClosePreview = React.useCallback(
    (open: boolean) => {
      setIsOpen(open)
      if (!open) {
        onPreviewClose?.()
      }
    },
    [setIsOpen, onPreviewClose]
  )

  // Add preview button column if enabled
  const enhancedColumns: ColumnDef<TData>[] = React.useMemo(() => {
    if (!showPreviewButton) return columns

    const previewColumn: ColumnDef<TData> = {
      id: "__preview__",
      header: "",
      sortable: false,
      className: "w-12",
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            handleOpenPreview(row)
          }}
          className="h-8 w-8 p-0"
          title="Quick preview"
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    }

    return [previewColumn, ...columns]
  }, [columns, showPreviewButton, handleOpenPreview])

  // Add row click handler if enabled
  const rowClassName = enableRowClickPreview ? "cursor-pointer" : undefined

  return (
    <>
      <div onClick={enableRowClickPreview ? undefined : undefined}>
        <EnhancedDataTable
          {...tableProps}
          columns={enhancedColumns}
        />
      </div>

      <QuickPreviewPanel
        open={isOpen}
        onOpenChange={handleClosePreview}
        data={selectedItem}
        title={previewTitle}
        description={previewDescription}
        sections={previewSections}
        actions={previewActions}
        side={previewSide}
        width={previewWidth}
      >
        {previewChildren}
      </QuickPreviewPanel>
    </>
  )
}

// ============================================================================
// Standalone Preview Button Component
// ============================================================================

export function PreviewButton<TData>({
  row,
  onPreview,
  className,
}: {
  row: TData
  onPreview: (row: TData) => void
  className?: string
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={(e) => {
        e.stopPropagation()
        onPreview(row)
      }}
      className={className}
      title="Quick preview"
    >
      <Eye className="h-4 w-4" />
    </Button>
  )
}
