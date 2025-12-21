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
import { DimensionDefinition, DimensionValue } from "@prisma/client"

type DimensionWithValues = DimensionDefinition & {
  values: DimensionValue[]
}

type DimensionInputProps = {
  availableDimensions: DimensionWithValues[]
  dimensions: Record<string, string>
  onChange: (dimensions: Record<string, string>) => void
}

export function DimensionInput({ availableDimensions, dimensions, onChange }: DimensionInputProps) {
  const [isOpen, setIsOpen] = useState(false)

  const addDimension = (dim: DimensionWithValues, value: string) => {
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
              {availableDimensions.filter(d => d.isActive).map((dim) => {
                const hasValue = !!dimensions[dim.code]

                return (
                  <div key={dim.code} className="space-y-1">
                    <Label className="text-xs">
                      {dim.name} {dim.isRequired && <span className="text-destructive">*</span>}
                    </Label>
                    {dim.values.length > 0 ? (
                      <Select
                        value={dimensions[dim.code] || ""}
                        onValueChange={(value) => updateDimension(dim.code, value)}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder={`Select ${dim.name.toLowerCase()}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {dim.values.filter(v => v.isActive).map((value) => (
                            <SelectItem key={value.code} value={value.code}>
                              {value.name}
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
