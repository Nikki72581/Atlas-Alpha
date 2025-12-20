import { prisma } from "@/lib/db"
import { DEMO_ORG_ID } from "@/lib/demo-org"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable, Td, Th, Tr } from "@/components/atlas/data-table"

export default async function PurchaseOrdersPage() {
  const orders = await prisma.purchaseOrder.findMany({
    where: { organizationId: DEMO_ORG_ID },
    orderBy: { orderDate: "desc" },
    include: { vendor: true, lines: true },
    take: 100,
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Purchase Orders</h2>
        <p className="text-sm text-muted-foreground">Header + lines (distribution starter).</p>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Recent purchase orders</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable>
            <thead>
              <tr>
                <Th>Order</Th>
                <Th>Vendor</Th>
                <Th>Status</Th>
                <Th>Lines</Th>
                <Th>Order Date</Th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <Tr key={o.id}>
                  <Td className="font-mono text-xs">{o.orderNo}</Td>
                  <Td className="font-medium">{o.vendor.name}</Td>
                  <Td className="text-muted-foreground">{o.status}</Td>
                  <Td className="text-muted-foreground">{o.lines.length}</Td>
                  <Td className="text-muted-foreground">{o.orderDate.toLocaleDateString()}</Td>
                </Tr>
              ))}
              {orders.length === 0 && (
                <Tr>
                  <Td className="text-muted-foreground" colSpan={5}>
                    No purchase orders yet.
                  </Td>
                </Tr>
              )}
            </tbody>
          </DataTable>
        </CardContent>
      </Card>
    </div>
  )
}
