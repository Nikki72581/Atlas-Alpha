import { prisma } from "@/lib/db"
import { DEMO_ORG_ID } from "@/lib/demo-org"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable, Td, Th, Tr } from "@/components/atlas/data-table"

export default async function InventoryPage() {
  const txns = await prisma.inventoryTransaction.findMany({
    where: { organizationId: DEMO_ORG_ID },
    orderBy: { txnDate: "desc" },
    include: { item: true, warehouse: true },
    take: 50,
  })

  // On-hand summary by Item + Warehouse
  const grouped = await prisma.inventoryTransaction.groupBy({
    by: ["itemId", "warehouseId"],
    where: { organizationId: DEMO_ORG_ID },
    _sum: { quantity: true },
  })

  const lookupItems = await prisma.item.findMany({ where: { organizationId: DEMO_ORG_ID } })
  const lookupWh = await prisma.warehouse.findMany({ where: { organizationId: DEMO_ORG_ID } })
  const itemMap = new Map(lookupItems.map((i) => [i.id, i]))
  const whMap = new Map(lookupWh.map((w) => [w.id, w]))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Inventory</h2>
        <p className="text-sm text-muted-foreground">
          Movements are the truth. On-hand is just math on top of them.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">On-hand (summary)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DataTable>
              <thead>
                <tr>
                  <Th>Item</Th>
                  <Th>Warehouse</Th>
                  <Th className="text-right">On-hand</Th>
                </tr>
              </thead>
              <tbody>
                {grouped.map((g) => {
                  const item = itemMap.get(g.itemId)
                  const wh = whMap.get(g.warehouseId)
                  const qty = parseFloat((g._sum.quantity ?? 0).toString())
                  return (
                    <Tr key={`${g.itemId}-${g.warehouseId}`}>
                      <Td className="font-medium">{item ? `${item.sku} • ${item.name}` : g.itemId}</Td>
                      <Td className="text-muted-foreground">{wh ? `${wh.code} • ${wh.name}` : g.warehouseId}</Td>
                      <Td className="text-right tabular-nums">{qty.toFixed(2)}</Td>
                    </Tr>
                  )
                })}
                {grouped.length === 0 && (
                  <Tr>
                    <Td className="text-muted-foreground" colSpan={3}>
                      No inventory movements yet.
                    </Td>
                  </Tr>
                )}
              </tbody>
            </DataTable>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Recent movements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DataTable>
              <thead>
                <tr>
                  <Th>Date</Th>
                  <Th>Type</Th>
                  <Th>Item</Th>
                  <Th className="text-right">Qty</Th>
                  <Th>Ref</Th>
                </tr>
              </thead>
              <tbody>
                {txns.map((t) => (
                  <Tr key={t.id}>
                    <Td className="text-muted-foreground">{t.txnDate.toLocaleDateString()}</Td>
                    <Td className="text-muted-foreground">{t.txnType}</Td>
                    <Td className="font-medium">{t.item.sku}</Td>
                    <Td className="text-right tabular-nums">{parseFloat(t.quantity.toString()).toFixed(2)}</Td>
                    <Td className="text-muted-foreground">{t.referenceType ? `${t.referenceType} ${t.referenceId ?? ""}` : "—"}</Td>
                  </Tr>
                ))}
                {txns.length === 0 && (
                  <Tr>
                    <Td className="text-muted-foreground" colSpan={5}>
                      No movements yet.
                    </Td>
                  </Tr>
                )}
              </tbody>
            </DataTable>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
