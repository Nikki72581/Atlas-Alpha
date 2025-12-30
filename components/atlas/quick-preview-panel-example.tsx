"use client"

/**
 * QUICK PREVIEW PANEL - USAGE EXAMPLES
 *
 * This file demonstrates different ways to use the QuickPreviewPanel component
 * for displaying detailed information without losing context.
 */

import { useState } from "react"
import {
  QuickPreviewPanel,
  useQuickPreview,
  createPreviewSection,
  PreviewBadge,
  type PreviewSection,
  type PreviewAction,
} from "./quick-preview-panel"
import {
  EnhancedDataTable,
  type ColumnDef,
} from "./enhanced-data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Pencil, Trash2, Mail, Phone } from "lucide-react"

// ============================================================================
// Example 1: Basic Preview with Static Sections
// ============================================================================

type User = {
  id: string
  name: string
  email: string
  phone: string
  role: string
  status: "active" | "inactive"
  department: string
  joinDate: string
}

export function BasicPreviewExample() {
  const users: User[] = [
    {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      phone: "+1 234-567-8900",
      role: "Admin",
      status: "active",
      department: "Engineering",
      joinDate: "2023-01-15",
    },
    {
      id: "2",
      name: "Jane Smith",
      email: "jane@example.com",
      phone: "+1 234-567-8901",
      role: "User",
      status: "active",
      department: "Marketing",
      joinDate: "2023-03-20",
    },
  ]

  const { isOpen, selectedItem, openPreview, closePreview, setIsOpen } =
    useQuickPreview<User>()

  const columns: ColumnDef<User>[] = [
    {
      id: "name",
      header: "Name",
      accessorKey: "name",
      sortable: true,
    },
    {
      id: "email",
      header: "Email",
      accessorKey: "email",
      sortable: true,
    },
    {
      id: "role",
      header: "Role",
      accessorKey: "role",
    },
    {
      id: "actions",
      header: "",
      sortable: false,
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => openPreview(row)}
          className="h-8 w-8 p-0"
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ]

  const sections: PreviewSection[] = [
    createPreviewSection("Personal Information", [
      { label: "Full Name", value: selectedItem?.name || "" },
      { label: "Role", value: selectedItem?.role || "" },
      { label: "Department", value: selectedItem?.department || "" },
      { label: "Status", value: selectedItem?.status || "" },
    ]),
    createPreviewSection("Contact Information", [
      { label: "Email", value: selectedItem?.email || "", fullWidth: true },
      { label: "Phone", value: selectedItem?.phone || "", fullWidth: true },
    ]),
    createPreviewSection("Employment", [
      { label: "Join Date", value: selectedItem?.joinDate || "" },
    ]),
  ]

  const actions: PreviewAction[] = [
    {
      label: "Edit",
      icon: <Pencil className="h-4 w-4" />,
      variant: "outline",
      onClick: () => console.log("Edit user:", selectedItem?.id),
    },
    {
      label: "Delete",
      icon: <Trash2 className="h-4 w-4" />,
      variant: "destructive",
      onClick: () => console.log("Delete user:", selectedItem?.id),
    },
  ]

  return (
    <div>
      <EnhancedDataTable
        data={users}
        columns={columns}
        getRowId={(row) => row.id}
        enableSelection={false}
      />

      <QuickPreviewPanel
        open={isOpen}
        onOpenChange={setIsOpen}
        data={selectedItem}
        title="User Details"
        description="View and manage user information"
        sections={sections}
        actions={actions}
      />
    </div>
  )
}

// ============================================================================
// Example 2: Dynamic Preview with Functions
// ============================================================================

type Account = {
  id: string
  number: string
  name: string
  type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE"
  isActive: boolean
  balance: number
  currency: string
  lastTransaction: string
}

export function DynamicPreviewExample() {
  const accounts: Account[] = [
    {
      id: "1",
      number: "1000",
      name: "Cash",
      type: "ASSET",
      isActive: true,
      balance: 50000,
      currency: "USD",
      lastTransaction: "2024-01-15",
    },
    {
      id: "2",
      number: "2000",
      name: "Accounts Payable",
      type: "LIABILITY",
      isActive: true,
      balance: -25000,
      currency: "USD",
      lastTransaction: "2024-01-14",
    },
  ]

  const { isOpen, selectedItem, openPreview, setIsOpen } = useQuickPreview<Account>()

  const columns: ColumnDef<Account>[] = [
    {
      id: "number",
      header: "Number",
      accessorKey: "number",
      className: "font-mono text-xs",
    },
    {
      id: "name",
      header: "Name",
      accessorKey: "name",
    },
    {
      id: "type",
      header: "Type",
      accessorKey: "type",
    },
    {
      id: "preview",
      header: "",
      sortable: false,
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => openPreview(row)}
          className="h-8 w-8 p-0"
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ]

  return (
    <div>
      <EnhancedDataTable
        data={accounts}
        columns={columns}
        getRowId={(row) => row.id}
        enableSelection={false}
      />

      <QuickPreviewPanel
        open={isOpen}
        onOpenChange={setIsOpen}
        data={selectedItem}
        title={(account) => `Account ${account.number} - ${account.name}`}
        description={(account) => `${account.type} account details`}
        sections={(account) => [
          createPreviewSection("Account Information", [
            { label: "Account Number", value: account.number },
            { label: "Account Name", value: account.name, fullWidth: true },
            { label: "Type", value: account.type },
            {
              label: "Status",
              value: (
                <PreviewBadge variant={account.isActive ? "success" : "error"}>
                  {account.isActive ? "Active" : "Inactive"}
                </PreviewBadge>
              ),
            },
          ]),
          createPreviewSection("Balance Information", [
            {
              label: "Current Balance",
              value: (
                <span
                  className={account.balance >= 0 ? "text-green-600" : "text-red-600"}
                >
                  {account.currency} {account.balance.toLocaleString()}
                </span>
              ),
              fullWidth: true,
            },
            { label: "Currency", value: account.currency },
            { label: "Last Transaction", value: account.lastTransaction },
          ]),
        ]}
        actions={(account) => [
          {
            label: "Edit",
            icon: <Pencil className="h-4 w-4" />,
            variant: "outline",
            onClick: () => console.log("Edit account:", account.id),
          },
          {
            label: account.isActive ? "Deactivate" : "Activate",
            variant: "outline",
            onClick: () => console.log("Toggle status:", account.id),
          },
          {
            label: "Delete",
            icon: <Trash2 className="h-4 w-4" />,
            variant: "destructive",
            onClick: () => console.log("Delete account:", account.id),
          },
        ]}
      />
    </div>
  )
}

// ============================================================================
// Example 3: Custom Children with Complex Layout
// ============================================================================

type Order = {
  id: string
  orderNumber: string
  customer: string
  total: number
  status: "pending" | "processing" | "completed" | "cancelled"
  items: Array<{
    id: string
    name: string
    quantity: number
    price: number
  }>
  shippingAddress: {
    street: string
    city: string
    state: string
    zip: string
  }
}

export function CustomChildrenExample() {
  const orders: Order[] = [
    {
      id: "1",
      orderNumber: "ORD-001",
      customer: "Acme Corp",
      total: 1250.0,
      status: "completed",
      items: [
        { id: "1", name: "Widget A", quantity: 5, price: 100 },
        { id: "2", name: "Widget B", quantity: 10, price: 75 },
      ],
      shippingAddress: {
        street: "123 Main St",
        city: "San Francisco",
        state: "CA",
        zip: "94105",
      },
    },
  ]

  const { isOpen, selectedItem, openPreview, setIsOpen } = useQuickPreview<Order>()

  const columns: ColumnDef<Order>[] = [
    { id: "orderNumber", header: "Order #", accessorKey: "orderNumber" },
    { id: "customer", header: "Customer", accessorKey: "customer" },
    {
      id: "total",
      header: "Total",
      cell: (row) => `$${row.total.toFixed(2)}`,
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => <Badge>{row.status}</Badge>,
    },
    {
      id: "preview",
      header: "",
      sortable: false,
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => openPreview(row)}
          className="h-8 w-8 p-0"
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ]

  return (
    <div>
      <EnhancedDataTable
        data={orders}
        columns={columns}
        getRowId={(row) => row.id}
        enableSelection={false}
      />

      <QuickPreviewPanel
        open={isOpen}
        onOpenChange={setIsOpen}
        data={selectedItem}
        title={(order) => `Order ${order.orderNumber}`}
        description={(order) => `Customer: ${order.customer}`}
        sections={[]} // No sections when using custom children
        width="xl"
      >
        {(order) => (
          <div className="space-y-6">
            {/* Order Summary */}
            <div>
              <h3 className="text-sm font-semibold mb-3 border-b pb-2">
                Order Summary
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge>{order.status}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-semibold">${order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h3 className="text-sm font-semibold mb-3 border-b pb-2">
                Items ({order.items.length})
              </h3>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-start p-3 rounded-lg bg-muted/30"
                  >
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-semibold">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div>
              <h3 className="text-sm font-semibold mb-3 border-b pb-2">
                Shipping Address
              </h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>{order.shippingAddress.street}</p>
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                  {order.shippingAddress.zip}
                </p>
              </div>
            </div>
          </div>
        )}
      </QuickPreviewPanel>
    </div>
  )
}
