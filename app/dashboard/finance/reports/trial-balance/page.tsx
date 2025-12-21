import { calculateTrialBalance } from "@/lib/accounting"
import { DEMO_ORG_ID } from "@/lib/demo-org"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeader, DataTableRow } from "@/components/atlas/data-table"
import { TrialBalanceFilters } from "./trial-balance-filters"

type PageProps = {
  searchParams: Promise<{ asOfDate?: string; periodId?: string }>
}

export default async function TrialBalancePage({ searchParams }: PageProps) {
  const params = await searchParams
  const asOfDate = params.asOfDate ? new Date(params.asOfDate) : undefined
  const periodId = params.periodId

  // Get periods for filter dropdown
  const periods = await prisma.period.findMany({
    where: { organizationId: DEMO_ORG_ID },
    orderBy: [{ fiscalYear: "desc" }, { periodNumber: "desc" }],
  })

  // If a period is selected, use its end date as the asOfDate
  let effectiveAsOfDate = asOfDate
  if (periodId) {
    const selectedPeriod = periods.find((p) => p.id === periodId)
    if (selectedPeriod) {
      effectiveAsOfDate = new Date(selectedPeriod.endDate)
    }
  }

  const trialBalance = await calculateTrialBalance(DEMO_ORG_ID, {
    asOfDate: effectiveAsOfDate,
  })

  // Get selected period info for display
  const selectedPeriod = periodId ? periods.find((p) => p.id === periodId) : null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Trial Balance</h2>
        <p className="text-sm text-muted-foreground">
          Summary of all account balances. Debits should equal credits.
        </p>
      </div>

      <TrialBalanceFilters periods={periods} selectedPeriodId={periodId} />

      <div className="flex items-center justify-between">
        <div>
          {selectedPeriod && (
            <p className="text-sm font-medium">
              As of: {selectedPeriod.name} ({new Date(selectedPeriod.endDate).toLocaleDateString()})
            </p>
          )}
          {effectiveAsOfDate && !selectedPeriod && (
            <p className="text-sm font-medium">
              As of: {effectiveAsOfDate.toLocaleDateString()}
            </p>
          )}
          {!effectiveAsOfDate && <p className="text-sm text-muted-foreground">All transactions</p>}
        </div>
        <Badge variant={trialBalance.isBalanced ? "default" : "destructive"}>
          {trialBalance.isBalanced ? "Balanced" : "Out of Balance"}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable>
            <DataTableHeader>
              <DataTableRow>
                <DataTableHead>Account</DataTableHead>
                <DataTableHead>Name</DataTableHead>
                <DataTableHead>Type</DataTableHead>
                <DataTableHead className="text-right">Debits</DataTableHead>
                <DataTableHead className="text-right">Credits</DataTableHead>
                <DataTableHead className="text-right">Balance</DataTableHead>
              </DataTableRow>
            </DataTableHeader>
            <DataTableBody>
              {trialBalance.balances.length === 0 ? (
                <DataTableRow>
                  <DataTableCell colSpan={6} className="text-center text-muted-foreground">
                    No posted journal entries found
                  </DataTableCell>
                </DataTableRow>
              ) : (
                <>
                  {trialBalance.balances.map((balance) => (
                    <DataTableRow key={balance.accountId}>
                      <DataTableCell className="font-mono">{balance.accountNumber}</DataTableCell>
                      <DataTableCell>{balance.accountName}</DataTableCell>
                      <DataTableCell>
                        <Badge variant="outline">{balance.accountType}</Badge>
                      </DataTableCell>
                      <DataTableCell className="text-right tabular-nums">
                        ${balance.debitTotal.toFixed(2)}
                      </DataTableCell>
                      <DataTableCell className="text-right tabular-nums">
                        ${balance.creditTotal.toFixed(2)}
                      </DataTableCell>
                      <DataTableCell className="text-right tabular-nums font-medium">
                        ${balance.balance.toFixed(2)}
                      </DataTableCell>
                    </DataTableRow>
                  ))}
                  <DataTableRow className="font-bold border-t-2">
                    <DataTableCell colSpan={3}>TOTALS</DataTableCell>
                    <DataTableCell className="text-right tabular-nums">
                      ${trialBalance.totalDebits.toFixed(2)}
                    </DataTableCell>
                    <DataTableCell className="text-right tabular-nums">
                      ${trialBalance.totalCredits.toFixed(2)}
                    </DataTableCell>
                    <DataTableCell className="text-right tabular-nums">
                      {trialBalance.isBalanced ? (
                        <span className="text-green-600">Balanced</span>
                      ) : (
                        <span className="text-destructive">
                          Diff: ${trialBalance.difference.toFixed(2)}
                        </span>
                      )}
                    </DataTableCell>
                  </DataTableRow>
                </>
              )}
            </DataTableBody>
          </DataTable>
        </CardContent>
      </Card>

      {!trialBalance.isBalanced && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Warning: Trial Balance Out of Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              The trial balance is out of balance by ${trialBalance.difference.toFixed(2)}.
              This indicates an error in the journal entries. Please review all posted entries
              to ensure debits equal credits.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
