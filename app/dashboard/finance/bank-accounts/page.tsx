import { prisma } from "@/lib/db"
import { DEMO_ORG_ID } from "@/lib/demo-org"
import { BankAccountsTable } from "./bank-accounts-table"

export default async function BankAccountsPage() {
  const bankAccounts = await prisma.bankAccount.findMany({
    where: { organizationId: DEMO_ORG_ID },
    include: {
      glAccount: {
        select: {
          number: true,
          name: true,
        },
      },
      _count: {
        select: {
          transactions: true,
        },
      },
    },
    orderBy: { name: "asc" },
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Bank Accounts</h2>
        <p className="text-sm text-muted-foreground">
          Manage your organization's bank accounts and import transactions.
        </p>
      </div>

      <BankAccountsTable bankAccounts={bankAccounts} />
    </div>
  )
}
