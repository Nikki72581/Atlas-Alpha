"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"
import { Period } from "@prisma/client"

type TrialBalanceFiltersProps = {
  periods: Period[]
  selectedPeriodId?: string
}

export function TrialBalanceFilters({ periods, selectedPeriodId }: TrialBalanceFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handlePeriodChange = (periodId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (periodId === "all") {
      params.delete("periodId")
      params.delete("asOfDate")
    } else {
      params.set("periodId", periodId)
      params.delete("asOfDate")
    }
    router.push(`?${params.toString()}`)
  }

  const handleAsOfDateChange = (date: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (date) {
      params.set("asOfDate", date)
      params.delete("periodId")
    } else {
      params.delete("asOfDate")
    }
    router.push(`?${params.toString()}`)
  }

  const clearFilters = () => {
    router.push("/dashboard/finance/reports/trial-balance")
  }

  const hasFilters = selectedPeriodId || searchParams.get("asOfDate")

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="period">Period</Label>
            <Select
              value={selectedPeriodId || "all"}
              onValueChange={handlePeriodChange}
            >
              <SelectTrigger id="period">
                <SelectValue placeholder="All periods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All periods</SelectItem>
                {periods.map((period) => (
                  <SelectItem key={period.id} value={period.id}>
                    {period.name} (FY {period.fiscalYear})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 space-y-2">
            <Label htmlFor="asOfDate">As of Date</Label>
            <Input
              id="asOfDate"
              type="date"
              value={searchParams.get("asOfDate") || ""}
              onChange={(e) => handleAsOfDateChange(e.target.value)}
              disabled={!!selectedPeriodId}
            />
          </div>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
