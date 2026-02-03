"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { categorizeTransaction, bulkCategorize, getCategoryAccounts } from "./actions"
import { createRuleFromTransaction } from "./category-actions"
import { suggestPattern } from "@/lib/category-matcher"
import { Tag, Wand2, Loader2 } from "lucide-react"

type Transaction = {
  id: string
  description: string
  amount: number
  transactionType: "DEBIT" | "CREDIT"
  transactionDate: Date
}

type CategoryAccount = {
  id: string
  number: string
  name: string
  type: string
}

type CategorizeDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  transactions: Transaction[]
  onComplete?: () => void
}

export function CategorizeDialog({
  open,
  onOpenChange,
  transactions,
  onComplete,
}: CategorizeDialogProps) {
  const [categoryAccounts, setCategoryAccounts] = useState<CategoryAccount[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<string>("")
  const [createRule, setCreateRule] = useState(false)
  const [rulePattern, setRulePattern] = useState("")
  const [rulePatternType, setRulePatternType] = useState<"contains" | "startsWith" | "regex">("contains")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingAccounts, setLoadingAccounts] = useState(true)

  const isBulk = transactions.length > 1
  const transaction = transactions[0]

  useEffect(() => {
    if (open) {
      loadCategoryAccounts()
      setSelectedAccountId("")
      setCreateRule(false)
      setError(null)

      // Suggest pattern for single transaction
      if (!isBulk && transaction) {
        const suggestion = suggestPattern(transaction.description)
        setRulePattern(suggestion.pattern)
        setRulePatternType(suggestion.patternType)
      }
    }
  }, [open, transaction, isBulk])

  async function loadCategoryAccounts() {
    setLoadingAccounts(true)
    const result = await getCategoryAccounts()
    if (result.success) {
      setCategoryAccounts(result.accounts)
    }
    setLoadingAccounts(false)
  }

  // Filter accounts based on transaction type
  const relevantAccounts = categoryAccounts.filter((account) => {
    if (isBulk) return true // Show all for bulk
    return transaction?.transactionType === "DEBIT"
      ? account.type === "EXPENSE"
      : account.type === "REVENUE"
  })

  const otherAccounts = categoryAccounts.filter((account) => {
    if (isBulk) return false
    return transaction?.transactionType === "DEBIT"
      ? account.type === "REVENUE"
      : account.type === "EXPENSE"
  })

  async function handleSubmit() {
    if (!selectedAccountId) {
      setError("Please select a category")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Categorize transaction(s)
      const result = isBulk
        ? await bulkCategorize(
            transactions.map((t) => t.id),
            selectedAccountId
          )
        : await categorizeTransaction(transaction.id, selectedAccountId)

      if (!result.success) {
        setError(result.error || "Failed to categorize")
        setIsSubmitting(false)
        return
      }

      // Create rule if requested (only for single transaction)
      if (!isBulk && createRule && rulePattern) {
        const ruleResult = await createRuleFromTransaction(
          transaction.description,
          selectedAccountId,
          rulePattern,
          rulePatternType
        )

        if (!ruleResult.success && !ruleResult.existingRuleId) {
          // Non-fatal: rule creation failed but categorization succeeded
          console.warn("Rule creation failed:", ruleResult.error)
        }
      }

      onComplete?.()
      onOpenChange(false)
    } catch {
      setError("An error occurred")
    }

    setIsSubmitting(false)
  }

  function handleClose() {
    if (!isSubmitting) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            {isBulk ? `Categorize ${transactions.length} Transactions` : "Categorize Transaction"}
          </DialogTitle>
          <DialogDescription>
            {isBulk
              ? "Select a category to apply to all selected transactions."
              : "Assign a category and optionally create a rule for similar transactions."}
          </DialogDescription>
        </DialogHeader>

        {/* Transaction details (single only) */}
        {!isBulk && transaction && (
          <div className="rounded-lg bg-muted/50 p-3 space-y-1">
            <p className="text-sm font-medium truncate">{transaction.description}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge
                variant="secondary"
                className={
                  transaction.transactionType === "DEBIT"
                    ? "bg-red-100 text-red-800"
                    : "bg-green-100 text-green-800"
                }
              >
                {transaction.transactionType}
              </Badge>
              <span>${transaction.amount.toFixed(2)}</span>
              <span>{new Date(transaction.transactionDate).toLocaleDateString()}</span>
            </div>
          </div>
        )}

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Category</Label>
            <Tabs defaultValue="suggested" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="suggested" className="flex-1">
                  {transaction?.transactionType === "DEBIT" ? "Expenses" : "Revenue"}
                </TabsTrigger>
                <TabsTrigger value="other" className="flex-1">
                  Other
                </TabsTrigger>
              </TabsList>
              <TabsContent value="suggested" className="mt-2">
                <Select
                  value={selectedAccountId}
                  onValueChange={setSelectedAccountId}
                  disabled={loadingAccounts}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingAccounts ? "Loading..." : "Select category"} />
                  </SelectTrigger>
                  <SelectContent>
                    {relevantAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        <span className="font-mono text-xs mr-2">{account.number}</span>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TabsContent>
              <TabsContent value="other" className="mt-2">
                <Select
                  value={selectedAccountId}
                  onValueChange={setSelectedAccountId}
                  disabled={loadingAccounts}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingAccounts ? "Loading..." : "Select category"} />
                  </SelectTrigger>
                  <SelectContent>
                    {otherAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        <span className="font-mono text-xs mr-2">{account.number}</span>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TabsContent>
            </Tabs>
          </div>

          {/* Create rule option (single transaction only) */}
          {!isBulk && (
            <div className="space-y-4 pt-2 border-t">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Wand2 className="h-4 w-4" />
                    Create Auto-Categorization Rule
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically categorize similar transactions in the future
                  </p>
                </div>
                <Switch checked={createRule} onCheckedChange={setCreateRule} />
              </div>

              {createRule && (
                <div className="space-y-3 pl-6">
                  <div className="space-y-2">
                    <Label htmlFor="pattern">Pattern to Match</Label>
                    <Input
                      id="pattern"
                      value={rulePattern}
                      onChange={(e) => setRulePattern(e.target.value)}
                      placeholder="e.g., STARBUCKS"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pattern-type">Match Type</Label>
                    <Select
                      value={rulePatternType}
                      onValueChange={(v) => setRulePatternType(v as typeof rulePatternType)}
                    >
                      <SelectTrigger id="pattern-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contains">Contains</SelectItem>
                        <SelectItem value="startsWith">Starts With</SelectItem>
                        <SelectItem value="regex">Regex</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !selectedAccountId}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                {isBulk ? `Categorize ${transactions.length}` : "Categorize"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
