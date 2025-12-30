import { prisma } from "@/lib/db"
import { DEMO_ORG_ID } from "@/lib/demo-org"
import { CustomersTable } from "./customers-table"

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({
    where: { organizationId: DEMO_ORG_ID },
    orderBy: { number: "asc" },
    take: 500,
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Customers</h2>
        <p className="text-sm text-muted-foreground">Master data for Order to Cash.</p>
      </div>

      <CustomersTable customers={customers} />
    </div>
  )
}
