"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  EnhancedDataTable,
  BulkActionBar,
  useTableSelection,
  type ColumnDef,
  type BulkAction,
} from "@/components/atlas/enhanced-data-table"
import {
  QuickPreviewPanel,
  useQuickPreview,
  createPreviewSection,
  PreviewBadge,
  type PreviewAction,
} from "@/components/atlas/quick-preview-panel"
import {
  Plus,
  Edit,
  Trash2,
  Lock,
  Unlock,
  CheckCircle,
  Calendar,
  Eye,
  XCircle,
} from "lucide-react"
import { PeriodDialog } from "./period-dialog"
import { GenerateFiscalYearDialog } from "./generate-fiscal-year-dialog"
import { closePeriod, reopenPeriod, lockPeriod, deletePeriod } from "./actions"
import { Period, PeriodStatus } from "@prisma/client"

type PeriodWithCount = Period & {
  _count: {
    journalEntries: number
  }
}

type PeriodsTableEnhancedProps = {
  periods: PeriodWithCount[]
}

export function PeriodsTableEnhanced({ periods }: PeriodsTableEnhancedProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<Period | undefined>(undefined)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<PeriodStatus | "ALL">("ALL")
  const [yearFilter, setYearFilter] = useState<string>("ALL")

  const { selectedIds, setSelectedIds, clearSelection, selectedCount } = useTableSelection()
  const { isOpen, selectedItem, openPreview, setIsOpen } = useQuickPreview<PeriodWithCount>()

  // Get unique fiscal years
  const fiscalYears = Array.from(new Set(periods.map((p) => p.fiscalYear))).sort((a, b) => b - a)

  // Filter periods
  const filteredPeriods = useMemo(() => {
    return periods.filter((period) => {
      const matchesSearch = period.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === "ALL" || period.status === statusFilter
      const matchesYear = yearFilter === "ALL" || period.fiscalYear === parseInt(yearFilter)
      return matchesSearch && matchesStatus && matchesYear
    })
  }, [periods, searchTerm, statusFilter, yearFilter])

  const getStatusBadge = (status: PeriodStatus) => {
    switch (status) {
      case "OPEN":
        return <Badge variant="default">Open</Badge>
      case "CLOSED":
        return <Badge variant="secondary">Closed</Badge>
      case "LOCKED":
        return <Badge variant="outline">Locked</Badge>
    }
  }

  const getStatusVariant = (status: PeriodStatus): "success" | "warning" | "error" | "default" => {
    switch (status) {
      case "OPEN":
        return "success"
      case "CLOSED":
        return "warning"
      case "LOCKED":
        return "error"
    }
  }

  // Define columns
  const columns: ColumnDef<PeriodWithCount>[] = [
    {
      id: "name",
      header: "Period",
      accessorKey: "name",
      sortable: true,
      className: "font-medium",
    },
    {
      id: "fiscalYear",
      header: "FY",
      accessorKey: "fiscalYear",
      sortable: true,
    },
    {
      id: "periodNumber",
      header: "Period #",
      accessorKey: "periodNumber",
      sortable: true,
    },
    {
      id: "startDate",
      header: "Start Date",
      accessorKey: "startDate",
      sortable: true,
      cell: (row) => new Date(row.startDate).toLocaleDateString(),
    },
    {
      id: "endDate",
      header: "End Date",
      accessorKey: "endDate",
      sortable: true,
      cell: (row) => new Date(row.endDate).toLocaleDateString(),
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "status",
      sortable: true,
      cell: (row) => getStatusBadge(row.status),
    },
    {
      id: "journals",
      header: "Journals",
      accessorFn: (row) => row._count.journalEntries,
      sortable: true,
    },
    {
      id: "preview",
      header: "",
      sortable: false,
      className: "w-12",
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => openPreview(row)}
          className="h-8 w-8 p-0"
          title="Quick preview"
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      sortable: false,
      headerClassName: "text-right",
      className: "text-right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-2">
          {row.status === "OPEN" && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(row)}
                className="h-8 w-8 p-0"
                title="Edit period"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleClose(row)}
                className="h-8 w-8 p-0"
                title="Close period"
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(row)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                title="Delete period"
                disabled={row._count.journalEntries > 0}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
          {row.status === "CLOSED" && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleReopen(row)}
                className="h-8 w-8 p-0"
                title="Reopen period"
              >
                <Unlock className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleLock(row)}
                className="h-8 w-8 p-0"
                title="Lock period (permanent)"
              >
                <Lock className="h-4 w-4" />
              </Button>
            </>
          )}
          {row.status === "LOCKED" && (
            <span className="text-xs text-muted-foreground px-2">Locked</span>
          )}
        </div>
      ),
    },
  ]

  // Bulk actions
  const bulkActions: BulkAction[] = [
    {
      label: "Close Selected",
      icon: <CheckCircle className="h-4 w-4" />,
      variant: "outline",
      onClick: async () => {
        const periodsToClose = periods.filter(
          (p) => selectedIds.includes(p.id) && p.status === "OPEN"
        )
        if (periodsToClose.length === 0) {
          alert("No open periods selected")
          return
        }
        if (
          confirm(
            `Close ${periodsToClose.length} period(s)? This will prevent new journal entries.`
          )
        ) {
          for (const period of periodsToClose) {
            await closePeriod(period.id)
          }
          clearSelection()
        }
      },
    },
    {
      label: "Reopen Selected",
      icon: <Unlock className="h-4 w-4" />,
      variant: "outline",
      onClick: async () => {
        const periodsToReopen = periods.filter(
          (p) => selectedIds.includes(p.id) && p.status === "CLOSED"
        )
        if (periodsToReopen.length === 0) {
          alert("No closed periods selected")
          return
        }
        if (confirm(`Reopen ${periodsToReopen.length} period(s)?`)) {
          for (const period of periodsToReopen) {
            await reopenPeriod(period.id)
          }
          clearSelection()
        }
      },
    },
    {
      label: "Delete Selected",
      icon: <Trash2 className="h-4 w-4" />,
      variant: "destructive",
      onClick: async () => {
        const periodsToDelete = periods.filter(
          (p) =>
            selectedIds.includes(p.id) &&
            p.status === "OPEN" &&
            p._count.journalEntries === 0
        )
        if (periodsToDelete.length === 0) {
          alert("No deletable periods selected (must be open with no journals)")
          return
        }
        if (
          confirm(
            `Delete ${periodsToDelete.length} period(s)? This action cannot be undone.`
          )
        ) {
          for (const period of periodsToDelete) {
            await deletePeriod(period.id)
          }
          clearSelection()
        }
      },
    },
  ]

  // Preview actions
  const previewActions: PreviewAction[] = selectedItem
    ? [
        ...(selectedItem.status === "OPEN"
          ? [
              {
                label: "Edit",
                icon: <Edit className="h-4 w-4" />,
                variant: "outline" as const,
                onClick: () => {
                  handleEdit(selectedItem)
                  setIsOpen(false)
                },
              },
              {
                label: "Close",
                icon: <CheckCircle className="h-4 w-4" />,
                variant: "outline" as const,
                onClick: async () => {
                  await handleClose(selectedItem)
                  setIsOpen(false)
                },
              },
              {
                label: "Delete",
                icon: <Trash2 className="h-4 w-4" />,
                variant: "destructive" as const,
                onClick: async () => {
                  await handleDelete(selectedItem)
                  setIsOpen(false)
                },
                disabled: selectedItem._count.journalEntries > 0,
              },
            ]
          : []),
        ...(selectedItem.status === "CLOSED"
          ? [
              {
                label: "Reopen",
                icon: <Unlock className="h-4 w-4" />,
                variant: "outline" as const,
                onClick: async () => {
                  await handleReopen(selectedItem)
                  setIsOpen(false)
                },
              },
              {
                label: "Lock",
                icon: <Lock className="h-4 w-4" />,
                variant: "destructive" as const,
                onClick: async () => {
                  await handleLock(selectedItem)
                  setIsOpen(false)
                },
              },
            ]
          : []),
      ]
    : []

  const handleEdit = (period: Period) => {
    if (period.status !== "OPEN") {
      alert("Can only edit open periods")
      return
    }
    setSelectedPeriod(period)
    setDialogOpen(true)
  }

  const handleCreate = () => {
    setSelectedPeriod(undefined)
    setDialogOpen(true)
  }

  const handleClose = async (period: Period) => {
    if (
      !confirm(
        `Close period ${period.name}? This will prevent new journal entries from being posted to this period.`
      )
    ) {
      return
    }

    const result = await closePeriod(period.id)
    if (!result.success) {
      alert(result.error || "Failed to close period")
    }
  }

  const handleReopen = async (period: Period) => {
    if (!confirm(`Reopen period ${period.name}?`)) {
      return
    }

    const result = await reopenPeriod(period.id)
    if (!result.success) {
      alert(result.error || "Failed to reopen period")
    }
  }

  const handleLock = async (period: Period) => {
    if (
      !confirm(
        `Lock period ${period.name}? This is permanent and cannot be undone!`
      )
    ) {
      return
    }

    const result = await lockPeriod(period.id)
    if (!result.success) {
      alert(result.error || "Failed to lock period")
    }
  }

  const handleDelete = async (period: PeriodWithCount) => {
    if (!confirm(`Delete period ${period.name}?`)) {
      return
    }

    const result = await deletePeriod(period.id)
    if (!result.success) {
      alert(result.error || "Failed to delete period")
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Search periods..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="sm:max-w-xs"
            />

            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as PeriodStatus | "ALL")}
            >
              <SelectTrigger className="sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
                <SelectItem value="LOCKED">Locked</SelectItem>
              </SelectContent>
            </Select>

            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="sm:w-40">
                <SelectValue placeholder="Fiscal Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Years</SelectItem>
                {fiscalYears.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    FY {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2 ml-auto">
              <Button onClick={() => setGenerateDialogOpen(true)} variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Generate Year
              </Button>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                New Period
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Periods Table */}
      {filteredPeriods.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No periods found. Create your first accounting period to get started.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            <BulkActionBar
              selectedCount={selectedCount}
              totalCount={filteredPeriods.length}
              actions={bulkActions}
              onClearSelection={clearSelection}
            />
            <EnhancedDataTable
              data={filteredPeriods}
              columns={columns}
              getRowId={(row) => row.id}
              onSelectionChange={setSelectedIds}
              enableSelection={true}
              enableSorting={true}
              emptyMessage="No periods match your filters."
            />
          </CardContent>
        </Card>
      )}

      <QuickPreviewPanel
        open={isOpen}
        onOpenChange={setIsOpen}
        data={selectedItem}
        title={(period) => `${period.name} (FY ${period.fiscalYear})`}
        description={(period) => `Period ${period.periodNumber}`}
        sections={(period) => [
          createPreviewSection("Period Details", [
            { label: "Period Name", value: period.name },
            { label: "Fiscal Year", value: `FY ${period.fiscalYear}` },
            { label: "Period Number", value: period.periodNumber },
            {
              label: "Status",
              value: <PreviewBadge variant={getStatusVariant(period.status)}>{period.status}</PreviewBadge>,
            },
          ]),
          createPreviewSection("Date Range", [
            {
              label: "Start Date",
              value: new Date(period.startDate).toLocaleDateString("en-US", {
                weekday: "short",
                year: "numeric",
                month: "long",
                day: "numeric",
              }),
              fullWidth: true,
            },
            {
              label: "End Date",
              value: new Date(period.endDate).toLocaleDateString("en-US", {
                weekday: "short",
                year: "numeric",
                month: "long",
                day: "numeric",
              }),
              fullWidth: true,
            },
          ]),
          createPreviewSection("Activity", [
            {
              label: "Journal Entries",
              value: (
                <span className={period._count.journalEntries > 0 ? "font-semibold" : ""}>
                  {period._count.journalEntries} {period._count.journalEntries === 1 ? "entry" : "entries"}
                </span>
              ),
              fullWidth: true,
            },
            {
              label: "Can Delete?",
              value: period._count.journalEntries === 0 ? (
                <PreviewBadge variant="success">Yes</PreviewBadge>
              ) : (
                <PreviewBadge variant="error">No (has journals)</PreviewBadge>
              ),
            },
          ]),
        ]}
        actions={previewActions}
      />

      <PeriodDialog open={dialogOpen} onOpenChange={setDialogOpen} period={selectedPeriod} />

      <GenerateFiscalYearDialog
        open={generateDialogOpen}
        onOpenChange={setGenerateDialogOpen}
      />
    </div>
  )
}
