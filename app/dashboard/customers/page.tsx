import { prisma } from "@/lib/db"
import { DEMO_ORG_ID } from "@/lib/demo-org"
import { CustomersTable } from "./customers-table"
import { Users } from "lucide-react"

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({
    where: { organizationId: DEMO_ORG_ID },
    orderBy: { number: "asc" },
    take: 500,
  })

  const activeCount = customers.filter(c => c.isActive).length

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Page Header */}
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-[oklch(0.55_0.18_320/0.1)] p-3 dark:bg-[oklch(0.68_0.18_320/0.15)]">
            <Users className="h-6 w-6 text-[oklch(0.45_0.18_320)] dark:text-[oklch(0.75_0.15_320)]" />
          </div>
          <div>
            <h1 className="font-display text-2xl tracking-tight">Customers</h1>
            <p className="text-sm text-muted-foreground">
              Master data for Order to Cash · {customers.length} total · {activeCount} active
            </p>
          </div>
        </div>
      </header>

      <CustomersTable customers={customers} />
    </div>
  )
}
