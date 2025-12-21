import { getBalancesByAccountType } from "@/lib/accounting"
import { DEMO_ORG_ID } from "@/lib/demo-org"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function IncomeStatementPage() {
  const report = await getBalancesByAccountType(DEMO_ORG_ID)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Income Statement</h2>
        <p className="text-sm text-muted-foreground">
          Profit and loss for the current period. Revenue - Expenses = Net Income.
        </p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        {/* Revenue */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.grouped.REVENUE.length === 0 ? (
              <p className="text-sm text-muted-foreground">No revenue accounts with balances</p>
            ) : (
              <>
                <div className="space-y-2">
                  {report.grouped.REVENUE.map((account) => (
                    <div key={account.accountId} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {account.accountNumber} - {account.accountName}
                      </span>
                      <span className="font-mono tabular-nums">
                        ${account.balance.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-bold text-base border-t pt-2">
                  <span>Total Revenue</span>
                  <span className="font-mono tabular-nums">
                    ${report.totals.revenue.toFixed(2)}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Expenses */}
        <Card>
          <CardHeader>
            <CardTitle>Expenses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.grouped.EXPENSE.length === 0 ? (
              <p className="text-sm text-muted-foreground">No expense accounts with balances</p>
            ) : (
              <>
                <div className="space-y-2">
                  {report.grouped.EXPENSE.map((account) => (
                    <div key={account.accountId} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {account.accountNumber} - {account.accountName}
                      </span>
                      <span className="font-mono tabular-nums">
                        ${account.balance.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-bold text-base border-t pt-2">
                  <span>Total Expenses</span>
                  <span className="font-mono tabular-nums">
                    ${report.totals.expenses.toFixed(2)}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Net Income */}
        <Card className={report.incomeStatement.netIncome >= 0 ? "border-green-500" : "border-destructive"}>
          <CardHeader>
            <CardTitle>Net Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-base">
                <span>Total Revenue</span>
                <span className="font-mono tabular-nums">
                  ${report.incomeStatement.totalRevenue.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-base">
                <span>Total Expenses</span>
                <span className="font-mono tabular-nums">
                  -${report.incomeStatement.totalExpenses.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t-2 pt-2">
                <span>Net Income</span>
                <span className={`font-mono tabular-nums ${
                  report.incomeStatement.netIncome >= 0 ? "text-green-600" : "text-destructive"
                }`}>
                  ${report.incomeStatement.netIncome.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
