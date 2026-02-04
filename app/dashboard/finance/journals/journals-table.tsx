"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { DataTable, Th, Td, Tr } from "@/components/atlas/data-table"
import {
  MoreHorizontal,
  Edit,
  Trash2,
  CheckCircle,
  RotateCcw,
  Plus,
  Search,
  Filter,
  BookOpen,
  ChevronRight,
  Calendar,
} from "lucide-react"
import { JournalDialog } from "./journal-dialog"
import {
  postJournalEntry,
  deleteJournalEntry,
  createReversingEntry,
  bulkPostJournalEntries,
  bulkDeleteJournalEntries,
} from "./actions"
import { Account, JournalEntry, JournalLine, DimensionDefinition, DimensionValue } from "@prisma/client"
import { format, startOfMonth, endOfMonth, subDays, subMonths, startOfYear } from "date-fns"

type JournalWithLines = JournalEntry & {
  lines: (JournalLine & { account: Account })[]
}

type DimensionWithValues = DimensionDefinition & {
  values: DimensionValue[]
}

type JournalsTableProps = {
  journals: JournalWithLines[]
  accounts: Account[]
  dimensionDefinitions: DimensionWithValues[]
  dimensionsEnabled: boolean
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  POSTED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
}

export function JournalsTable({ journals, accounts, dimensionDefinitions, dimensionsEnabled }: JournalsTableProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedJournal, setSelectedJournal] = useState<JournalWithLines | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const getDateRange = (filter: string): { start: Date | null; end: Date | null } => {
    const today = new Date()
    today.setHours(23, 59, 59, 999)

    switch (filter) {
      case "today":
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)
        return { start: todayStart, end: today }
      case "last7":
        return { start: subDays(today, 7), end: today }
      case "last30":
        return { start: subDays(today, 30), end: today }
      case "thisMonth":
        return { start: startOfMonth(today), end: endOfMonth(today) }
      case "lastMonth":
        const lastMonth = subMonths(today, 1)
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) }
      case "thisYear":
        return { start: startOfYear(today), end: today }
      default:
        return { start: null, end: null }
    }
  }

  const filteredJournals = useMemo(() => {
    const dateRange = getDateRange(dateFilter)

    return journals.filter((journal) => {
      const matchesSearch =
        journal.journalNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (journal.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      const matchesStatus = statusFilter === "all" || journal.status === statusFilter

      let matchesDate = true
      if (dateRange.start && dateRange.end) {
        const postingDate = new Date(journal.postingDate)
        matchesDate = postingDate >= dateRange.start && postingDate <= dateRange.end
      }

      return matchesSearch && matchesStatus && matchesDate
    })
  }, [journals, searchQuery, statusFilter, dateFilter])

  const selectedJournals = filteredJournals.filter((j) => selectedIds.has(j.id))
  const allSelected = filteredJournals.length > 0 && selectedIds.size === filteredJournals.length
  const someSelected = selectedIds.size > 0 && !allSelected

  const draftCount = journals.filter((j) => j.status === "DRAFT").length

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredJournals.map((j) => j.id)))
    }
  }

  function toggleSelect(id: string) {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const handleEdit = (journal: JournalWithLines) => {
    if (journal.status === "POSTED") {
      alert("Cannot edit posted journal entries. Create a reversing entry instead.")
      return
    }
    setSelectedJournal(journal)
    setDialogOpen(true)
  }

  const handleCreate = () => {
    setSelectedJournal(undefined)
    setDialogOpen(true)
  }

  const handlePost = async (journal: JournalWithLines) => {
    if (journal.status === "POSTED") {
      alert("Journal entry is already posted.")
      return
    }

    if (!confirm(`Are you sure you want to post journal entry ${journal.journalNo}? This action is irreversible.`)) {
      return
    }

    const result = await postJournalEntry(journal.id)
    if (!result.success) {
      alert(result.error || "Failed to post journal entry")
    }
  }

  const handleDelete = async (journal: JournalWithLines) => {
    if (journal.status === "POSTED") {
      alert("Cannot delete posted journal entries. Create a reversing entry instead.")
      return
    }

    if (!confirm(`Are you sure you want to delete journal entry ${journal.journalNo}?`)) {
      return
    }

    const result = await deleteJournalEntry(journal.id)
    if (!result.success) {
      alert(result.error || "Failed to delete journal entry")
    }
  }

  const handleReverse = async (journal: JournalWithLines) => {
    if (journal.status !== "POSTED") {
      alert("Can only reverse posted journal entries.")
      return
    }

    if (!confirm(`Create a reversing entry for ${journal.journalNo}?`)) {
      return
    }

    const result = await createReversingEntry(journal.id)
    if (!result.success) {
      alert(result.error || "Failed to create reversing entry")
    } else {
      alert(`Created reversing entry: ${result.data?.journalNo}`)
    }
  }

  const handleBulkPost = async () => {
    const drafts = selectedJournals.filter((j) => j.status === "DRAFT")
    if (drafts.length === 0) {
      alert("No draft journals selected. Only draft journals can be posted.")
      return
    }

    if (!confirm(`Post ${drafts.length} journal entries? This action is irreversible.`)) {
      return
    }

    const result = await bulkPostJournalEntries(drafts.map((j) => j.id))
    if (result.success) {
      setSelectedIds(new Set())
    } else {
      alert(result.error)
    }
  }

  const handleBulkDelete = async () => {
    const drafts = selectedJournals.filter((j) => j.status === "DRAFT")
    if (drafts.length === 0) {
      alert("No draft journals selected. Only draft journals can be deleted.")
      return
    }

    const posted = selectedJournals.filter((j) => j.status === "POSTED")
    const message = posted.length > 0
      ? `Delete ${drafts.length} draft journals? (${posted.length} posted journals will be skipped)`
      : `Delete ${drafts.length} journal entries? This cannot be undone.`

    if (!confirm(message)) {
      return
    }

    const result = await bulkDeleteJournalEntries(drafts.map((j) => j.id))
    if (result.success) {
      setSelectedIds(new Set())
    } else {
      alert(result.error)
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search journals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="POSTED">Posted</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-36">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="last7">Last 7 Days</SelectItem>
                <SelectItem value="last30">Last 30 Days</SelectItem>
                <SelectItem value="thisMonth">This Month</SelectItem>
                <SelectItem value="lastMonth">Last Month</SelectItem>
                <SelectItem value="thisYear">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            New Journal
          </Button>
        </div>
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
          <span className="text-sm text-muted-foreground">
            {selectedIds.size} selected
          </span>
          <Button variant="outline" size="sm" onClick={handleBulkPost}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Post
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkDelete}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedIds(new Set())}
          >
            Clear
          </Button>
        </div>
      )}

      {/* Draft count banner */}
      {draftCount > 0 && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <BookOpen className="h-4 w-4 text-amber-600" />
          <span className="text-sm text-amber-800 dark:text-amber-200">
            <strong>{draftCount}</strong> draft journal{draftCount !== 1 && "s"} pending
          </span>
          <Button
            variant="link"
            size="sm"
            className="text-amber-700 p-0 h-auto"
            onClick={() => setStatusFilter("DRAFT")}
          >
            Show drafts
          </Button>
        </div>
      )}

      {/* Table */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Journal Entries
            {filteredJournals.length !== journals.length && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({filteredJournals.length} of {journals.length})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable>
            <thead>
              <tr>
                <Th className="w-10">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                    {...(someSelected ? { "data-state": "indeterminate" } : {})}
                  />
                </Th>
                <Th className="w-8"></Th>
                <Th>Journal No.</Th>
                <Th>Date</Th>
                <Th>Description</Th>
                <Th className="text-right">Debits</Th>
                <Th className="text-right">Credits</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filteredJournals.map((journal) => {
                const totalDebits = journal.lines.reduce((sum, line) => sum + Number(line.debit), 0)
                const totalCredits = journal.lines.reduce((sum, line) => sum + Number(line.credit), 0)
                const isExpanded = expandedId === journal.id

                return (
                  <Collapsible key={journal.id} open={isExpanded} onOpenChange={() => setExpandedId(isExpanded ? null : journal.id)} asChild>
                    <>
                      <Tr className={selectedIds.has(journal.id) ? "bg-muted/50" : ""}>
                        <Td>
                          <Checkbox
                            checked={selectedIds.has(journal.id)}
                            onCheckedChange={() => toggleSelect(journal.id)}
                            aria-label={`Select ${journal.journalNo}`}
                          />
                        </Td>
                        <Td>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                            </Button>
                          </CollapsibleTrigger>
                        </Td>
                        <Td className="font-medium">{journal.journalNo}</Td>
                        <Td className="text-xs whitespace-nowrap text-muted-foreground">
                          {format(new Date(journal.postingDate), "MMM d, yyyy")}
                        </Td>
                        <Td className="max-w-50">
                          <div className="truncate text-sm" title={journal.description || ""}>
                            {journal.description || <span className="text-muted-foreground">—</span>}
                          </div>
                        </Td>
                        <Td className="text-right font-mono text-sm">
                          ${totalDebits.toFixed(2)}
                        </Td>
                        <Td className="text-right font-mono text-sm">
                          ${totalCredits.toFixed(2)}
                        </Td>
                        <Td>
                          <Badge variant="secondary" className={statusColors[journal.status]}>
                            {journal.status}
                          </Badge>
                        </Td>
                        <Td className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {journal.status === "DRAFT" && (
                                <>
                                  <DropdownMenuItem onClick={() => handleEdit(journal)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handlePost(journal)}>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Post
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDelete(journal)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </>
                              )}
                              {journal.status === "POSTED" && (
                                <DropdownMenuItem onClick={() => handleReverse(journal)}>
                                  <RotateCcw className="h-4 w-4 mr-2" />
                                  Create Reversal
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </Td>
                      </Tr>
                      <CollapsibleContent asChild>
                        <tr>
                          <td colSpan={9} className="p-0">
                            <div className="bg-muted/30 px-12 py-3 border-t">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="text-xs text-muted-foreground">
                                    <th className="text-left py-1 font-medium">Line</th>
                                    <th className="text-left py-1 font-medium">Account</th>
                                    <th className="text-left py-1 font-medium">Memo</th>
                                    <th className="text-right py-1 font-medium">Debit</th>
                                    <th className="text-right py-1 font-medium">Credit</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {journal.lines.map((line) => (
                                    <tr key={line.id} className="border-t border-muted">
                                      <td className="py-1.5 text-muted-foreground">{line.lineNo}</td>
                                      <td className="py-1.5">
                                        <span className="font-medium">{line.account.number}</span>
                                        <span className="text-muted-foreground ml-2">{line.account.name}</span>
                                      </td>
                                      <td className="py-1.5 text-muted-foreground">{line.memo || "—"}</td>
                                      <td className="py-1.5 text-right font-mono">
                                        {Number(line.debit) > 0 ? `$${Number(line.debit).toFixed(2)}` : "—"}
                                      </td>
                                      <td className="py-1.5 text-right font-mono">
                                        {Number(line.credit) > 0 ? `$${Number(line.credit).toFixed(2)}` : "—"}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      </CollapsibleContent>
                    </>
                  </Collapsible>
                )
              })}
              {filteredJournals.length === 0 && (
                <Tr>
                  <Td className="text-center text-muted-foreground" colSpan={9}>
                    {searchQuery || statusFilter !== "all" || dateFilter !== "all"
                      ? "No journals match your filters."
                      : "No journal entries yet. Create your first journal entry to get started."}
                  </Td>
                </Tr>
              )}
            </tbody>
          </DataTable>
        </CardContent>
      </Card>

      <JournalDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        accounts={accounts}
        journalEntry={selectedJournal}
        dimensionDefinitions={dimensionDefinitions}
        dimensionsEnabled={dimensionsEnabled}
      />
    </div>
  )
}
