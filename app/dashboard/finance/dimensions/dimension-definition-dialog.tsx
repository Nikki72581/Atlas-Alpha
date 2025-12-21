"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createDimensionDefinition, updateDimensionDefinition } from "./actions"
import { DimensionDefinition, DimensionType } from "@prisma/client"

type DimensionDefinitionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  dimension?: DimensionDefinition
}

export function DimensionDefinitionDialog({ open, onOpenChange, dimension }: DimensionDefinitionDialogProps) {
  const isEditing = !!dimension
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [type, setType] = useState<DimensionType>("CUSTOM")
  const [isRequired, setIsRequired] = useState(false)
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    if (open) {
      if (dimension) {
        setCode(dimension.code)
        setName(dimension.name)
        setType(dimension.type)
        setIsRequired(dimension.isRequired)
        setIsActive(dimension.isActive)
      } else {
        setCode("")
        setName("")
        setType("CUSTOM")
        setIsRequired(false)
        setIsActive(true)
      }
      setError(null)
    }
  }, [open, dimension])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const data = {
      code: code.toUpperCase(),
      name,
      type,
      isRequired,
      isActive,
    }

    const result = isEditing
      ? await updateDimensionDefinition(dimension.id, data)
      : await createDimensionDefinition(data)

    setLoading(false)

    if (result.success) {
      onOpenChange(false)
    } else {
      setError(result.error || "An error occurred")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit" : "Create"} Dimension</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update this dimension definition."
              : "Create a new dimension for tagging transactions."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g., DEPT"
                maxLength={10}
                disabled={isEditing}
                required
              />
              <p className="text-xs text-muted-foreground">
                Short code used in data (uppercase, max 10 characters)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Department"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={(value) => setType(value as DimensionType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEPARTMENT">Department</SelectItem>
                  <SelectItem value="PROJECT">Project</SelectItem>
                  <SelectItem value="LOCATION">Location</SelectItem>
                  <SelectItem value="ENTITY">Entity</SelectItem>
                  <SelectItem value="CUSTOMER">Customer</SelectItem>
                  <SelectItem value="VENDOR">Vendor</SelectItem>
                  <SelectItem value="CUSTOM">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isRequired"
                checked={isRequired}
                onCheckedChange={setIsRequired}
              />
              <Label htmlFor="isRequired">Required for all journal entries</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>

            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEditing ? "Update" : "Create"} Dimension
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
