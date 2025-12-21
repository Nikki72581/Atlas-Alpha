import { prisma } from "@/lib/db"
import { DEMO_ORG_ID } from "@/lib/demo-org"
import { DimensionsManagement } from "./dimensions-management"

export default async function DimensionsPage() {
  const organization = await prisma.organization.findUnique({
    where: { id: DEMO_ORG_ID },
    select: { dimensionsEnabled: true },
  })

  const dimensions = await prisma.dimensionDefinition.findMany({
    where: { organizationId: DEMO_ORG_ID },
    orderBy: { sortOrder: "asc" },
    include: {
      values: {
        orderBy: { sortOrder: "asc" },
      },
      _count: {
        select: { values: true },
      },
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Dimensions</h2>
        <p className="text-sm text-muted-foreground">
          Configure dimensions for flexible tagging and segmentation of transactions.
        </p>
      </div>

      <DimensionsManagement
        dimensions={dimensions}
        dimensionsEnabled={organization?.dimensionsEnabled ?? false}
      />
    </div>
  )
}
