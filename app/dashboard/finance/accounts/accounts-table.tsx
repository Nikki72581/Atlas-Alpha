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
import { AccountDialog } from "./account-dialog"
import { deleteAccount, toggleAccountStatus } from "./actions"
import { Pencil, Trash2, ToggleLeft, ToggleRight, Search, Filter } from "lucide-react"

type Account = {
  id: string
  number: string
  name: string
  type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE"
  isActive: boolean
}

type AccountsTableProps = {
  accounts: Account[]
}

export function AccountsTable({ accounts }: AccountsTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)

  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => {
      const matchesSearch =
        account.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.name.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesType = typeFilter === "all" || account.type === typeFilter

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && account.isActive) ||
        (statusFilter === "inactive" && !account.isActive)

      return matchesSearch && matchesType && matchesStatus
    })
  }, [accounts, searchQuery, typeFilter, statusFilter])

  function handleEdit(account: Account) {
    setSelectedAccount(account)
    setDialogOpen(true)
  }

  function handleNew() {
    setSelectedAccount(null)
    setDialogOpen(true)
  }

  async function handleDelete(account: Account) {
    if (
      confirm(
        `Are you sure you want to delete account ${account.number} - ${account.name}? This action cannot be undone.`
      )
    ) {
      const result = await deleteAccount(account.id)
      if (!result.success) {
        alert(result.error)
      }
    }
  }

  async function handleToggleStatus(account: Account) {
    const action = account.isActive ? "deactivate" : "activate"
    if (
      confirm(
        `Are you sure you want to ${action} account ${account.number} - ${account.name}?`
      )
    ) {
      const result = await toggleAccountStatus(account.id)
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
            placeholder="Search by number or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-35">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="ASSET">Asset</SelectItem>
                <SelectItem value="LIABILITY">Liability</SelectItem>
                <SelectItem value="EQUITY">Equity</SelectItem>
                <SelectItem value="REVENUE">Revenue</SelectItem>
                <SelectItem value="EXPENSE">Expense</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-35">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleNew}>New Account</Button>
        </div>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">
            Accounts
            {filteredAccounts.length !== accounts.length && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({filteredAccounts.length} of {accounts.length})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable>
            <thead>
              <tr>
                <Th>Number</Th>
                <Th>Name</Th>
                <Th>Type</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map((account) => (
                <Tr key={account.id}>
                  <Td className="font-mono text-xs">{account.number}</Td>
                  <Td className="font-medium">{account.name}</Td>
                  <Td className="text-muted-foreground">{account.type}</Td>
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
                  <Td className="text-center text-muted-foreground" colSpan={5}>
                    {searchQuery || typeFilter !== "all" || statusFilter !== "all"
                      ? "No accounts match your filters."
                      : "No accounts yet."}
                  </Td>
                </Tr>
              )}
            </tbody>
          </DataTable>
        </CardContent>
      </Card>

      <AccountDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        account={selectedAccount}
      />
    </div>
  )
}
