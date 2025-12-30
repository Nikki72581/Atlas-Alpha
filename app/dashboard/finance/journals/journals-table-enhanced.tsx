"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
  BulkActionBar,
  useTableSelection,
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
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
} from "@/components/atlas/data-table"
import {
  Edit,
  Trash2,
  CheckCircle,
  RotateCcw,
  Plus,
  Eye,
  Search,
  Filter,
} from "lucide-react"
import { JournalDialog } from "./journal-dialog"
import {
  postJournalEntry,
  deleteJournalEntry,
  createReversingEntry,
} from "./actions"
import {
  Account,
  JournalEntry,
  JournalLine,
  JournalStatus,
  DimensionDefinition,
  DimensionValue,
} from "@prisma/client"

type JournalWithLines = JournalEntry & {
  lines: (JournalLine & { account: Account })[]
}

type DimensionWithValues = DimensionDefinition & {
  values: DimensionValue[]
}

type JournalsTableEnhancedProps = {
  journals: JournalWithLines[]
  accounts: Account[]
  dimensionDefinitions: DimensionWithValues[]
  dimensionsEnabled: boolean
}

export function JournalsTableEnhanced({
  journals,
  accounts,
  dimensionDefinitions,
  dimensionsEnabled,
}: JournalsTableEnhancedProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedJournal, setSelectedJournal] = useState<
    JournalWithLines | undefined
  >(undefined)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<JournalStatus | "ALL">("ALL")

  const { selectedIds, setSelectedIds, clearSelection, selectedCount } =
    useTableSelection()
  const { isOpen, selectedItem, openPreview, setIsOpen } =
    useQuickPreview<JournalWithLines>()

  // Filter journals
  const filteredJournals = useMemo(() => {
    return journals.filter((journal) => {
      const matchesSearch =
        journal.journalNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        journal.description?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus =
        statusFilter === "ALL" || journal.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [journals, searchTerm, statusFilter])

  // Bulk actions
  const bulkActions: BulkAction[] = [
    {
      label: "Post Selected",
      icon: <CheckCircle className="h-4 w-4" />,
      variant: "outline",
      onClick: async () => {
        const journalsToPost = journals.filter(
          (j) => selectedIds.includes(j.id) && j.status === "DRAFT"
        )
        if (journalsToPost.length === 0) {
          alert("No draft journals selected")
          return
        }
        if (
          confirm(
            `Post ${journalsToPost.length} journal entry(ies)? This action is irreversible.`
          )
        ) {
          for (const journal of journalsToPost) {
            await postJournalEntry(journal.id)
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
        const journalsToDelete = journals.filter(
          (j) => selectedIds.includes(j.id) && j.status === "DRAFT"
        )
        if (journalsToDelete.length === 0) {
          alert("No draft journals selected (cannot delete posted entries)")
          return
        }
        if (
          confirm(
            `Delete ${journalsToDelete.length} journal entry(ies)? This action cannot be undone.`
          )
        ) {
          for (const journal of journalsToDelete) {
            await deleteJournalEntry(journal.id)
          }
          clearSelection()
        }
      },
    },
  ]

  // Preview actions
  const previewActions: PreviewAction[] = selectedItem
    ? [
        ...(selectedItem.status === "DRAFT"
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
                label: "Post",
                icon: <CheckCircle className="h-4 w-4" />,
                variant: "outline" as const,
                onClick: async () => {
                  await handlePost(selectedItem)
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
              },
            ]
          : []),
        ...(selectedItem.status === "POSTED"
          ? [
              {
                label: "Create Reversing Entry",
                icon: <RotateCcw className="h-4 w-4" />,
                variant: "outline" as const,
                onClick: async () => {
                  await handleReverse(selectedItem)
                  setIsOpen(false)
                },
              },
            ]
          : []),
      ]
    : []

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

    if (
      !confirm(
        `Are you sure you want to post journal entry ${journal.journalNo}? This action is irreversible.`
      )
    ) {
      return
    }

    const result = await postJournalEntry(journal.id)
    if (!result.success) {
      alert(result.error || "Failed to post journal entry")
    }
  }

  const handleDelete = async (journal: JournalWithLines) => {
    if (journal.status === "POSTED") {
      alert(
        "Cannot delete posted journal entries. Create a reversing entry instead."
      )
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

  const isSelected = (journalId: string) => selectedIds.includes(journalId)

  const toggleSelection = (journalId: string) => {
    setSelectedIds((prev) =>
      prev.includes(journalId)
        ? prev.filter((id) => id !== journalId)
        : [...prev, journalId]
    )
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredJournals.length) {
      clearSelection()
    } else {
      setSelectedIds(filteredJournals.map((j) => j.id))
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search journals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as JournalStatus | "ALL")}
              >
                <SelectTrigger className="sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="POSTED">Posted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 ml-auto">
              {filteredJournals.length > 0 && (
                <Button variant="outline" size="sm" onClick={toggleSelectAll}>
                  {selectedIds.length === filteredJournals.length
                    ? "Deselect All"
                    : "Select All"}
                </Button>
              )}
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                New Journal Entry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      <BulkActionBar
        selectedCount={selectedCount}
        totalCount={filteredJournals.length}
        actions={bulkActions}
        onClearSelection={clearSelection}
      />

      {/* Journals */}
      {filteredJournals.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            {searchTerm || statusFilter !== "ALL"
              ? "No journal entries match your filters."
              : "No journal entries found. Create your first journal entry to get started."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredJournals.map((journal) => {
            const totalDebits = journal.lines.reduce(
              (sum, line) => sum + Number(line.debit),
              0
            )
            const totalCredits = journal.lines.reduce(
              (sum, line) => sum + Number(line.credit),
              0
            )
            const selected = isSelected(journal.id)

            return (
              <Card
                key={journal.id}
                className={selected ? "border-primary bg-muted/30" : ""}
              >
                <CardContent className="p-6">
                  {/* Header with Selection */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selected}
                        onCheckedChange={() => toggleSelection(journal.id)}
                        className="mt-1"
                        aria-label={`Select journal ${journal.journalNo}`}
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{journal.journalNo}</h3>
                          <Badge
                            variant={
                              journal.status === "POSTED" ? "default" : "secondary"
                            }
                          >
                            {journal.status}
                          </Badge>
                        </div>
                        {journal.description && (
                          <p className="text-sm text-muted-foreground">
                            {journal.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Posting Date:{" "}
                          {new Date(journal.postingDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openPreview(journal)}
                        className="h-8 w-8 p-0"
                        title="Quick preview"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {journal.status === "DRAFT" && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(journal)}
                            className="h-8 w-8 p-0"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePost(journal)}
                            className="h-8 w-8 p-0"
                            title="Post"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(journal)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {journal.status === "POSTED" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReverse(journal)}
                          className="h-8 w-8 p-0"
                          title="Create reversing entry"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Lines */}
                  <DataTable>
                    <DataTableHeader>
                      <DataTableRow>
                        <DataTableHead className="w-12">#</DataTableHead>
                        <DataTableHead>Account</DataTableHead>
                        <DataTableHead>Memo</DataTableHead>
                        <DataTableHead className="text-right w-32">
                          Debit
                        </DataTableHead>
                        <DataTableHead className="text-right w-32">
                          Credit
                        </DataTableHead>
                      </DataTableRow>
                    </DataTableHeader>
                    <DataTableBody>
                      {journal.lines.map((line) => (
                        <DataTableRow key={line.id}>
                          <DataTableCell className="text-muted-foreground">
                            {line.lineNo}
                          </DataTableCell>
                          <DataTableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {line.account.number}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {line.account.name}
                              </span>
                            </div>
                          </DataTableCell>
                          <DataTableCell className="text-sm text-muted-foreground">
                            {line.memo || "-"}
                          </DataTableCell>
                          <DataTableCell className="text-right tabular-nums">
                            {Number(line.debit) > 0
                              ? `$${Number(line.debit).toFixed(2)}`
                              : "-"}
                          </DataTableCell>
                          <DataTableCell className="text-right tabular-nums">
                            {Number(line.credit) > 0
                              ? `$${Number(line.credit).toFixed(2)}`
                              : "-"}
                          </DataTableCell>
                        </DataTableRow>
                      ))}
                      {/* Totals */}
                      <DataTableRow className="font-medium bg-muted/30">
                        <DataTableCell colSpan={3} className="text-right">
                          Totals:
                        </DataTableCell>
                        <DataTableCell className="text-right tabular-nums">
                          ${totalDebits.toFixed(2)}
                        </DataTableCell>
                        <DataTableCell className="text-right tabular-nums">
                          ${totalCredits.toFixed(2)}
                        </DataTableCell>
                      </DataTableRow>
                    </DataTableBody>
                  </DataTable>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <QuickPreviewPanel
        open={isOpen}
        onOpenChange={setIsOpen}
        data={selectedItem}
        title={(journal) => `Journal Entry ${journal.journalNo}`}
        description={(journal) => journal.description || "No description"}
        sections={[]}
        width="xl"
      >
        {(journal) => {
          const totalDebits = journal.lines.reduce(
            (sum, line) => sum + Number(line.debit),
            0
          )
          const totalCredits = journal.lines.reduce(
            (sum, line) => sum + Number(line.credit),
            0
          )
          const isBalanced = totalDebits === totalCredits

          return (
            <div className="space-y-6">
              {/* Summary */}
              <div>
                <h3 className="text-sm font-semibold mb-3 border-b pb-2">
                  Summary
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <Badge
                      variant={journal.status === "POSTED" ? "default" : "secondary"}
                    >
                      {journal.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Posting Date</span>
                    <span>{new Date(journal.postingDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Lines</span>
                    <span>{journal.lines.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Balanced</span>
                    <PreviewBadge variant={isBalanced ? "success" : "error"}>
                      {isBalanced ? "Yes" : "No"}
                    </PreviewBadge>
                  </div>
                </div>
              </div>

              {/* Lines Table */}
              <div>
                <h3 className="text-sm font-semibold mb-3 border-b pb-2">
                  Journal Lines
                </h3>
                <div className="space-y-2">
                  {journal.lines.map((line) => (
                    <div
                      key={line.id}
                      className="p-3 rounded-lg bg-muted/30 space-y-1"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium">
                            {line.account.number} - {line.account.name}
                          </p>
                          {line.memo && (
                            <p className="text-xs text-muted-foreground">
                              {line.memo}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          {Number(line.debit) > 0 && (
                            <p className="text-sm font-semibold">
                              DR: ${Number(line.debit).toFixed(2)}
                            </p>
                          )}
                          {Number(line.credit) > 0 && (
                            <p className="text-sm font-semibold">
                              CR: ${Number(line.credit).toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t pt-4">
                <div className="flex justify-between text-sm font-semibold">
                  <span>Total Debits:</span>
                  <span>${totalDebits.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold">
                  <span>Total Credits:</span>
                  <span>${totalCredits.toFixed(2)}</span>
                </div>
                {!isBalanced && (
                  <p className="text-xs text-destructive mt-2">
                    ⚠️ Entry is not balanced
                  </p>
                )}
              </div>
            </div>
          )
        }}
      </QuickPreviewPanel>

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
