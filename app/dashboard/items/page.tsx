import Link from "next/link"
import { prisma } from "@/lib/db"
import { DEMO_ORG_ID } from "@/lib/demo-org"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable, Td, Th, Tr } from "@/components/atlas/data-table"
import { Button } from "@/components/ui/button"

export default async function ItemsPage() {
  const items = await prisma.item.findMany({
    where: { organizationId: DEMO_ORG_ID },
    orderBy: { sku: "asc" },
    take: 500,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Items</h2>
          <p className="text-sm text-muted-foreground">Inventory catalog and pricing.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="#">New Item (stub)</Link>
        </Button>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Item list</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable>
            <thead>
              <tr>
                <Th>SKU</Th>
                <Th>Name</Th>
                <Th>Type</Th>
                <Th className="text-right">Sales</Th>
                <Th className="text-right">Cost</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <Tr key={i.id}>
                  <Td className="font-mono text-xs">{i.sku}</Td>
                  <Td className="font-medium">{i.name}</Td>
                  <Td className="text-muted-foreground">{i.type}</Td>
                  <Td className="text-right tabular-nums">${parseFloat(i.salesPrice.toString()).toFixed(2)}</Td>
                  <Td className="text-right tabular-nums">${parseFloat(i.purchaseCost.toString()).toFixed(2)}</Td>
                </Tr>
              ))}
              {items.length === 0 && (
                <Tr>
                  <Td className="text-muted-foreground" colSpan={5}>
                    No items yet.
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
