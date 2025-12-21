import { prisma } from "@/lib/db"
import { DEMO_ORG_ID } from "@/lib/demo-org"
import { PeriodsTable } from "./periods-table"

export default async function PeriodsPage() {
  const periods = await prisma.period.findMany({
    where: { organizationId: DEMO_ORG_ID },
    orderBy: [{ fiscalYear: "desc" }, { periodNumber: "desc" }],
    include: {
      _count: {
        select: { journalEntries: true },
      },
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Accounting Periods</h2>
        <p className="text-sm text-muted-foreground">
          Manage fiscal periods for financial reporting and close processes.
        </p>
      </div>

      <PeriodsTable periods={periods} />
    </div>
  )
}
