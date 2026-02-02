import { prisma } from "@/lib/db"
import { DEMO_ORG_ID } from "@/lib/demo-org"
import Link from "next/link"
import {
  Users,
  Package,
  FileText,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle2,
  Truck,
  DollarSign,
  BarChart3,
  Layers,
  Activity,
} from "lucide-react"

export default async function DashboardPage() {
  const [
    customers,
    vendors,
    items,
    salesOrders,
    purchaseOrders,
    txns,
    pendingSalesOrders,
    pendingPurchaseOrders,
  ] = await Promise.all([
    prisma.customer.count({ where: { organizationId: DEMO_ORG_ID } }),
    prisma.vendor.count({ where: { organizationId: DEMO_ORG_ID } }),
    prisma.item.count({ where: { organizationId: DEMO_ORG_ID } }),
    prisma.salesOrder.count({ where: { organizationId: DEMO_ORG_ID } }),
    prisma.purchaseOrder.count({ where: { organizationId: DEMO_ORG_ID } }),
    prisma.inventoryTransaction.count({ where: { organizationId: DEMO_ORG_ID } }),
    prisma.salesOrder.count({ where: { organizationId: DEMO_ORG_ID, status: { in: ["DRAFT", "RELEASED"] } } }),
    prisma.purchaseOrder.count({ where: { organizationId: DEMO_ORG_ID, status: { in: ["DRAFT", "RELEASED"] } } }),
  ])

  const actionItems = [
    pendingSalesOrders > 0 && {
      title: `${pendingSalesOrders} sales order${pendingSalesOrders > 1 ? "s" : ""} awaiting fulfillment`,
      href: "/dashboard/sales-orders?status=RELEASED",
      icon: FileText,
      module: "sales" as const,
      priority: "high" as const,
    },
    pendingPurchaseOrders > 0 && {
      title: `${pendingPurchaseOrders} purchase order${pendingPurchaseOrders > 1 ? "s" : ""} pending receipt`,
      href: "/dashboard/purchase-orders?status=RELEASED",
      icon: Truck,
      module: "purchase" as const,
      priority: "medium" as const,
    },
  ].filter(Boolean) as Array<{
    title: string
    href: string
    icon: typeof FileText
    module: "sales" | "purchase" | "inventory" | "finance"
    priority: "high" | "medium" | "low"
  }>

  const quickLinks = [
    {
      title: "Order to Cash",
      description: "Customers, quotes, orders, invoices",
      href: "/dashboard/customers",
      icon: Users,
      module: "sales" as const,
      stats: [
        { label: "Customers", value: customers },
        { label: "Sales Orders", value: salesOrders },
      ],
    },
    {
      title: "Procure to Pay",
      description: "Vendors, POs, receipts, bills",
      href: "/dashboard/vendors",
      icon: DollarSign,
      module: "purchase" as const,
      stats: [
        { label: "Vendors", value: vendors },
        { label: "Purchase Orders", value: purchaseOrders },
      ],
    },
    {
      title: "Inventory",
      description: "Items, warehouses, movements",
      href: "/dashboard/items",
      icon: Package,
      module: "inventory" as const,
      stats: [
        { label: "Items", value: items },
        { label: "Movements", value: txns },
      ],
    },
    {
      title: "Finance",
      description: "GL, journals, periods, reports",
      href: "/dashboard/finance/accounts",
      icon: BarChart3,
      module: "finance" as const,
      stats: [
        { label: "Accounts", value: "—" },
        { label: "Journals", value: "—" },
      ],
    },
  ]

  const getModuleColor = (module: "sales" | "purchase" | "inventory" | "finance") => {
    const colors = {
      sales: "bg-[oklch(0.55_0.18_320/0.1)] text-[oklch(0.45_0.18_320)] dark:bg-[oklch(0.68_0.18_320/0.15)] dark:text-[oklch(0.78_0.15_320)]",
      purchase: "bg-[oklch(0.58_0.14_55/0.1)] text-[oklch(0.48_0.14_55)] dark:bg-[oklch(0.70_0.14_55/0.15)] dark:text-[oklch(0.80_0.12_55)]",
      inventory: "bg-[oklch(0.52_0.14_165/0.1)] text-[oklch(0.42_0.14_165)] dark:bg-[oklch(0.62_0.14_165/0.15)] dark:text-[oklch(0.72_0.12_165)]",
      finance: "bg-[oklch(0.45_0.08_250/0.1)] text-[oklch(0.35_0.08_250)] dark:bg-[oklch(0.60_0.10_250/0.15)] dark:text-[oklch(0.70_0.08_250)]",
    }
    return colors[module]
  }

  const getModuleBorder = (module: "sales" | "purchase" | "inventory" | "finance") => {
    const borders = {
      sales: "border-l-[oklch(0.55_0.18_320)]",
      purchase: "border-l-[oklch(0.58_0.14_55)]",
      inventory: "border-l-[oklch(0.52_0.14_165)]",
      finance: "border-l-[oklch(0.45_0.08_250)]",
    }
    return borders[module]
  }

  const getPriorityStyles = (priority: "high" | "medium" | "low") => {
    const styles = {
      high: "bg-[oklch(0.55_0.22_25/0.08)] border-[oklch(0.55_0.22_25/0.2)] text-[oklch(0.45_0.20_25)] dark:bg-[oklch(0.60_0.20_25/0.12)] dark:border-[oklch(0.60_0.20_25/0.25)] dark:text-[oklch(0.75_0.15_25)]",
      medium: "bg-[oklch(0.70_0.15_70/0.08)] border-[oklch(0.70_0.15_70/0.2)] text-[oklch(0.50_0.14_70)] dark:bg-[oklch(0.72_0.14_70/0.12)] dark:border-[oklch(0.72_0.14_70/0.25)] dark:text-[oklch(0.82_0.12_70)]",
      low: "bg-muted/50 border-border text-muted-foreground",
    }
    return styles[priority]
  }

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header Section */}
      <header className="animate-fade-up">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="font-display text-3xl tracking-tight">Command Center</h1>
            <p className="text-muted-foreground">
              Things that need your attention, all in one place.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="h-4 w-4" />
            <span>Live</span>
          </div>
        </div>
      </header>

      {/* Action Items - Work Queue */}
      {actionItems.length > 0 && (
        <section className="space-y-3 animate-fade-up stagger-1" style={{ opacity: 0 }}>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-[oklch(0.55_0.22_25)]" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Needs Attention
            </h2>
          </div>
          <div className="grid gap-3">
            {actionItems.map((item, idx) => {
              const Icon = item.icon
              return (
                <Link
                  key={idx}
                  href={item.href}
                  className={`
                    group flex items-center justify-between gap-4 rounded-lg border p-4
                    transition-all duration-200 hover:shadow-elevated
                    ${getPriorityStyles(item.priority)}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`rounded-md p-2 ${getModuleColor(item.module)}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="font-medium">{item.title}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1" />
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Empty state when no action items */}
      {actionItems.length === 0 && (
        <section className="animate-fade-up stagger-1" style={{ opacity: 0 }}>
          <div className="flex items-center gap-4 rounded-lg border border-dashed border-[oklch(0.55_0.15_155/0.3)] bg-[oklch(0.55_0.15_155/0.05)] p-6">
            <div className="rounded-full bg-[oklch(0.55_0.15_155/0.1)] p-3">
              <CheckCircle2 className="h-5 w-5 text-[oklch(0.45_0.15_155)]" />
            </div>
            <div>
              <p className="font-medium text-[oklch(0.35_0.12_155)] dark:text-[oklch(0.75_0.12_155)]">
                All caught up
              </p>
              <p className="text-sm text-muted-foreground">
                No pending items require your attention right now.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Module Quick Links */}
      <section className="space-y-4 animate-fade-up stagger-2" style={{ opacity: 0 }}>
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Modules
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {quickLinks.map((link, idx) => {
            const Icon = link.icon
            return (
              <Link
                key={idx}
                href={link.href}
                className={`
                  group relative overflow-hidden rounded-xl border-l-[3px] bg-card p-5
                  shadow-card transition-all duration-300
                  hover:shadow-elevated hover:-translate-y-0.5
                  ${getModuleBorder(link.module)}
                `}
              >
                {/* Subtle gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-muted/30 opacity-0 transition-opacity group-hover:opacity-100" />

                <div className="relative space-y-3">
                  <div className="flex items-start justify-between">
                    <div className={`rounded-lg p-2.5 ${getModuleColor(link.module)}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1" />
                  </div>

                  <div>
                    <h3 className="font-semibold tracking-tight">{link.title}</h3>
                    <p className="text-sm text-muted-foreground">{link.description}</p>
                  </div>

                  <div className="flex gap-6 pt-2 border-t border-border/50">
                    {link.stats.map((stat, statIdx) => (
                      <div key={statIdx}>
                        <p className="font-display text-2xl tracking-tight">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Summary Stats Row */}
      <section className="animate-fade-up stagger-3" style={{ opacity: 0 }}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: "Total Customers", value: customers, icon: Users, trend: "+12%" },
            { label: "Total Vendors", value: vendors, icon: Truck, trend: "+5%" },
            { label: "Active Items", value: items, icon: Package, trend: null },
            { label: "Sales Orders", value: salesOrders, icon: FileText, trend: "+8%" },
            { label: "Purchase Orders", value: purchaseOrders, icon: FileText, trend: "+3%" },
            { label: "Inventory Moves", value: txns, icon: Activity, trend: null },
          ].map((stat, idx) => {
            const Icon = stat.icon
            return (
              <div
                key={idx}
                className="group rounded-lg border bg-card/50 p-4 transition-all hover:bg-card hover:shadow-card"
              >
                <div className="flex items-center justify-between text-muted-foreground">
                  <Icon className="h-4 w-4" />
                  {stat.trend && (
                    <span className="flex items-center gap-0.5 text-xs text-[oklch(0.50_0.14_165)]">
                      <TrendingUp className="h-3 w-3" />
                      {stat.trend}
                    </span>
                  )}
                </div>
                <p className="mt-2 font-display text-2xl tracking-tight">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Recent Activity Timeline */}
      <section className="space-y-4 animate-fade-up stagger-4" style={{ opacity: 0 }}>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Recent Activity
          </h2>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-card">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-muted p-3 mb-3">
              <Activity className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Activity timeline coming soon
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Track document changes, approvals, and system events
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
