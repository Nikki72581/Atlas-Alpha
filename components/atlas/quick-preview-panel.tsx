"use client"

import * as React from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

// ============================================================================
// Types
// ============================================================================

export type PreviewField = {
  label: string
  value: React.ReactNode
  className?: string
  fullWidth?: boolean
}

export type PreviewSection = {
  title?: string
  fields: PreviewField[]
  className?: string
}

export type PreviewAction = {
  label: string
  icon?: React.ReactNode
  onClick: () => void | Promise<void>
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost"
  disabled?: boolean
}

export type QuickPreviewPanelProps<TData = any> = {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: TData | null
  title: string | ((data: TData) => string)
  description?: string | ((data: TData) => string)
  sections: PreviewSection[] | ((data: TData) => PreviewSection[])
  actions?: PreviewAction[] | ((data: TData) => PreviewAction[])
  children?: React.ReactNode | ((data: TData) => React.ReactNode)
  side?: "left" | "right" | "top" | "bottom"
  className?: string
  width?: "sm" | "md" | "lg" | "xl" | "2xl"
}

// ============================================================================
// Quick Preview Panel Component
// ============================================================================

export function QuickPreviewPanel<TData = any>({
  open,
  onOpenChange,
  data,
  title,
  description,
  sections,
  actions,
  children,
  side = "right",
  className,
  width = "lg",
}: QuickPreviewPanelProps<TData>) {
  if (!data) return null

  const resolvedTitle = typeof title === "function" ? title(data) : title
  const resolvedDescription =
    typeof description === "function" ? description(data) : description
  const resolvedSections = typeof sections === "function" ? sections(data) : sections
  const resolvedActions = typeof actions === "function" ? actions(data) : actions
  const resolvedChildren = typeof children === "function" ? children(data) : children

  const widthClasses = {
    sm: "sm:max-w-sm",
    md: "sm:max-w-md",
    lg: "sm:max-w-lg",
    xl: "sm:max-w-xl",
    "2xl": "sm:max-w-2xl",
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        className={cn(
          "flex flex-col overflow-hidden",
          widthClasses[width],
          className
        )}
      >
        <SheetHeader>
          <SheetTitle>{resolvedTitle}</SheetTitle>
          {resolvedDescription && (
            <SheetDescription>{resolvedDescription}</SheetDescription>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto -mx-6 px-6 py-4">
          {resolvedChildren ? (
            resolvedChildren
          ) : (
            <div className="space-y-6">
              {resolvedSections.map((section, sectionIndex) => (
                <PreviewSectionComponent
                  key={sectionIndex}
                  section={section}
                />
              ))}
            </div>
          )}
        </div>

        {resolvedActions && resolvedActions.length > 0 && (
          <SheetFooter className="border-t pt-4">
            <div className="flex gap-2 w-full justify-end">
              {resolvedActions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || "outline"}
                  onClick={action.onClick}
                  disabled={action.disabled}
                >
                  {action.icon}
                  {action.label}
                </Button>
              ))}
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}

// ============================================================================
// Preview Section Component
// ============================================================================

function PreviewSectionComponent({ section }: { section: PreviewSection }) {
  return (
    <div className={cn("space-y-3", section.className)}>
      {section.title && (
        <h3 className="text-sm font-semibold text-foreground border-b pb-2">
          {section.title}
        </h3>
      )}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        {section.fields.map((field, fieldIndex) => (
          <div
            key={fieldIndex}
            className={cn(
              field.fullWidth ? "col-span-2" : "col-span-1",
              field.className
            )}
          >
            <dt className="text-xs font-medium text-muted-foreground mb-1">
              {field.label}
            </dt>
            <dd className="text-sm text-foreground">{field.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

// ============================================================================
// Hook for managing preview state
// ============================================================================

export function useQuickPreview<TData = any>() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedItem, setSelectedItem] = React.useState<TData | null>(null)

  const openPreview = React.useCallback((item: TData) => {
    setSelectedItem(item)
    setIsOpen(true)
  }, [])

  const closePreview = React.useCallback(() => {
    setIsOpen(false)
    // Delay clearing the selected item to allow exit animation
    setTimeout(() => setSelectedItem(null), 200)
  }, [])

  const togglePreview = React.useCallback((item: TData) => {
    setSelectedItem((current) => {
      if (current === item) {
        setIsOpen(false)
        return null
      }
      setIsOpen(true)
      return item
    })
  }, [])

  return {
    isOpen,
    selectedItem,
    openPreview,
    closePreview,
    togglePreview,
    setIsOpen,
  }
}

// ============================================================================
// Utility Components
// ============================================================================

export function PreviewFieldValue({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <span className={cn("font-medium", className)}>{children}</span>
}

export function PreviewBadge({
  children,
  variant = "default",
}: {
  children: React.ReactNode
  variant?: "default" | "success" | "warning" | "error" | "info"
}) {
  const variantClasses = {
    default: "bg-muted text-muted-foreground",
    success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    warning: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    error: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium",
        variantClasses[variant]
      )}
    >
      {children}
    </span>
  )
}

// ============================================================================
// Helper function to build sections easily
// ============================================================================

export function createPreviewSection(
  title: string | undefined,
  fields: Array<{
    label: string
    value: React.ReactNode
    fullWidth?: boolean
    className?: string
  }>
): PreviewSection {
  return {
    title,
    fields,
  }
}
