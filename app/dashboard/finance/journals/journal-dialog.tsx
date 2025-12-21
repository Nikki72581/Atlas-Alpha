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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Trash2 } from "lucide-react"
import { createJournalEntry, updateJournalEntry, getNextJournalNumber, type JournalLineFormData, type JournalFormData } from "./actions"
import { Account, JournalEntry, JournalLine } from "@prisma/client"

type JournalWithLines = JournalEntry & {
  lines: (JournalLine & { account: Account })[]
}

type JournalDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  accounts: Account[]
  journalEntry?: JournalWithLines
}

export function JournalDialog({ open, onOpenChange, accounts, journalEntry }: JournalDialogProps) {
  const isEditing = !!journalEntry
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [journalNo, setJournalNo] = useState("")
  const [description, setDescription] = useState("")
  const [postingDate, setPostingDate] = useState(new Date().toISOString().split("T")[0])
  const [lines, setLines] = useState<JournalLineFormData[]>([
    { lineNo: 1, accountId: "", debit: 0, credit: 0, memo: "" },
    { lineNo: 2, accountId: "", debit: 0, credit: 0, memo: "" },
  ])

  // Initialize form when dialog opens or journal entry changes
  useEffect(() => {
    if (open) {
      if (journalEntry) {
        // Editing existing journal
        setJournalNo(journalEntry.journalNo)
        setDescription(journalEntry.description || "")
        setPostingDate(new Date(journalEntry.postingDate).toISOString().split("T")[0])
        setLines(
          journalEntry.lines.map((line) => ({
            lineNo: line.lineNo,
            accountId: line.accountId,
            debit: Number(line.debit),
            credit: Number(line.credit),
            memo: line.memo || "",
            dimensions: line.dimensions as Record<string, string> | undefined,
          }))
        )
      } else {
        // Creating new journal - get next number
        getNextJournalNumber().then((result) => {
          if (result.success && result.data) {
            setJournalNo(result.data)
          }
        })
        setDescription("")
        setPostingDate(new Date().toISOString().split("T")[0])
        setLines([
          { lineNo: 1, accountId: "", debit: 0, credit: 0, memo: "" },
          { lineNo: 2, accountId: "", debit: 0, credit: 0, memo: "" },
        ])
      }
      setError(null)
    }
  }, [open, journalEntry])

  // Calculate totals
  const totalDebits = lines.reduce((sum, line) => sum + Number(line.debit || 0), 0)
  const totalCredits = lines.reduce((sum, line) => sum + Number(line.credit || 0), 0)
  const difference = Math.abs(totalDebits - totalCredits)
  const isBalanced = difference < 0.01

  const addLine = () => {
    const nextLineNo = Math.max(...lines.map(l => l.lineNo), 0) + 1
    setLines([...lines, { lineNo: nextLineNo, accountId: "", debit: 0, credit: 0, memo: "" }])
  }

  const removeLine = (lineNo: number) => {
    if (lines.length > 2) {
      setLines(lines.filter((line) => line.lineNo !== lineNo))
    }
  }

  const updateLine = (lineNo: number, field: keyof JournalLineFormData, value: any) => {
    setLines(
      lines.map((line) =>
        line.lineNo === lineNo ? { ...line, [field]: value } : line
      )
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const data: JournalFormData = {
      journalNo,
      description,
      postingDate,
      lines: lines.map((line) => ({
        ...line,
        debit: Number(line.debit) || 0,
        credit: Number(line.credit) || 0,
      })),
    }

    const result = isEditing
      ? await updateJournalEntry(journalEntry.id, data)
      : await createJournalEntry(data)

    setLoading(false)

    if (result.success) {
      onOpenChange(false)
    } else {
      setError(result.error || "An error occurred")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit" : "Create"} Journal Entry</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Edit this draft journal entry. Posted entries cannot be edited."
              : "Create a new journal entry. Ensure debits equal credits."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Header Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="journalNo">Journal Number</Label>
                <Input
                  id="journalNo"
                  value={journalNo}
                  onChange={(e) => setJournalNo(e.target.value)}
                  disabled={isEditing}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postingDate">Posting Date</Label>
                <Input
                  id="postingDate"
                  type="date"
                  value={postingDate}
                  onChange={(e) => setPostingDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this journal entry"
                rows={2}
              />
            </div>

            {/* Lines */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Journal Lines</Label>
                <Button type="button" variant="outline" size="sm" onClick={addLine}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Line
                </Button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-2 text-sm font-medium w-12">#</th>
                      <th className="text-left p-2 text-sm font-medium">Account</th>
                      <th className="text-left p-2 text-sm font-medium">Memo</th>
                      <th className="text-right p-2 text-sm font-medium w-32">Debit</th>
                      <th className="text-right p-2 text-sm font-medium w-32">Credit</th>
                      <th className="w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line) => (
                      <tr key={line.lineNo} className="border-t">
                        <td className="p-2 text-sm text-muted-foreground">{line.lineNo}</td>
                        <td className="p-2">
                          <Select
                            value={line.accountId}
                            onValueChange={(value) => updateLine(line.lineNo, "accountId", value)}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Select account" />
                            </SelectTrigger>
                            <SelectContent>
                              {accounts.map((account) => (
                                <SelectItem key={account.id} value={account.id}>
                                  {account.number} - {account.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-2">
                          <Input
                            className="h-8"
                            value={line.memo || ""}
                            onChange={(e) => updateLine(line.lineNo, "memo", e.target.value)}
                            placeholder="Line memo"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            className="h-8 text-right"
                            type="number"
                            step="0.01"
                            min="0"
                            value={line.debit || ""}
                            onChange={(e) => updateLine(line.lineNo, "debit", e.target.value)}
                            disabled={Number(line.credit) > 0}
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            className="h-8 text-right"
                            type="number"
                            step="0.01"
                            min="0"
                            value={line.credit || ""}
                            onChange={(e) => updateLine(line.lineNo, "credit", e.target.value)}
                            disabled={Number(line.debit) > 0}
                          />
                        </td>
                        <td className="p-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLine(line.lineNo)}
                            disabled={lines.length <= 2}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {/* Totals Row */}
                    <tr className="border-t bg-muted/30 font-medium">
                      <td colSpan={3} className="p-2 text-right">
                        Totals:
                      </td>
                      <td className="p-2 text-right tabular-nums">
                        ${totalDebits.toFixed(2)}
                      </td>
                      <td className="p-2 text-right tabular-nums">
                        ${totalCredits.toFixed(2)}
                      </td>
                      <td></td>
                    </tr>
                    {!isBalanced && (
                      <tr className="border-t bg-destructive/10">
                        <td colSpan={3} className="p-2 text-right text-sm text-destructive">
                          Out of balance:
                        </td>
                        <td colSpan={3} className="p-2 text-right text-sm text-destructive tabular-nums">
                          ${difference.toFixed(2)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
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
            <Button type="submit" disabled={loading || !isBalanced}>
              {loading ? "Saving..." : isEditing ? "Update" : "Create"} Journal Entry
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
