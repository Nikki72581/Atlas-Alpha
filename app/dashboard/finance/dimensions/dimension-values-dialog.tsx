"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeader, DataTableRow } from "@/components/atlas/data-table"
import { Plus, Edit, Trash2, Save, X } from "lucide-react"
import { createDimensionValue, updateDimensionValue, deleteDimensionValue } from "./actions"
import { DimensionDefinition, DimensionValue } from "@prisma/client"

type DimensionWithValues = DimensionDefinition & {
  values: DimensionValue[]
}

type DimensionValuesDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  dimension?: DimensionWithValues
}

export function DimensionValuesDialog({ open, onOpenChange, dimension }: DimensionValuesDialogProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [loading, setLoading] = useState(false)

  // New value form
  const [newCode, setNewCode] = useState("")
  const [newName, setNewName] = useState("")
  const [newActive, setNewActive] = useState(true)

  // Edit form
  const [editName, setEditName] = useState("")
  const [editActive, setEditActive] = useState(true)

  const handleStartCreate = () => {
    setCreating(true)
    setNewCode("")
    setNewName("")
    setNewActive(true)
  }

  const handleCancelCreate = () => {
    setCreating(false)
    setNewCode("")
    setNewName("")
    setNewActive(true)
  }

  const handleCreate = async () => {
    if (!dimension || !newCode || !newName) return

    setLoading(true)
    const result = await createDimensionValue(dimension.id, {
      code: newCode.toUpperCase(),
      name: newName,
      isActive: newActive,
    })
    setLoading(false)

    if (result.success) {
      handleCancelCreate()
    } else {
      alert(result.error || "Failed to create value")
    }
  }

  const handleStartEdit = (value: DimensionValue) => {
    setEditingId(value.id)
    setEditName(value.name)
    setEditActive(value.isActive)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditName("")
    setEditActive(true)
  }

  const handleSaveEdit = async (valueId: string) => {
    setLoading(true)
    const result = await updateDimensionValue(valueId, {
      code: "", // Code can't be changed
      name: editName,
      isActive: editActive,
    })
    setLoading(false)

    if (result.success) {
      handleCancelEdit()
    } else {
      alert(result.error || "Failed to update value")
    }
  }

  const handleDelete = async (value: DimensionValue) => {
    if (!confirm(`Delete value "${value.name}"? This cannot be undone.`)) {
      return
    }

    const result = await deleteDimensionValue(value.id)
    if (!result.success) {
      alert(result.error || "Failed to delete value")
    }
  }

  if (!dimension) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Values: {dimension.name}</DialogTitle>
          <DialogDescription>
            Define the available values for this dimension
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add New Value */}
          {!creating ? (
            <Button onClick={handleStartCreate} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Value
            </Button>
          ) : (
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-sm">New Value</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="newCode">Code</Label>
                  <Input
                    id="newCode"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    placeholder="e.g., SALES"
                    maxLength={20}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newName">Name</Label>
                  <Input
                    id="newName"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g., Sales Department"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="newActive"
                  checked={newActive}
                  onCheckedChange={setNewActive}
                />
                <Label htmlFor="newActive">Active</Label>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreate} size="sm" disabled={loading || !newCode || !newName}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button onClick={handleCancelCreate} size="sm" variant="outline" disabled={loading}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Values Table */}
          {dimension.values.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No values defined yet. Add your first value above.
            </div>
          ) : (
            <DataTable>
              <DataTableHeader>
                <DataTableRow>
                  <DataTableHead>Code</DataTableHead>
                  <DataTableHead>Name</DataTableHead>
                  <DataTableHead>Status</DataTableHead>
                  <DataTableHead className="w-24">Actions</DataTableHead>
                </DataTableRow>
              </DataTableHeader>
              <DataTableBody>
                {dimension.values.map((value) => (
                  <DataTableRow key={value.id}>
                    <DataTableCell className="font-mono font-medium">{value.code}</DataTableCell>
                    <DataTableCell>
                      {editingId === value.id ? (
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-8"
                        />
                      ) : (
                        value.name
                      )}
                    </DataTableCell>
                    <DataTableCell>
                      {editingId === value.id ? (
                        <Switch
                          checked={editActive}
                          onCheckedChange={setEditActive}
                        />
                      ) : value.isActive ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </DataTableCell>
                    <DataTableCell>
                      {editingId === value.id ? (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSaveEdit(value.id)}
                            disabled={loading}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelEdit}
                            disabled={loading}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStartEdit(value)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(value)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTable>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
