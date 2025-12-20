import { prisma } from "@/lib/db"
import { DEMO_ORG_ID } from "@/lib/demo-org"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function DashboardPage() {
  const [customers, vendors, items, salesOrders, purchaseOrders, txns] = await Promise.all([
    prisma.customer.count({ where: { organizationId: DEMO_ORG_ID } }),
    prisma.vendor.count({ where: { organizationId: DEMO_ORG_ID } }),
    prisma.item.count({ where: { organizationId: DEMO_ORG_ID } }),
    prisma.salesOrder.count({ where: { organizationId: DEMO_ORG_ID } }),
    prisma.purchaseOrder.count({ where: { organizationId: DEMO_ORG_ID } }),
    prisma.inventoryTransaction.count({ where: { organizationId: DEMO_ORG_ID } }),
  ])

  const stats = [
    { label: "Customers", value: customers },
    { label: "Vendors", value: vendors },
    { label: "Items", value: items },
    { label: "Sales Orders", value: salesOrders },
    { label: "Purchase Orders", value: purchaseOrders },
    { label: "Inventory Movements", value: txns },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Distribution Starter Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Seeded demo data lives in a single tenant (<code className="text-xs">demo-org</code>) so you can move fast.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Next slice</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            To make Atlas feel like an ERP (and not a demo app), build: Sales Order Lines → Allocate → Ship (issue txn),
            and Purchase Order Receive (receipt txn), then a posting preview into journals.
          </p>
          <p className="text-xs">
            Nothing here edits production systems. It just gives you a foundation that won’t hate you later.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
