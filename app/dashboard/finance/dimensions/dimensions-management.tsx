"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeader, DataTableRow } from "@/components/atlas/data-table"
import { Plus, MoreHorizontal, Edit, Trash2, ListPlus } from "lucide-react"
import { DimensionDefinitionDialog } from "./dimension-definition-dialog"
import { DimensionValuesDialog } from "./dimension-values-dialog"
import { toggleDimensions, deleteDimensionDefinition } from "./actions"
import { DimensionDefinition, DimensionValue, DimensionType } from "@prisma/client"

type DimensionWithValues = DimensionDefinition & {
  values: DimensionValue[]
  _count: {
    values: number
  }
}

type DimensionsManagementProps = {
  dimensions: DimensionWithValues[]
  dimensionsEnabled: boolean
}

export function DimensionsManagement({ dimensions, dimensionsEnabled }: DimensionsManagementProps) {
  const [definitionDialogOpen, setDefinitionDialogOpen] = useState(false)
  const [valuesDialogOpen, setValuesDialogOpen] = useState(false)
  const [selectedDimension, setSelectedDimension] = useState<DimensionWithValues | undefined>(undefined)
  const [isToggling, setIsToggling] = useState(false)

  const handleToggleDimensions = async (enabled: boolean) => {
    setIsToggling(true)
    const result = await toggleDimensions(enabled)
    setIsToggling(false)

    if (!result.success) {
      alert(result.error || "Failed to toggle dimensions")
    }
  }

  const handleEditDefinition = (dimension: DimensionWithValues) => {
    setSelectedDimension(dimension)
    setDefinitionDialogOpen(true)
  }

  const handleManageValues = (dimension: DimensionWithValues) => {
    setSelectedDimension(dimension)
    setValuesDialogOpen(true)
  }

  const handleCreateDefinition = () => {
    setSelectedDimension(undefined)
    setDefinitionDialogOpen(true)
  }

  const handleDeleteDefinition = async (dimension: DimensionWithValues) => {
    if (!confirm(`Delete dimension "${dimension.name}"? This cannot be undone.`)) {
      return
    }

    const result = await deleteDimensionDefinition(dimension.id)
    if (!result.success) {
      alert(result.error || "Failed to delete dimension")
    }
  }

  const getTypeBadge = (type: DimensionType) => {
    const variants: Record<DimensionType, string> = {
      DEPARTMENT: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      PROJECT: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      LOCATION: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      ENTITY: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      CUSTOMER: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
      VENDOR: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
      CUSTOM: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
    }

    return <Badge className={variants[type]}>{type}</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Feature Toggle */}
      <Card>
        <CardHeader>
          <CardTitle>Dimensions Feature</CardTitle>
          <CardDescription>
            Enable dimensions to add flexible tagging to journal entries, allowing you to track transactions by department, project, location, and more.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch
              id="dimensions-enabled"
              checked={dimensionsEnabled}
              onCheckedChange={handleToggleDimensions}
              disabled={isToggling}
            />
            <Label htmlFor="dimensions-enabled" className="font-medium">
              {dimensionsEnabled ? "Enabled" : "Disabled"}
            </Label>
          </div>
          {dimensionsEnabled && dimensions.length === 0 && (
            <p className="mt-4 text-sm text-muted-foreground">
              Dimensions are enabled. Create your first dimension definition below.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Dimensions List */}
      {dimensionsEnabled && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Dimension Definitions</CardTitle>
              <CardDescription>
                Define the dimensions available for tagging transactions
              </CardDescription>
            </div>
            <Button onClick={handleCreateDefinition}>
              <Plus className="h-4 w-4 mr-2" />
              New Dimension
            </Button>
          </CardHeader>
          <CardContent>
            {dimensions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No dimensions defined yet. Create your first dimension to get started.
              </div>
            ) : (
              <DataTable>
                <DataTableHeader>
                  <DataTableRow>
                    <DataTableHead>Code</DataTableHead>
                    <DataTableHead>Name</DataTableHead>
                    <DataTableHead>Type</DataTableHead>
                    <DataTableHead>Required</DataTableHead>
                    <DataTableHead>Status</DataTableHead>
                    <DataTableHead>Values</DataTableHead>
                    <DataTableHead className="w-12"></DataTableHead>
                  </DataTableRow>
                </DataTableHeader>
                <DataTableBody>
                  {dimensions.map((dimension) => (
                    <DataTableRow key={dimension.id}>
                      <DataTableCell className="font-mono font-medium">{dimension.code}</DataTableCell>
                      <DataTableCell>{dimension.name}</DataTableCell>
                      <DataTableCell>{getTypeBadge(dimension.type)}</DataTableCell>
                      <DataTableCell>
                        {dimension.isRequired ? (
                          <Badge variant="destructive">Required</Badge>
                        ) : (
                          <Badge variant="outline">Optional</Badge>
                        )}
                      </DataTableCell>
                      <DataTableCell>
                        {dimension.isActive ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </DataTableCell>
                      <DataTableCell>
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => handleManageValues(dimension)}
                          className="p-0 h-auto"
                        >
                          {dimension._count.values} values
                        </Button>
                      </DataTableCell>
                      <DataTableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleManageValues(dimension)}>
                              <ListPlus className="h-4 w-4 mr-2" />
                              Manage Values
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditDefinition(dimension)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteDefinition(dimension)}
                              className="text-destructive"
                              disabled={dimension._count.values > 0}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </DataTableCell>
                    </DataTableRow>
                  ))}
                </DataTableBody>
              </DataTable>
            )}
          </CardContent>
        </Card>
      )}

      <DimensionDefinitionDialog
        open={definitionDialogOpen}
        onOpenChange={setDefinitionDialogOpen}
        dimension={selectedDimension}
      />

      <DimensionValuesDialog
        open={valuesDialogOpen}
        onOpenChange={setValuesDialogOpen}
        dimension={selectedDimension}
      />
    </div>
  )
}
