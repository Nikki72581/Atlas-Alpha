import { prisma } from "@/lib/db"
import { DEMO_ORG_ID } from "@/lib/demo-org"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable, Td, Th, Tr } from "@/components/atlas/data-table"

export default async function JournalsPage() {
  const journals = await prisma.journalEntry.findMany({
    where: { organizationId: DEMO_ORG_ID },
    orderBy: { postingDate: "desc" },
    include: { lines: { include: { account: true }, orderBy: { lineNo: "asc" } } },
    take: 50,
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Journals</h2>
        <p className="text-sm text-muted-foreground">
          Ledger entries are immutable once posted. Corrections are reversals, like adults do it.
        </p>
      </div>

      {journals.map((j) => (
        <Card key={j.id} className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">
              {j.journalNo} <span className="text-sm text-muted-foreground">({j.status})</span>
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              {j.postingDate.toLocaleDateString()} • {j.description ?? "—"}
            </div>
          </CardHeader>
          <CardContent>
            <DataTable className="border-0">
              <thead>
                <tr>
                  <Th>Line</Th>
                  <Th>Account</Th>
                  <Th>Memo</Th>
                  <Th className="text-right">Debit</Th>
                  <Th className="text-right">Credit</Th>
                </tr>
              </thead>
              <tbody>
                {j.lines.map((l) => (
                  <Tr key={l.id}>
                    <Td className="text-muted-foreground">{l.lineNo}</Td>
                    <Td className="font-medium">
                      <span className="font-mono text-xs">{l.account.number}</span> • {l.account.name}
                    </Td>
                    <Td className="text-muted-foreground">{l.memo ?? "—"}</Td>
                    <Td className="text-right tabular-nums">${parseFloat(l.debit.toString()).toFixed(2)}</Td>
                    <Td className="text-right tabular-nums">${parseFloat(l.credit.toString()).toFixed(2)}</Td>
                  </Tr>
                ))}
                {j.lines.length === 0 && (
                  <Tr>
                    <Td className="text-muted-foreground" colSpan={5}>
                      No lines.
                    </Td>
                  </Tr>
                )}
              </tbody>
            </DataTable>
          </CardContent>
        </Card>
      ))}

      {journals.length === 0 && (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">No journals yet</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Seed the database to see demo journals.</CardContent>
        </Card>
      )}
    </div>
  )
}
