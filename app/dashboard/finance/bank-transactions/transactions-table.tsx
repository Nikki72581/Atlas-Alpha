"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable, Td, Th, Tr } from "@/components/atlas/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ImportDialog } from "./import-dialog"
import { CategorizeDialog } from "./categorize-dialog"
import {
  deleteTransaction,
  excludeTransaction,
  bulkDeleteTransactions,
} from "./actions"
import {
  Search,
  Filter,
  Upload,
  Tag,
  MoreHorizontal,
  Trash2,
  EyeOff,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
} from "lucide-react"
import { format } from "date-fns"
import { useRouter } from "next/navigation"

type Transaction = {
  id: string
  transactionDate: Date
  description: string
  amount: number
  transactionType: "DEBIT" | "CREDIT"
  status: "PENDING" | "CATEGORIZED" | "RECONCILED" | "EXCLUDED"
  memo: string | null
  bankAccount: {
    id: string
    name: string
  }
  categoryAccount: {
    id: string
    number: string
    name: string
  } | null
  categoryRule: {
    id: string
    name: string
  } | null
  journalEntry: {
    id: string
    journalNo: string
    status: "DRAFT" | "POSTED"
  } | null
}

type BankAccount = {
  id: string
  name: string
}

type TransactionsTableProps = {
  transactions: Transaction[]
  bankAccounts: BankAccount[]
}

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  CATEGORIZED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  RECONCILED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  EXCLUDED: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
}

const statusLabels: Record<string, string> = {
  PENDING: "Uncategorized",
  CATEGORIZED: "Categorized",
  RECONCILED: "Reconciled",
  EXCLUDED: "Excluded",
}

export function TransactionsTable({ transactions, bankAccounts }: TransactionsTableProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [accountFilter, setAccountFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [categorizeDialogOpen, setCategorizeDialogOpen] = useState(false)
  const [transactionsToCategorize, setTransactionsToCategorize] = useState<Transaction[]>([])

  const filteredTransactions = useMemo(() => {
    return transactions.filter((txn) => {
      const matchesSearch = txn.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesAccount = accountFilter === "all" || txn.bankAccount.id === accountFilter
      const matchesStatus = statusFilter === "all" || txn.status === statusFilter
      const matchesType = typeFilter === "all" || txn.transactionType === typeFilter
      return matchesSearch && matchesAccount && matchesStatus && matchesType
    })
  }, [transactions, searchQuery, accountFilter, statusFilter, typeFilter])

  const selectedTransactions = filteredTransactions.filter((t) => selectedIds.has(t.id))
  const allSelected = filteredTransactions.length > 0 && selectedIds.size === filteredTransactions.length
  const someSelected = selectedIds.size > 0 && !allSelected

  const uncategorizedCount = transactions.filter((t) => t.status === "PENDING").length

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredTransactions.map((t) => t.id)))
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

  function handleCategorize(txn: Transaction) {
    setTransactionsToCategorize([txn])
    setCategorizeDialogOpen(true)
  }

  function handleBulkCategorize() {
    setTransactionsToCategorize(selectedTransactions)
    setCategorizeDialogOpen(true)
  }

  async function handleExclude(txn: Transaction) {
    if (confirm(`Exclude "${txn.description}" from reconciliation?`)) {
      const result = await excludeTransaction(txn.id)
      if (!result.success) {
        alert(result.error)
      }
    }
  }

  async function handleDelete(txn: Transaction) {
    if (confirm(`Delete "${txn.description}"? This cannot be undone.`)) {
      const result = await deleteTransaction(txn.id)
      if (!result.success) {
        alert(result.error)
      }
    }
  }

  async function handleBulkDelete() {
    if (confirm(`Delete ${selectedIds.size} transactions? This cannot be undone.`)) {
      const result = await bulkDeleteTransactions(Array.from(selectedIds))
      if (result.success) {
        setSelectedIds(new Set())
      } else {
        alert(result.error)
      }
    }
  }

  function handleImportComplete() {
    router.refresh()
  }

  function handleCategorizeComplete() {
    setSelectedIds(new Set())
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />

            <Select value={accountFilter} onValueChange={setAccountFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Accounts</SelectItem>
                {bankAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Uncategorized</SelectItem>
                <SelectItem value="CATEGORIZED">Categorized</SelectItem>
                <SelectItem value="RECONCILED">Reconciled</SelectItem>
                <SelectItem value="EXCLUDED">Excluded</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-28">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="DEBIT">Debits</SelectItem>
                <SelectItem value="CREDIT">Credits</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={() => setImportDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
        </div>
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
          <span className="text-sm text-muted-foreground">
            {selectedIds.size} selected
          </span>
          <Button variant="outline" size="sm" onClick={handleBulkCategorize}>
            <Tag className="mr-2 h-4 w-4" />
            Categorize
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

      {/* Summary stats */}
      {uncategorizedCount > 0 && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <Receipt className="h-4 w-4 text-amber-600" />
          <span className="text-sm text-amber-800 dark:text-amber-200">
            <strong>{uncategorizedCount}</strong> uncategorized transaction{uncategorizedCount !== 1 && "s"}
          </span>
          <Button
            variant="link"
            size="sm"
            className="text-amber-700 p-0 h-auto"
            onClick={() => setStatusFilter("PENDING")}
          >
            Show all
          </Button>
        </div>
      )}

      {/* Table */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Transactions
            {filteredTransactions.length !== transactions.length && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({filteredTransactions.length} of {transactions.length})
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
                <Th>Date</Th>
                <Th>Description</Th>
                <Th>Account</Th>
                <Th className="text-right">Amount</Th>
                <Th>Category</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((txn) => (
                <Tr
                  key={txn.id}
                  className={selectedIds.has(txn.id) ? "bg-muted/50" : ""}
                >
                  <Td>
                    <Checkbox
                      checked={selectedIds.has(txn.id)}
                      onCheckedChange={() => toggleSelect(txn.id)}
                      aria-label={`Select ${txn.description}`}
                    />
                  </Td>
                  <Td className="text-xs whitespace-nowrap">
                    {format(new Date(txn.transactionDate), "MMM d, yyyy")}
                  </Td>
                  <Td className="max-w-[250px]">
                    <div className="truncate font-medium text-sm" title={txn.description}>
                      {txn.description}
                    </div>
                    {txn.categoryRule && (
                      <div className="text-xs text-muted-foreground">
                        Rule: {txn.categoryRule.name}
                      </div>
                    )}
                  </Td>
                  <Td className="text-xs text-muted-foreground">
                    {txn.bankAccount.name}
                  </Td>
                  <Td className="text-right font-mono text-sm">
                    <div className="flex items-center justify-end gap-1">
                      {txn.transactionType === "DEBIT" ? (
                        <ArrowUpRight className="h-3 w-3 text-red-500" />
                      ) : (
                        <ArrowDownLeft className="h-3 w-3 text-green-500" />
                      )}
                      <span className={txn.transactionType === "DEBIT" ? "text-red-600" : "text-green-600"}>
                        ${Number(txn.amount).toFixed(2)}
                      </span>
                    </div>
                  </Td>
                  <Td className="text-xs">
                    {txn.categoryAccount ? (
                      <div>
                        <span className="text-muted-foreground">
                          {txn.categoryAccount.number} - {txn.categoryAccount.name}
                        </span>
                        {txn.journalEntry && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-muted-foreground/70">{txn.journalEntry.journalNo}</span>
                            <Badge
                              variant="secondary"
                              className={`text-[10px] px-1 py-0 leading-tight ${
                                txn.journalEntry.status === "POSTED"
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                              }`}
                            >
                              {txn.journalEntry.status}
                            </Badge>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </Td>
                  <Td>
                    <Badge variant="secondary" className={statusColors[txn.status]}>
                      {statusLabels[txn.status]}
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
                        <DropdownMenuItem onClick={() => handleCategorize(txn)}>
                          <Tag className="mr-2 h-4 w-4" />
                          Categorize
                        </DropdownMenuItem>
                        {txn.status !== "EXCLUDED" && (
                          <DropdownMenuItem onClick={() => handleExclude(txn)}>
                            <EyeOff className="mr-2 h-4 w-4" />
                            Exclude
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(txn)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </Td>
                </Tr>
              ))}
              {filteredTransactions.length === 0 && (
                <Tr>
                  <Td className="text-center text-muted-foreground" colSpan={8}>
                    {searchQuery || accountFilter !== "all" || statusFilter !== "all" || typeFilter !== "all"
                      ? "No transactions match your filters."
                      : "No transactions yet. Import a CSV file to get started."}
                  </Td>
                </Tr>
              )}
            </tbody>
          </DataTable>
        </CardContent>
      </Card>

      <ImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImportComplete={handleImportComplete}
      />

      <CategorizeDialog
        open={categorizeDialogOpen}
        onOpenChange={setCategorizeDialogOpen}
        transactions={transactionsToCategorize}
        onComplete={handleCategorizeComplete}
      />
    </div>
  )
}
