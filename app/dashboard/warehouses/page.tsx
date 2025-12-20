import Link from "next/link"
import { prisma } from "@/lib/db"
import { DEMO_ORG_ID } from "@/lib/demo-org"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable, Td, Th, Tr } from "@/components/atlas/data-table"
import { Button } from "@/components/ui/button"

export default async function WarehousesPage() {
  const warehouses = await prisma.warehouse.findMany({
    where: { organizationId: DEMO_ORG_ID },
    orderBy: { code: "asc" },
    take: 200,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Warehouses</h2>
          <p className="text-sm text-muted-foreground">Inventory storage locations.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="#">New Warehouse (stub)</Link>
        </Button>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Warehouse list</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable>
            <thead>
              <tr>
                <Th>Code</Th>
                <Th>Name</Th>
                <Th>Updated</Th>
              </tr>
            </thead>
            <tbody>
              {warehouses.map((w) => (
                <Tr key={w.id}>
                  <Td className="font-mono text-xs">{w.code}</Td>
                  <Td className="font-medium">{w.name}</Td>
                  <Td className="text-muted-foreground">{w.updatedAt.toLocaleDateString()}</Td>
                </Tr>
              ))}
              {warehouses.length === 0 && (
                <Tr>
                  <Td className="text-muted-foreground" colSpan={3}>
                    No warehouses yet.
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
