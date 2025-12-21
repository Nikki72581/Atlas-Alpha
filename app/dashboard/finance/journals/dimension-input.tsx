"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tags, X } from "lucide-react"
import {
  DEFAULT_DIMENSIONS,
  getAvailableDimensions,
  isDimensionRequired,
  getSampleDimensionValues,
  type DimensionDefinition,
} from "@/lib/dimensions"
import { AccountType } from "@prisma/client"

type DimensionInputProps = {
  accountType: AccountType | null
  dimensions: Record<string, string>
  onChange: (dimensions: Record<string, string>) => void
}

export function DimensionInput({ accountType, dimensions, onChange }: DimensionInputProps) {
  const [isOpen, setIsOpen] = useState(false)

  const availableDimensions = accountType
    ? getAvailableDimensions(accountType)
    : DEFAULT_DIMENSIONS

  const addDimension = (dim: DimensionDefinition, value: string) => {
    if (value.trim()) {
      onChange({ ...dimensions, [dim.code]: value.trim() })
    }
  }

  const removeDimension = (code: string) => {
    const newDimensions = { ...dimensions }
    delete newDimensions[code]
    onChange(newDimensions)
  }

  const updateDimension = (code: string, value: string) => {
    onChange({ ...dimensions, [code]: value })
  }

  const dimensionCount = Object.keys(dimensions).length

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs">Dimensions (optional)</Label>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" type="button">
              <Tags className="h-3 w-3 mr-1" />
              Add Dimension
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Add Dimension</h4>
              {availableDimensions.map((dim) => {
                const isRequired = accountType ? isDimensionRequired(dim.code, accountType) : false
                const hasValue = !!dimensions[dim.code]
                const sampleValues = getSampleDimensionValues(dim.type)

                return (
                  <div key={dim.code} className="space-y-1">
                    <Label className="text-xs">
                      {dim.name} {isRequired && <span className="text-destructive">*</span>}
                    </Label>
                    {sampleValues.length > 0 ? (
                      <Select
                        value={dimensions[dim.code] || ""}
                        onValueChange={(value) => updateDimension(dim.code, value)}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder={`Select ${dim.name.toLowerCase()}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {sampleValues.map((value) => (
                            <SelectItem key={value} value={value}>
                              {value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        className="h-8"
                        placeholder={`Enter ${dim.name.toLowerCase()}`}
                        value={dimensions[dim.code] || ""}
                        onChange={(e) => updateDimension(dim.code, e.target.value)}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {dimensionCount > 0 && (
        <div className="flex flex-wrap gap-1">
          {Object.entries(dimensions).map(([code, value]) => {
            const dim = availableDimensions.find((d) => d.code === code)
            return (
              <Badge key={code} variant="secondary" className="text-xs">
                {dim?.name || code}: {value}
                <button
                  type="button"
                  onClick={() => removeDimension(code)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}
