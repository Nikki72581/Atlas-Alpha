import { getBalancesByAccountType } from "@/lib/accounting"
import { DEMO_ORG_ID } from "@/lib/demo-org"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function BalanceSheetPage() {
  const report = await getBalancesByAccountType(DEMO_ORG_ID)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Balance Sheet</h2>
          <p className="text-sm text-muted-foreground">
            Financial position as of today. Assets = Liabilities + Equity.
          </p>
        </div>
        <Badge variant={report.balanceSheet.balanced ? "default" : "destructive"}>
          {report.balanceSheet.balanced ? "Balanced" : "Out of Balance"}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Assets */}
        <Card>
          <CardHeader>
            <CardTitle>Assets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.grouped.ASSET.length === 0 ? (
              <p className="text-sm text-muted-foreground">No asset accounts with balances</p>
            ) : (
              <>
                <div className="space-y-2">
                  {report.grouped.ASSET.map((account) => (
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
                  <span>Total Assets</span>
                  <span className="font-mono tabular-nums">
                    ${report.totals.assets.toFixed(2)}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Liabilities & Equity */}
        <div className="space-y-6">
          {/* Liabilities */}
          <Card>
            <CardHeader>
              <CardTitle>Liabilities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {report.grouped.LIABILITY.length === 0 ? (
                <p className="text-sm text-muted-foreground">No liability accounts with balances</p>
              ) : (
                <>
                  <div className="space-y-2">
                    {report.grouped.LIABILITY.map((account) => (
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
                    <span>Total Liabilities</span>
                    <span className="font-mono tabular-nums">
                      ${report.totals.liabilities.toFixed(2)}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Equity */}
          <Card>
            <CardHeader>
              <CardTitle>Equity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {report.grouped.EQUITY.length === 0 && report.incomeStatement.netIncome === 0 ? (
                <p className="text-sm text-muted-foreground">No equity accounts with balances</p>
              ) : (
                <>
                  <div className="space-y-2">
                    {report.grouped.EQUITY.map((account) => (
                      <div key={account.accountId} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {account.accountNumber} - {account.accountName}
                        </span>
                        <span className="font-mono tabular-nums">
                          ${account.balance.toFixed(2)}
                        </span>
                      </div>
                    ))}
                    {report.incomeStatement.netIncome !== 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Net Income (Current Period)</span>
                        <span className="font-mono tabular-nums">
                          ${report.incomeStatement.netIncome.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between font-bold text-base border-t pt-2">
                    <span>Total Equity</span>
                    <span className="font-mono tabular-nums">
                      ${report.totals.equity.toFixed(2)}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Balance Sheet Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-base">
              <span className="font-medium">Total Assets</span>
              <span className="font-mono tabular-nums font-medium">
                ${report.balanceSheet.totalAssets.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-base border-t pt-2">
              <span className="font-medium">Total Liabilities</span>
              <span className="font-mono tabular-nums">
                ${report.balanceSheet.totalLiabilities.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-base">
              <span className="font-medium">Total Equity</span>
              <span className="font-mono tabular-nums">
                ${report.balanceSheet.totalEquity.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-base font-bold border-t-2 pt-2">
              <span>Liabilities + Equity</span>
              <span className="font-mono tabular-nums">
                ${(report.balanceSheet.totalLiabilities + report.balanceSheet.totalEquity).toFixed(2)}
              </span>
            </div>
            {!report.balanceSheet.balanced && (
              <div className="flex justify-between text-base text-destructive border-t pt-2">
                <span>Difference</span>
                <span className="font-mono tabular-nums">
                  ${Math.abs(
                    report.balanceSheet.totalAssets -
                    (report.balanceSheet.totalLiabilities + report.balanceSheet.totalEquity)
                  ).toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
