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
import { createPeriod, updatePeriod } from "./actions"
import { Period } from "@prisma/client"

type PeriodDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  period?: Period
}

export function PeriodDialog({ open, onOpenChange, period }: PeriodDialogProps) {
  const isEditing = !!period
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [fiscalYear, setFiscalYear] = useState("")
  const [periodNumber, setPeriodNumber] = useState("")

  // Initialize form when dialog opens or period changes
  useEffect(() => {
    if (open) {
      if (period) {
        // Editing existing period
        setName(period.name)
        setStartDate(new Date(period.startDate).toISOString().split("T")[0])
        setEndDate(new Date(period.endDate).toISOString().split("T")[0])
        setFiscalYear(period.fiscalYear.toString())
        setPeriodNumber(period.periodNumber.toString())
      } else {
        // Creating new period - set defaults
        const currentYear = new Date().getFullYear()
        setName("")
        setStartDate("")
        setEndDate("")
        setFiscalYear(currentYear.toString())
        setPeriodNumber("1")
      }
      setError(null)
    }
  }, [open, period])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const data = {
      name,
      startDate,
      endDate,
      fiscalYear: parseInt(fiscalYear),
      periodNumber: parseInt(periodNumber),
    }

    const result = isEditing
      ? await updatePeriod(period.id, data)
      : await createPeriod(data)

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
          <DialogTitle>{isEditing ? "Edit" : "Create"} Accounting Period</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update this accounting period. Only open periods can be edited."
              : "Create a new accounting period for financial reporting and close processes."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Period Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., January 2025"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fiscalYear">Fiscal Year</Label>
                <Input
                  id="fiscalYear"
                  type="number"
                  value={fiscalYear}
                  onChange={(e) => setFiscalYear(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="periodNumber">Period Number</Label>
                <Input
                  id="periodNumber"
                  type="number"
                  min="1"
                  max="12"
                  value={periodNumber}
                  onChange={(e) => setPeriodNumber(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
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
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEditing ? "Update" : "Create"} Period
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
