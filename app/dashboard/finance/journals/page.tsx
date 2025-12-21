import { prisma } from "@/lib/db"
import { DEMO_ORG_ID } from "@/lib/demo-org"
import { JournalsTable } from "./journals-table"

export default async function JournalsPage() {
  const journals = await prisma.journalEntry.findMany({
    where: { organizationId: DEMO_ORG_ID },
    orderBy: { postingDate: "desc" },
    include: { lines: { include: { account: true }, orderBy: { lineNo: "asc" } } },
    take: 50,
  })

  const accounts = await prisma.account.findMany({
    where: { organizationId: DEMO_ORG_ID, isActive: true },
    orderBy: { number: "asc" },
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Journal Entries</h2>
        <p className="text-sm text-muted-foreground">
          Ledger entries are immutable once posted. Corrections are reversals, like adults do it.
        </p>
      </div>

      <JournalsTable journals={journals} accounts={accounts} />
    </div>
  )
}
