import { prisma } from "@/lib/db"
import { DEMO_ORG_ID } from "@/lib/demo-org"
import { AccountsTable } from "./accounts-table"

export default async function AccountsPage() {
  const accounts = await prisma.account.findMany({
    where: { organizationId: DEMO_ORG_ID },
    orderBy: { number: "asc" },
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Chart of Accounts</h2>
        <p className="text-sm text-muted-foreground">
          Manage your organization's chart of accounts.
        </p>
      </div>

      <AccountsTable accounts={accounts} />
    </div>
  )
}
