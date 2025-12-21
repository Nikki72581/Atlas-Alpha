import { prisma } from "@/lib/db"
import { AccountType } from "@prisma/client"

export type AccountBalance = {
  accountId: string
  accountNumber: string
  accountName: string
  accountType: AccountType
  debitTotal: number
  creditTotal: number
  balance: number
}

/**
 * Calculate the balance for all accounts in an organization
 * Balance calculation follows standard accounting rules:
 * - Assets: Debit increases, Credit decreases (normal debit balance)
 * - Expenses: Debit increases, Credit decreases (normal debit balance)
 * - Liabilities: Credit increases, Debit decreases (normal credit balance)
 * - Equity: Credit increases, Debit decreases (normal credit balance)
 * - Revenue: Credit increases, Debit decreases (normal credit balance)
 */
export async function calculateAccountBalances(
  organizationId: string,
  options?: {
    asOfDate?: Date
    accountIds?: string[]
    includeZeroBalances?: boolean
  }
): Promise<AccountBalance[]> {
  const { asOfDate, accountIds, includeZeroBalances = false } = options || {}

  // Build where clause for journal lines
  const journalWhere: any = {
    journalEntry: {
      organizationId,
      status: "POSTED", // Only include posted entries
    },
  }

  if (asOfDate) {
    journalWhere.journalEntry.postingDate = { lte: asOfDate }
  }

  if (accountIds && accountIds.length > 0) {
    journalWhere.accountId = { in: accountIds }
  }

  // Get all journal lines with account information
  const journalLines = await prisma.journalLine.findMany({
    where: journalWhere,
    include: {
      account: true,
      journalEntry: true,
    },
  })

  // Group by account and calculate totals
  const accountMap = new Map<string, AccountBalance>()

  for (const line of journalLines) {
    const { account } = line
    const debit = Number(line.debit)
    const credit = Number(line.credit)

    if (!accountMap.has(account.id)) {
      accountMap.set(account.id, {
        accountId: account.id,
        accountNumber: account.number,
        accountName: account.name,
        accountType: account.type,
        debitTotal: 0,
        creditTotal: 0,
        balance: 0,
      })
    }

    const accountBalance = accountMap.get(account.id)!
    accountBalance.debitTotal += debit
    accountBalance.creditTotal += credit
  }

  // Calculate final balances based on account type
  const balances = Array.from(accountMap.values()).map((balance) => {
    const netDebitCredit = balance.debitTotal - balance.creditTotal

    // Normal debit balance accounts (Assets, Expenses)
    if (balance.accountType === "ASSET" || balance.accountType === "EXPENSE") {
      balance.balance = netDebitCredit
    }
    // Normal credit balance accounts (Liabilities, Equity, Revenue)
    else {
      balance.balance = -netDebitCredit
    }

    return balance
  })

  // Filter out zero balances if requested
  const filtered = includeZeroBalances
    ? balances
    : balances.filter((b) => Math.abs(b.balance) > 0.01)

  // Sort by account number
  return filtered.sort((a, b) => a.accountNumber.localeCompare(b.accountNumber))
}

/**
 * Calculate trial balance (total debits and credits for all accounts)
 * The trial balance should always balance (total debits = total credits)
 */
export async function calculateTrialBalance(
  organizationId: string,
  options?: {
    asOfDate?: Date
  }
) {
  const balances = await calculateAccountBalances(organizationId, {
    ...options,
    includeZeroBalances: true,
  })

  const totalDebits = balances.reduce((sum, b) => sum + b.debitTotal, 0)
  const totalCredits = balances.reduce((sum, b) => sum + b.creditTotal, 0)
  const difference = Math.abs(totalDebits - totalCredits)

  return {
    balances,
    totalDebits,
    totalCredits,
    difference,
    isBalanced: difference < 0.01,
  }
}

/**
 * Get account balances grouped by account type
 * Useful for financial statement preparation
 */
export async function getBalancesByAccountType(
  organizationId: string,
  options?: {
    asOfDate?: Date
  }
) {
  const balances = await calculateAccountBalances(organizationId, {
    ...options,
    includeZeroBalances: false,
  })

  const grouped = {
    ASSET: balances.filter((b) => b.accountType === "ASSET"),
    LIABILITY: balances.filter((b) => b.accountType === "LIABILITY"),
    EQUITY: balances.filter((b) => b.accountType === "EQUITY"),
    REVENUE: balances.filter((b) => b.accountType === "REVENUE"),
    EXPENSE: balances.filter((b) => b.accountType === "EXPENSE"),
  }

  const totals = {
    assets: grouped.ASSET.reduce((sum, b) => sum + b.balance, 0),
    liabilities: grouped.LIABILITY.reduce((sum, b) => sum + b.balance, 0),
    equity: grouped.EQUITY.reduce((sum, b) => sum + b.balance, 0),
    revenue: grouped.REVENUE.reduce((sum, b) => sum + b.balance, 0),
    expenses: grouped.EXPENSE.reduce((sum, b) => sum + b.balance, 0),
  }

  // Calculate derived totals
  totals.equity += totals.revenue - totals.expenses // Add net income to equity

  return {
    grouped,
    totals,
    balanceSheet: {
      totalAssets: totals.assets,
      totalLiabilities: totals.liabilities,
      totalEquity: totals.equity,
      balanced: Math.abs(totals.assets - (totals.liabilities + totals.equity)) < 0.01,
    },
    incomeStatement: {
      totalRevenue: totals.revenue,
      totalExpenses: totals.expenses,
      netIncome: totals.revenue - totals.expenses,
    },
  }
}
