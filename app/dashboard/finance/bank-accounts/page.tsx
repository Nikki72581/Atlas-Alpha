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

  // Compute ledger balance for each bank account's GL account
  // Balance = sum(debits) - sum(credits) from POSTED journal entries
  const glAccountIds = bankAccounts.map((ba) => ba.glAccountId)

  const balances = await prisma.journalLine.groupBy({
    by: ["accountId"],
    where: {
      accountId: { in: glAccountIds },
      journalEntry: { status: "POSTED" },
    },
    _sum: {
      debit: true,
      credit: true,
    },
  })

  const balanceMap = new Map(
    balances.map((b) => [
      b.accountId,
      Number(b._sum.debit ?? 0) - Number(b._sum.credit ?? 0),
    ])
  )

  const bankAccountsWithBalance = bankAccounts.map((ba) => ({
    ...ba,
    ledgerBalance: balanceMap.get(ba.glAccountId) ?? 0,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Bank Accounts</h2>
        <p className="text-sm text-muted-foreground">
          Manage your organization's bank accounts and import transactions.
        </p>
      </div>

      <BankAccountsTable bankAccounts={bankAccountsWithBalance} />
    </div>
  )
}
