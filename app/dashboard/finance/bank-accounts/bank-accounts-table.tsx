"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable, Td, Th, Tr } from "@/components/atlas/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { BankAccountDialog } from "./bank-account-dialog"
import { deleteBankAccount, toggleBankAccountStatus } from "./actions"
import { Pencil, Trash2, ToggleLeft, ToggleRight, Search, Filter, Building2 } from "lucide-react"

type BankAccount = {
  id: string
  name: string
  bankName: string | null
  accountNumber: string | null
  accountType: "CHECKING" | "SAVINGS" | "MONEY_MARKET" | "CREDIT_CARD"
  glAccountId: string
  currency: string
  isActive: boolean
  glAccount: {
    number: string
    name: string
  }
  _count: {
    transactions: number
  }
  ledgerBalance: number
}

type BankAccountsTableProps = {
  bankAccounts: BankAccount[]
}

const accountTypeLabels: Record<string, string> = {
  CHECKING: "Checking",
  SAVINGS: "Savings",
  MONEY_MARKET: "Money Market",
  CREDIT_CARD: "Credit Card",
}

const accountTypeColors: Record<string, string> = {
  CHECKING: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  SAVINGS: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  MONEY_MARKET: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  CREDIT_CARD: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
}

export function BankAccountsTable({ bankAccounts }: BankAccountsTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null)

  const filteredAccounts = useMemo(() => {
    return bankAccounts.filter((account) => {
      const matchesSearch =
        account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (account.bankName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        (account.accountNumber?.includes(searchQuery) ?? false)

      const matchesType = typeFilter === "all" || account.accountType === typeFilter

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && account.isActive) ||
        (statusFilter === "inactive" && !account.isActive)

      return matchesSearch && matchesType && matchesStatus
    })
  }, [bankAccounts, searchQuery, typeFilter, statusFilter])

  function handleEdit(account: BankAccount) {
    setSelectedAccount(account)
    setDialogOpen(true)
  }

  function handleNew() {
    setSelectedAccount(null)
    setDialogOpen(true)
  }

  async function handleDelete(account: BankAccount) {
    if (
      confirm(
        `Are you sure you want to delete "${account.name}"? This action cannot be undone.`
      )
    ) {
      const result = await deleteBankAccount(account.id)
      if (!result.success) {
        alert(result.error)
      }
    }
  }

  async function handleToggleStatus(account: BankAccount) {
    const action = account.isActive ? "deactivate" : "activate"
    if (
      confirm(
        `Are you sure you want to ${action} "${account.name}"?`
      )
    ) {
      const result = await toggleBankAccountStatus(account.id)
      if (!result.success) {
        alert(result.error)
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search accounts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="CHECKING">Checking</SelectItem>
                <SelectItem value="SAVINGS">Savings</SelectItem>
                <SelectItem value="MONEY_MARKET">Money Market</SelectItem>
                <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleNew}>New Bank Account</Button>
        </div>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Bank Accounts
            {filteredAccounts.length !== bankAccounts.length && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({filteredAccounts.length} of {bankAccounts.length})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable>
            <thead>
              <tr>
                <Th>Account Name</Th>
                <Th>Bank</Th>
                <Th>Type</Th>
                <Th>GL Account</Th>
                <Th className="text-right">Ledger Balance</Th>
                <Th className="text-right">Transactions</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map((account) => (
                <Tr key={account.id}>
                  <Td className="font-medium">
                    <div>
                      {account.name}
                      {account.accountNumber && (
                        <span className="text-xs text-muted-foreground ml-2">
                          ****{account.accountNumber}
                        </span>
                      )}
                    </div>
                  </Td>
                  <Td className="text-muted-foreground">
                    {account.bankName || "-"}
                  </Td>
                  <Td>
                    <Badge className={accountTypeColors[account.accountType]} variant="secondary">
                      {accountTypeLabels[account.accountType]}
                    </Badge>
                  </Td>
                  <Td className="font-mono text-xs">
                    {account.glAccount.number} - {account.glAccount.name}
                  </Td>
                  <Td className="text-right font-mono text-sm">
                    <span className={account.ledgerBalance < 0 ? "text-red-600" : ""}>
                      ${account.ledgerBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </Td>
                  <Td className="text-right text-muted-foreground">
                    {account._count.transactions.toLocaleString()}
                  </Td>
                  <Td>
                    <span
                      className={
                        account.isActive
                          ? "text-green-600"
                          : "text-muted-foreground"
                      }
                    >
                      {account.isActive ? "Active" : "Inactive"}
                    </span>
                  </Td>
                  <Td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(account)}
                        className="h-8 w-8 p-0"
                        title="Edit account"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(account)}
                        className="h-8 w-8 p-0"
                        title={
                          account.isActive
                            ? "Deactivate account"
                            : "Activate account"
                        }
                      >
                        {account.isActive ? (
                          <ToggleRight className="h-4 w-4" />
                        ) : (
                          <ToggleLeft className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(account)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        title="Delete account"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Td>
                </Tr>
              ))}
              {filteredAccounts.length === 0 && (
                <Tr>
                  <Td className="text-center text-muted-foreground" colSpan={8}>
                    {searchQuery || typeFilter !== "all" || statusFilter !== "all"
                      ? "No bank accounts match your filters."
                      : "No bank accounts yet. Create one to start importing transactions."}
                  </Td>
                </Tr>
              )}
            </tbody>
          </DataTable>
        </CardContent>
      </Card>

      <BankAccountDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        bankAccount={selectedAccount}
      />
    </div>
  )
}
