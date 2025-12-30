"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  EnhancedDataTable,
  BulkActionBar,
  useTableSelection,
  type ColumnDef,
  type BulkAction,
} from "@/components/atlas/enhanced-data-table"
import {
  QuickPreviewPanel,
  useQuickPreview,
  createPreviewSection,
  PreviewBadge,
  type PreviewAction,
} from "@/components/atlas/quick-preview-panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AccountDialog } from "./account-dialog"
import { deleteAccount, toggleAccountStatus } from "./actions"
import {
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Eye,
} from "lucide-react"

type Account = {
  id: string
  number: string
  name: string
  type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE"
  isActive: boolean
}

type AccountsTableWithPreviewProps = {
  accounts: Account[]
}

export function AccountsTableWithPreview({ accounts }: AccountsTableWithPreviewProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)

  const { selectedIds, setSelectedIds, clearSelection, selectedCount } = useTableSelection()
  const { isOpen, selectedItem, openPreview, setIsOpen } = useQuickPreview<Account>()

  // Filter accounts
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

  // Get account type description
  const getTypeDescription = (type: string) => {
    const descriptions = {
      ASSET: "Resources owned by the company",
      LIABILITY: "Obligations owed to others",
      EQUITY: "Owner's stake in the company",
      REVENUE: "Income from business operations",
      EXPENSE: "Costs incurred in operations",
    }
    return descriptions[type as keyof typeof descriptions] || ""
  }

  // Define columns
  const columns: ColumnDef<Account>[] = [
    {
      id: "number",
      header: "Number",
      accessorKey: "number",
      sortable: true,
      className: "font-mono text-xs",
    },
    {
      id: "name",
      header: "Name",
      accessorKey: "name",
      sortable: true,
      className: "font-medium",
    },
    {
      id: "type",
      header: "Type",
      accessorKey: "type",
      sortable: true,
      className: "text-muted-foreground",
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "isActive",
      sortable: true,
      cell: (row) => (
        <Badge variant={row.isActive ? "default" : "secondary"}>
          {row.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      id: "preview",
      header: "",
      sortable: false,
      className: "w-12",
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => openPreview(row)}
          className="h-8 w-8 p-0"
          title="Quick preview"
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      sortable: false,
      headerClassName: "text-right",
      className: "text-right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(row)}
            className="h-8 w-8 p-0"
            title="Edit account"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleStatus(row)}
            className="h-8 w-8 p-0"
            title={row.isActive ? "Deactivate account" : "Activate account"}
          >
            {row.isActive ? (
              <ToggleRight className="h-4 w-4" />
            ) : (
              <ToggleLeft className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row)}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            title="Delete account"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  // Bulk actions
  const bulkActions: BulkAction[] = [
    {
      label: "Activate",
      icon: <CheckCircle className="h-4 w-4" />,
      variant: "outline",
      onClick: async () => {
        if (confirm(`Are you sure you want to activate ${selectedCount} account(s)?`)) {
          for (const id of selectedIds) {
            const account = accounts.find((a) => a.id === id)
            if (account && !account.isActive) {
              await toggleAccountStatus(id)
            }
          }
          clearSelection()
        }
      },
    },
    {
      label: "Deactivate",
      icon: <XCircle className="h-4 w-4" />,
      variant: "outline",
      onClick: async () => {
        if (confirm(`Are you sure you want to deactivate ${selectedCount} account(s)?`)) {
          for (const id of selectedIds) {
            const account = accounts.find((a) => a.id === id)
            if (account && account.isActive) {
              await toggleAccountStatus(id)
            }
          }
          clearSelection()
        }
      },
    },
    {
      label: "Delete",
      icon: <Trash2 className="h-4 w-4" />,
      variant: "destructive",
      onClick: async () => {
        if (
          confirm(
            `Are you sure you want to delete ${selectedCount} account(s)? This action cannot be undone.`
          )
        ) {
          const errors: string[] = []
          for (const id of selectedIds) {
            const result = await deleteAccount(id)
            if (!result.success && result.error) {
              errors.push(result.error)
            }
          }
          if (errors.length > 0) {
            alert(`Some accounts could not be deleted:\n${errors.join("\n")}`)
          }
          clearSelection()
        }
      },
    },
  ]

  // Preview actions
  const previewActions: PreviewAction[] = selectedItem
    ? [
        {
          label: "Edit",
          icon: <Pencil className="h-4 w-4" />,
          variant: "outline",
          onClick: () => {
            handleEdit(selectedItem)
            setIsOpen(false)
          },
        },
        {
          label: selectedItem.isActive ? "Deactivate" : "Activate",
          icon: selectedItem.isActive ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />,
          variant: "outline",
          onClick: async () => {
            await handleToggleStatus(selectedItem)
            setIsOpen(false)
          },
        },
        {
          label: "Delete",
          icon: <Trash2 className="h-4 w-4" />,
          variant: "destructive",
          onClick: async () => {
            await handleDelete(selectedItem)
            setIsOpen(false)
          },
        },
      ]
    : []

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
          <BulkActionBar
            selectedCount={selectedCount}
            totalCount={filteredAccounts.length}
            actions={bulkActions}
            onClearSelection={clearSelection}
          />
          <EnhancedDataTable
            data={filteredAccounts}
            columns={columns}
            getRowId={(row) => row.id}
            onSelectionChange={setSelectedIds}
            enableSelection={true}
            enableSorting={true}
            emptyMessage={
              searchQuery || typeFilter !== "all" || statusFilter !== "all"
                ? "No accounts match your filters."
                : "No accounts yet."
            }
          />
        </CardContent>
      </Card>

      <QuickPreviewPanel
        open={isOpen}
        onOpenChange={setIsOpen}
        data={selectedItem}
        title={(account) => `Account ${account.number}`}
        description={(account) => account.name}
        sections={(account) => [
          createPreviewSection("Account Details", [
            {
              label: "Account Number",
              value: <span className="font-mono text-sm">{account.number}</span>,
            },
            {
              label: "Account Name",
              value: <span className="font-semibold">{account.name}</span>,
              fullWidth: true,
            },
            {
              label: "Account Type",
              value: account.type,
            },
            {
              label: "Status",
              value: (
                <PreviewBadge variant={account.isActive ? "success" : "error"}>
                  {account.isActive ? "Active" : "Inactive"}
                </PreviewBadge>
              ),
            },
          ]),
          createPreviewSection("Type Information", [
            {
              label: "Description",
              value: (
                <span className="text-muted-foreground text-sm">
                  {getTypeDescription(account.type)}
                </span>
              ),
              fullWidth: true,
            },
            {
              label: "Category",
              value: account.type,
              fullWidth: true,
            },
          ]),
        ]}
        actions={previewActions}
      />

      <AccountDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        account={selectedAccount}
      />
    </div>
  )
}
