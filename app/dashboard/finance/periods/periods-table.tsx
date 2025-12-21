"use client"

import { useState } from "react"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeader, DataTableRow } from "@/components/atlas/data-table"
import { MoreHorizontal, Plus, Edit, Trash2, Lock, Unlock, CheckCircle, Calendar } from "lucide-react"
import { PeriodDialog } from "./period-dialog"
import { GenerateFiscalYearDialog } from "./generate-fiscal-year-dialog"
import { closePeriod, reopenPeriod, lockPeriod, deletePeriod } from "./actions"
import { Period, PeriodStatus } from "@prisma/client"

type PeriodWithCount = Period & {
  _count: {
    journalEntries: number
  }
}

type PeriodsTableProps = {
  periods: PeriodWithCount[]
}

export function PeriodsTable({ periods }: PeriodsTableProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<Period | undefined>(undefined)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<PeriodStatus | "ALL">("ALL")
  const [yearFilter, setYearFilter] = useState<string>("ALL")

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
    if (!confirm(`Close period ${period.name}? This will prevent new journal entries from being posted to this period.`)) {
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
    if (!confirm(`Lock period ${period.name}? This is permanent and cannot be undone!`)) {
      return
    }

    const result = await lockPeriod(period.id)
    if (!result.success) {
      alert(result.error || "Failed to lock period")
    }
  }

  const handleDelete = async (period: Period) => {
    if (!confirm(`Delete period ${period.name}?`)) {
      return
    }

    const result = await deletePeriod(period.id)
    if (!result.success) {
      alert(result.error || "Failed to delete period")
    }
  }

  // Get unique fiscal years
  const fiscalYears = Array.from(new Set(periods.map((p) => p.fiscalYear))).sort((a, b) => b - a)

  // Filter periods
  const filteredPeriods = periods.filter((period) => {
    const matchesSearch = period.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "ALL" || period.status === statusFilter
    const matchesYear = yearFilter === "ALL" || period.fiscalYear === parseInt(yearFilter)
    return matchesSearch && matchesStatus && matchesYear
  })

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

            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as PeriodStatus | "ALL")}>
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
          <CardContent className="p-0">
            <DataTable>
              <DataTableHeader>
                <DataTableRow>
                  <DataTableHead>Period</DataTableHead>
                  <DataTableHead>FY</DataTableHead>
                  <DataTableHead>Period #</DataTableHead>
                  <DataTableHead>Start Date</DataTableHead>
                  <DataTableHead>End Date</DataTableHead>
                  <DataTableHead>Status</DataTableHead>
                  <DataTableHead>Journals</DataTableHead>
                  <DataTableHead className="w-12"></DataTableHead>
                </DataTableRow>
              </DataTableHeader>
              <DataTableBody>
                {filteredPeriods.map((period) => (
                  <DataTableRow key={period.id}>
                    <DataTableCell className="font-medium">{period.name}</DataTableCell>
                    <DataTableCell>{period.fiscalYear}</DataTableCell>
                    <DataTableCell>{period.periodNumber}</DataTableCell>
                    <DataTableCell>{new Date(period.startDate).toLocaleDateString()}</DataTableCell>
                    <DataTableCell>{new Date(period.endDate).toLocaleDateString()}</DataTableCell>
                    <DataTableCell>{getStatusBadge(period.status)}</DataTableCell>
                    <DataTableCell>{period._count.journalEntries}</DataTableCell>
                    <DataTableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {period.status === "OPEN" && (
                            <>
                              <DropdownMenuItem onClick={() => handleEdit(period)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleClose(period)}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Close Period
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(period)}
                                className="text-destructive"
                                disabled={period._count.journalEntries > 0}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                          {period.status === "CLOSED" && (
                            <>
                              <DropdownMenuItem onClick={() => handleReopen(period)}>
                                <Unlock className="h-4 w-4 mr-2" />
                                Reopen Period
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleLock(period)}>
                                <Lock className="h-4 w-4 mr-2" />
                                Lock Period
                              </DropdownMenuItem>
                            </>
                          )}
                          {period.status === "LOCKED" && (
                            <DropdownMenuItem disabled>
                              <Lock className="h-4 w-4 mr-2" />
                              Locked (Permanent)
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTable>
          </CardContent>
        </Card>
      )}

      <PeriodDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        period={selectedPeriod}
      />

      <GenerateFiscalYearDialog
        open={generateDialogOpen}
        onOpenChange={setGenerateDialogOpen}
      />
    </div>
  )
}
