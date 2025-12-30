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
import { CustomerDialog } from "./customer-dialog"
import { deleteCustomer, toggleCustomerStatus } from "./actions"
import {
  Pencil,
  Trash2,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Eye,
  Mail,
  Phone,
} from "lucide-react"

type Customer = {
  id: string
  number: string
  name: string
  email: string | null
  phone: string | null
  termsNetDays: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

type CustomersTableProps = {
  customers: Customer[]
}

export function CustomersTable({ customers }: CustomersTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  const { selectedIds, setSelectedIds, clearSelection, selectedCount } = useTableSelection()
  const { isOpen, selectedItem, openPreview, setIsOpen } = useQuickPreview<Customer>()

  // Filter customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const matchesSearch =
        customer.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && customer.isActive) ||
        (statusFilter === "inactive" && !customer.isActive)

      return matchesSearch && matchesStatus
    })
  }, [customers, searchQuery, statusFilter])

  // Define columns
  const columns: ColumnDef<Customer>[] = [
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
      id: "email",
      header: "Email",
      accessorKey: "email",
      sortable: true,
      className: "text-muted-foreground",
      cell: (row) => row.email || "—",
    },
    {
      id: "phone",
      header: "Phone",
      accessorKey: "phone",
      sortable: true,
      className: "text-muted-foreground",
      cell: (row) => row.phone || "—",
    },
    {
      id: "terms",
      header: "Terms",
      accessorKey: "termsNetDays",
      sortable: true,
      cell: (row) => `Net ${row.termsNetDays}`,
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
            title="Edit customer"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row)}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            title="Delete customer"
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
        if (confirm(`Activate ${selectedCount} customer(s)?`)) {
          for (const id of selectedIds) {
            const customer = customers.find((c) => c.id === id)
            if (customer && !customer.isActive) {
              await toggleCustomerStatus(id)
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
        if (confirm(`Deactivate ${selectedCount} customer(s)?`)) {
          for (const id of selectedIds) {
            const customer = customers.find((c) => c.id === id)
            if (customer && customer.isActive) {
              await toggleCustomerStatus(id)
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
            `Delete ${selectedCount} customer(s)? This action cannot be undone.`
          )
        ) {
          const errors: string[] = []
          for (const id of selectedIds) {
            const result = await deleteCustomer(id)
            if (!result.success && result.error) {
              errors.push(result.error)
            }
          }
          if (errors.length > 0) {
            alert(`Some customers could not be deleted:\n${errors.join("\n")}`)
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
          icon: selectedItem.isActive ? (
            <XCircle className="h-4 w-4" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          ),
          variant: "outline",
          onClick: async () => {
            await toggleCustomerStatus(selectedItem.id)
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

  function handleEdit(customer: Customer) {
    setSelectedCustomer(customer)
    setDialogOpen(true)
  }

  function handleNew() {
    setSelectedCustomer(null)
    setDialogOpen(true)
  }

  async function handleDelete(customer: Customer) {
    if (
      confirm(
        `Are you sure you want to delete customer ${customer.number} - ${customer.name}? This action cannot be undone.`
      )
    ) {
      const result = await deleteCustomer(customer.id)
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
            placeholder="Search by number, name, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
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

          <Button onClick={handleNew}>New Customer</Button>
        </div>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">
            Customers
            {filteredCustomers.length !== customers.length && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({filteredCustomers.length} of {customers.length})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BulkActionBar
            selectedCount={selectedCount}
            totalCount={filteredCustomers.length}
            actions={bulkActions}
            onClearSelection={clearSelection}
          />
          <EnhancedDataTable
            data={filteredCustomers}
            columns={columns}
            getRowId={(row) => row.id}
            onSelectionChange={setSelectedIds}
            enableSelection={true}
            enableSorting={true}
            emptyMessage={
              searchQuery || statusFilter !== "all"
                ? "No customers match your filters."
                : "No customers yet. Create your first customer to get started."
            }
          />
        </CardContent>
      </Card>

      <QuickPreviewPanel
        open={isOpen}
        onOpenChange={setIsOpen}
        data={selectedItem}
        title={(customer) => customer.name}
        description={(customer) => `Customer ${customer.number}`}
        sections={(customer) => [
          createPreviewSection("Customer Information", [
            {
              label: "Customer Number",
              value: <span className="font-mono text-sm">{customer.number}</span>,
            },
            {
              label: "Customer Name",
              value: <span className="font-semibold">{customer.name}</span>,
              fullWidth: true,
            },
            {
              label: "Status",
              value: (
                <PreviewBadge variant={customer.isActive ? "success" : "error"}>
                  {customer.isActive ? "Active" : "Inactive"}
                </PreviewBadge>
              ),
            },
          ]),
          createPreviewSection("Contact Information", [
            {
              label: "Email",
              value: customer.email ? (
                <a
                  href={`mailto:${customer.email}`}
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  <Mail className="h-3 w-3" />
                  {customer.email}
                </a>
              ) : (
                "—"
              ),
              fullWidth: true,
            },
            {
              label: "Phone",
              value: customer.phone ? (
                <a
                  href={`tel:${customer.phone}`}
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  <Phone className="h-3 w-3" />
                  {customer.phone}
                </a>
              ) : (
                "—"
              ),
              fullWidth: true,
            },
          ]),
          createPreviewSection("Payment Terms", [
            {
              label: "Payment Terms",
              value: `Net ${customer.termsNetDays} days`,
              fullWidth: true,
            },
          ]),
          createPreviewSection("Record Information", [
            {
              label: "Created",
              value: new Date(customer.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }),
            },
            {
              label: "Last Updated",
              value: new Date(customer.updatedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }),
            },
          ]),
        ]}
        actions={previewActions}
      />

      <CustomerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        customer={selectedCustomer}
      />
    </div>
  )
}
