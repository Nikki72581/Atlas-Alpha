"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, AlertCircle } from "lucide-react"
import type { ColumnMapping } from "@/lib/csv-parser"

type ColumnMapperProps = {
  headers: string[]
  mapping: Partial<ColumnMapping>
  onMappingChange: (mapping: Partial<ColumnMapping>) => void
  sampleRows?: Record<string, string>[]
}

export function ColumnMapper({
  headers,
  mapping,
  onMappingChange,
  sampleRows = [],
}: ColumnMapperProps) {
  const useSeparateAmounts = !mapping.amount && (mapping.debit || mapping.credit)

  function updateMapping(field: keyof ColumnMapping, value: string | undefined) {
    const newMapping = { ...mapping }

    if (field === "amount" && value) {
      // Clear debit/credit if using single amount
      delete newMapping.debit
      delete newMapping.credit
      newMapping.amount = value
    } else if ((field === "debit" || field === "credit") && value) {
      // Clear amount if using separate columns
      delete newMapping.amount
      newMapping[field] = value
    } else if (value) {
      newMapping[field] = value
    } else {
      delete newMapping[field]
    }

    onMappingChange(newMapping)
  }

  function getSampleValue(column?: string): string {
    if (!column || sampleRows.length === 0) return ""
    return sampleRows[0][column] || ""
  }

  const isComplete =
    mapping.date &&
    mapping.description &&
    (mapping.amount || (mapping.debit && mapping.credit))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Map CSV Columns</h4>
        {isComplete ? (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Mapping Complete
          </Badge>
        ) : (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            Required Fields Missing
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Date Column */}
        <div className="space-y-2">
          <Label htmlFor="date-column">
            Date Column <span className="text-destructive">*</span>
          </Label>
          <Select
            value={mapping.date || ""}
            onValueChange={(v) => updateMapping("date", v || undefined)}
          >
            <SelectTrigger id="date-column">
              <SelectValue placeholder="Select date column" />
            </SelectTrigger>
            <SelectContent>
              {headers.map((header) => (
                <SelectItem key={header} value={header}>
                  {header}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {mapping.date && (
            <p className="text-xs text-muted-foreground">
              Sample: {getSampleValue(mapping.date)}
            </p>
          )}
        </div>

        {/* Description Column */}
        <div className="space-y-2">
          <Label htmlFor="desc-column">
            Description Column <span className="text-destructive">*</span>
          </Label>
          <Select
            value={mapping.description || ""}
            onValueChange={(v) => updateMapping("description", v || undefined)}
          >
            <SelectTrigger id="desc-column">
              <SelectValue placeholder="Select description column" />
            </SelectTrigger>
            <SelectContent>
              {headers.map((header) => (
                <SelectItem key={header} value={header}>
                  {header}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {mapping.description && (
            <p className="text-xs text-muted-foreground truncate">
              Sample: {getSampleValue(mapping.description)}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">Amount Columns</span>
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              className={`px-2 py-1 rounded ${!useSeparateAmounts ? "bg-primary text-primary-foreground" : "bg-muted"}`}
              onClick={() => {
                if (useSeparateAmounts) {
                  const newMapping = { ...mapping }
                  delete newMapping.debit
                  delete newMapping.credit
                  onMappingChange(newMapping)
                }
              }}
            >
              Single Amount
            </button>
            <button
              type="button"
              className={`px-2 py-1 rounded ${useSeparateAmounts ? "bg-primary text-primary-foreground" : "bg-muted"}`}
              onClick={() => {
                if (!useSeparateAmounts) {
                  const newMapping = { ...mapping }
                  delete newMapping.amount
                  onMappingChange(newMapping)
                }
              }}
            >
              Debit/Credit
            </button>
          </div>
        </div>

        {useSeparateAmounts ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="debit-column">
                Debit Column <span className="text-destructive">*</span>
              </Label>
              <Select
                value={mapping.debit || ""}
                onValueChange={(v) => updateMapping("debit", v || undefined)}
              >
                <SelectTrigger id="debit-column">
                  <SelectValue placeholder="Select debit column" />
                </SelectTrigger>
                <SelectContent>
                  {headers.map((header) => (
                    <SelectItem key={header} value={header}>
                      {header}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {mapping.debit && (
                <p className="text-xs text-muted-foreground">
                  Sample: {getSampleValue(mapping.debit)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="credit-column">
                Credit Column <span className="text-destructive">*</span>
              </Label>
              <Select
                value={mapping.credit || ""}
                onValueChange={(v) => updateMapping("credit", v || undefined)}
              >
                <SelectTrigger id="credit-column">
                  <SelectValue placeholder="Select credit column" />
                </SelectTrigger>
                <SelectContent>
                  {headers.map((header) => (
                    <SelectItem key={header} value={header}>
                      {header}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {mapping.credit && (
                <p className="text-xs text-muted-foreground">
                  Sample: {getSampleValue(mapping.credit)}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="amount-column">
              Amount Column <span className="text-destructive">*</span>
            </Label>
            <Select
              value={mapping.amount || ""}
              onValueChange={(v) => updateMapping("amount", v || undefined)}
            >
              <SelectTrigger id="amount-column" className="w-full max-w-xs">
                <SelectValue placeholder="Select amount column" />
              </SelectTrigger>
              <SelectContent>
                {headers.map((header) => (
                  <SelectItem key={header} value={header}>
                    {header}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {mapping.amount && (
              <p className="text-xs text-muted-foreground">
                Sample: {getSampleValue(mapping.amount)}
                <br />
                <span className="text-muted-foreground/70">
                  Negative values = debits, Positive = credits
                </span>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
