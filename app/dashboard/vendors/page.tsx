import Link from "next/link"
import { prisma } from "@/lib/db"
import { DEMO_ORG_ID } from "@/lib/demo-org"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable, Td, Th, Tr } from "@/components/atlas/data-table"
import { Button } from "@/components/ui/button"

export default async function VendorsPage() {
  const vendors = await prisma.vendor.findMany({
    where: { organizationId: DEMO_ORG_ID },
    orderBy: { number: "asc" },
    take: 200,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Vendors</h2>
          <p className="text-sm text-muted-foreground">Master data for Procure to Pay.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="#">New Vendor (stub)</Link>
        </Button>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Vendor list</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable>
            <thead>
              <tr>
                <Th>Number</Th>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Terms</Th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((v) => (
                <Tr key={v.id}>
                  <Td className="font-mono text-xs">{v.number}</Td>
                  <Td className="font-medium">{v.name}</Td>
                  <Td className="text-muted-foreground">{v.email ?? "—"}</Td>
                  <Td className="text-muted-foreground">Net {v.termsNetDays}</Td>
                </Tr>
              ))}
              {vendors.length === 0 && (
                <Tr>
                  <Td className="text-muted-foreground" colSpan={4}>
                    No vendors yet.
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
