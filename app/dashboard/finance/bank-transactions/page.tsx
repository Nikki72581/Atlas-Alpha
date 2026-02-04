import { prisma } from "@/lib/db"
import { DEMO_ORG_ID } from "@/lib/demo-org"
import { TransactionsTable } from "./transactions-table"

export default async function BankTransactionsPage() {
  const [transactions, bankAccounts] = await Promise.all([
    prisma.bankTransaction.findMany({
      where: {
        bankAccount: { organizationId: DEMO_ORG_ID },
      },
      include: {
        bankAccount: {
          select: {
            id: true,
            name: true,
          },
        },
        categoryAccount: {
          select: {
            id: true,
            number: true,
            name: true,
          },
        },
        categoryRule: {
          select: {
            id: true,
            name: true,
          },
        },
        journalEntry: {
          select: {
            id: true,
            journalNo: true,
            status: true,
          },
        },
      },
      orderBy: { transactionDate: "desc" },
    }),
    prisma.bankAccount.findMany({
      where: {
        organizationId: DEMO_ORG_ID,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    }),
  ])

  // Convert Decimal to number for client component
  const serializedTransactions = transactions.map((txn) => ({
    ...txn,
    amount: Number(txn.amount),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Bank Transactions</h2>
        <p className="text-sm text-muted-foreground">
          Import, categorize, and manage your bank transactions.
        </p>
      </div>

      <TransactionsTable
        transactions={serializedTransactions}
        bankAccounts={bankAccounts}
      />
    </div>
  )
}
