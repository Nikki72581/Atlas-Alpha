import { prisma } from "@/lib/db"
import { DEMO_ORG_ID } from "@/lib/demo-org"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable, Td, Th, Tr } from "@/components/atlas/data-table"

export default async function AccountsPage() {
  const accounts = await prisma.account.findMany({
    where: { organizationId: DEMO_ORG_ID },
    orderBy: { number: "asc" },
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Chart of Accounts</h2>
        <p className="text-sm text-muted-foreground">Minimal COA seeded for demo posting.</p>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable>
            <thead>
              <tr>
                <Th>Number</Th>
                <Th>Name</Th>
                <Th>Type</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <Tr key={a.id}>
                  <Td className="font-mono text-xs">{a.number}</Td>
                  <Td className="font-medium">{a.name}</Td>
                  <Td className="text-muted-foreground">{a.type}</Td>
                  <Td className="text-muted-foreground">{a.isActive ? "Active" : "Inactive"}</Td>
                </Tr>
              ))}
              {accounts.length === 0 && (
                <Tr>
                  <Td className="text-muted-foreground" colSpan={4}>
                    No accounts yet.
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
