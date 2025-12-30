import { prisma } from "@/lib/db"
import { DEMO_ORG_ID } from "@/lib/demo-org"
import { VendorsTable } from "./vendors-table"

export default async function VendorsPage() {
  const vendors = await prisma.vendor.findMany({
    where: { organizationId: DEMO_ORG_ID },
    orderBy: { number: "asc" },
    take: 500,
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Vendors</h2>
        <p className="text-sm text-muted-foreground">Master data for Procure to Pay.</p>
      </div>

      <VendorsTable vendors={vendors} />
    </div>
  )
}
