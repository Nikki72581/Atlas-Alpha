"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { FilterIcon, X, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

// ============================================================================
// Types
// ============================================================================

export type FilterOperator =
  | "equals"
  | "notEquals"
  | "contains"
  | "notContains"
  | "startsWith"
  | "endsWith"
  | "greaterThan"
  | "lessThan"
  | "greaterThanOrEqual"
  | "lessThanOrEqual"
  | "isEmpty"
  | "isNotEmpty"

export type FilterCondition = {
  id: string
  field: string
  operator: FilterOperator
  value: string
}

export type FilterField = {
  id: string
  label: string
  type: "text" | "number" | "date" | "select"
  options?: Array<{ label: string; value: string }>
}

export type AdvancedFiltersProps = {
  fields: FilterField[]
  filters: FilterCondition[]
  onFiltersChange: (filters: FilterCondition[]) => void
  className?: string
}

// ============================================================================
// Operator Labels
// ============================================================================

const OPERATOR_LABELS: Record<FilterOperator, string> = {
  equals: "equals",
  notEquals: "does not equal",
  contains: "contains",
  notContains: "does not contain",
  startsWith: "starts with",
  endsWith: "ends with",
  greaterThan: "greater than",
  lessThan: "less than",
  greaterThanOrEqual: "greater than or equal",
  lessThanOrEqual: "less than or equal",
  isEmpty: "is empty",
  isNotEmpty: "is not empty",
}

const TEXT_OPERATORS: FilterOperator[] = [
  "equals",
  "notEquals",
  "contains",
  "notContains",
  "startsWith",
  "endsWith",
  "isEmpty",
  "isNotEmpty",
]

const NUMBER_OPERATORS: FilterOperator[] = [
  "equals",
  "notEquals",
  "greaterThan",
  "lessThan",
  "greaterThanOrEqual",
  "lessThanOrEqual",
  "isEmpty",
  "isNotEmpty",
]

// ============================================================================
// Advanced Filters Component
// ============================================================================

export function AdvancedFilters({
  fields,
  filters,
  onFiltersChange,
  className,
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const addFilter = () => {
    const newFilter: FilterCondition = {
      id: Math.random().toString(36).substring(7),
      field: fields[0]?.id || "",
      operator: "contains",
      value: "",
    }
    onFiltersChange([...filters, newFilter])
  }

  const removeFilter = (filterId: string) => {
    onFiltersChange(filters.filter((f) => f.id !== filterId))
  }

  const updateFilter = (
    filterId: string,
    updates: Partial<FilterCondition>
  ) => {
    onFiltersChange(
      filters.map((f) => (f.id === filterId ? { ...f, ...updates } : f))
    )
  }

  const clearAll = () => {
    onFiltersChange([])
  }

  const getFieldType = (fieldId: string): FilterField["type"] => {
    return fields.find((f) => f.id === fieldId)?.type || "text"
  }

  const getAvailableOperators = (fieldType: FilterField["type"]): FilterOperator[] => {
    switch (fieldType) {
      case "number":
        return NUMBER_OPERATORS
      case "text":
      case "select":
      default:
        return TEXT_OPERATORS
    }
  }

  const activeFilterCount = filters.length

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={cn("h-9", className)}>
          <FilterIcon className="h-4 w-4 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 px-1.5">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px] p-4" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Advanced Filters</h4>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="h-8 text-xs"
              >
                Clear all
              </Button>
            )}
          </div>

          {filters.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              No filters applied. Click "Add filter" to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {filters.map((filter, index) => {
                const fieldType = getFieldType(filter.field)
                const availableOperators = getAvailableOperators(fieldType)
                const needsValue = !["isEmpty", "isNotEmpty"].includes(
                  filter.operator
                )
                const field = fields.find((f) => f.id === filter.field)

                return (
                  <div
                    key={filter.id}
                    className="flex items-start gap-2 p-3 rounded-lg border bg-muted/30"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <Select
                          value={filter.field}
                          onValueChange={(value) =>
                            updateFilter(filter.id, { field: value })
                          }
                        >
                          <SelectTrigger className="h-8 flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {fields.map((field) => (
                              <SelectItem key={field.id} value={field.id}>
                                {field.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select
                          value={filter.operator}
                          onValueChange={(value) =>
                            updateFilter(filter.id, {
                              operator: value as FilterOperator,
                            })
                          }
                        >
                          <SelectTrigger className="h-8 flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {availableOperators.map((op) => (
                              <SelectItem key={op} value={op}>
                                {OPERATOR_LABELS[op]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {needsValue && (
                        <div>
                          {field?.type === "select" && field.options ? (
                            <Select
                              value={filter.value}
                              onValueChange={(value) =>
                                updateFilter(filter.id, { value })
                              }
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Select value..." />
                              </SelectTrigger>
                              <SelectContent>
                                {field.options.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              type={fieldType === "number" ? "number" : "text"}
                              value={filter.value}
                              onChange={(e) =>
                                updateFilter(filter.id, { value: e.target.value })
                              }
                              placeholder="Enter value..."
                              className="h-8"
                            />
                          )}
                        </div>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFilter(filter.id)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={addFilter}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add filter
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ============================================================================
// Hook for managing filters
// ============================================================================

export function useAdvancedFilters(initialFilters: FilterCondition[] = []) {
  const [filters, setFilters] = React.useState<FilterCondition[]>(initialFilters)

  const applyFilters = React.useCallback(
    <T extends Record<string, any>>(data: T[]): T[] => {
      if (filters.length === 0) return data

      return data.filter((item) => {
        return filters.every((filter) => {
          const value = item[filter.field]
          const filterValue = filter.value

          switch (filter.operator) {
            case "equals":
              return String(value).toLowerCase() === filterValue.toLowerCase()
            case "notEquals":
              return String(value).toLowerCase() !== filterValue.toLowerCase()
            case "contains":
              return String(value).toLowerCase().includes(filterValue.toLowerCase())
            case "notContains":
              return !String(value).toLowerCase().includes(filterValue.toLowerCase())
            case "startsWith":
              return String(value).toLowerCase().startsWith(filterValue.toLowerCase())
            case "endsWith":
              return String(value).toLowerCase().endsWith(filterValue.toLowerCase())
            case "greaterThan":
              return Number(value) > Number(filterValue)
            case "lessThan":
              return Number(value) < Number(filterValue)
            case "greaterThanOrEqual":
              return Number(value) >= Number(filterValue)
            case "lessThanOrEqual":
              return Number(value) <= Number(filterValue)
            case "isEmpty":
              return value == null || value === ""
            case "isNotEmpty":
              return value != null && value !== ""
            default:
              return true
          }
        })
      })
    },
    [filters]
  )

  const clearFilters = React.useCallback(() => {
    setFilters([])
  }, [])

  return {
    filters,
    setFilters,
    applyFilters,
    clearFilters,
    hasFilters: filters.length > 0,
  }
}
