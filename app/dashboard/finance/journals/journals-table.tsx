"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeader, DataTableRow } from "@/components/atlas/data-table"
import { MoreHorizontal, Edit, Trash2, CheckCircle, RotateCcw, Plus } from "lucide-react"
import { JournalDialog } from "./journal-dialog"
import { postJournalEntry, deleteJournalEntry, createReversingEntry } from "./actions"
import { Account, JournalEntry, JournalLine, JournalStatus } from "@prisma/client"

type JournalWithLines = JournalEntry & {
  lines: (JournalLine & { account: Account })[]
}

type JournalsTableProps = {
  journals: JournalWithLines[]
  accounts: Account[]
}

export function JournalsTable({ journals, accounts }: JournalsTableProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedJournal, setSelectedJournal] = useState<JournalWithLines | undefined>(undefined)

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

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Journal Entry
        </Button>
      </div>

      {journals.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No journal entries found. Create your first journal entry to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {journals.map((journal) => {
            const totalDebits = journal.lines.reduce((sum, line) => sum + Number(line.debit), 0)
            const totalCredits = journal.lines.reduce((sum, line) => sum + Number(line.credit), 0)

            return (
              <Card key={journal.id}>
                <CardContent className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{journal.journalNo}</h3>
                        <Badge variant={journal.status === "POSTED" ? "default" : "secondary"}>
                          {journal.status}
                        </Badge>
                      </div>
                      {journal.description && (
                        <p className="text-sm text-muted-foreground">{journal.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Posting Date: {new Date(journal.postingDate).toLocaleDateString()}
                      </p>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
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
                            <DropdownMenuItem
                              onClick={() => handleDelete(journal)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                        {journal.status === "POSTED" && (
                          <DropdownMenuItem onClick={() => handleReverse(journal)}>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Create Reversing Entry
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Lines */}
                  <DataTable>
                    <DataTableHeader>
                      <DataTableRow>
                        <DataTableHead className="w-12">#</DataTableHead>
                        <DataTableHead>Account</DataTableHead>
                        <DataTableHead>Memo</DataTableHead>
                        <DataTableHead className="text-right w-32">Debit</DataTableHead>
                        <DataTableHead className="text-right w-32">Credit</DataTableHead>
                      </DataTableRow>
                    </DataTableHeader>
                    <DataTableBody>
                      {journal.lines.map((line) => (
                        <DataTableRow key={line.id}>
                          <DataTableCell className="text-muted-foreground">{line.lineNo}</DataTableCell>
                          <DataTableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{line.account.number}</span>
                              <span className="text-sm text-muted-foreground">{line.account.name}</span>
                            </div>
                          </DataTableCell>
                          <DataTableCell className="text-sm text-muted-foreground">
                            {line.memo || "-"}
                          </DataTableCell>
                          <DataTableCell className="text-right tabular-nums">
                            {Number(line.debit) > 0 ? `$${Number(line.debit).toFixed(2)}` : "-"}
                          </DataTableCell>
                          <DataTableCell className="text-right tabular-nums">
                            {Number(line.credit) > 0 ? `$${Number(line.credit).toFixed(2)}` : "-"}
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

      <JournalDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        accounts={accounts}
        journalEntry={selectedJournal}
      />
    </div>
  )
}
