"use server"

import { prisma } from "@/lib/db"
import { DEMO_ORG_ID } from "@/lib/demo-org"
import { revalidatePath } from "next/cache"
import { BankTransactionStatus, BankTransactionType } from "@prisma/client"
import { findMatchingRule, type CategoryRule as CategoryRuleType } from "@/lib/category-matcher"

export type TransactionImportData = {
  date: Date
  description: string
  amount: number
  type: "DEBIT" | "CREDIT"
}

export async function importTransactions(
  bankAccountId: string,
  transactions: TransactionImportData[]
) {
  try {
    // Verify bank account exists and is active
    const bankAccount = await prisma.bankAccount.findUnique({
      where: { id: bankAccountId },
    })

    if (!bankAccount) {
      return { success: false, error: "Bank account not found" }
    }

    if (!bankAccount.isActive) {
      return { success: false, error: "Bank account is inactive" }
    }

    // Get active category rules for auto-categorization
    const rules = await prisma.categoryRule.findMany({
      where: {
        organizationId: DEMO_ORG_ID,
        isActive: true,
      },
      orderBy: { priority: "desc" },
    })

    const categoryRules: CategoryRuleType[] = rules.map(r => ({
      id: r.id,
      name: r.name,
      pattern: r.pattern,
      patternType: r.patternType as "contains" | "startsWith" | "regex",
      categoryAccountId: r.categoryAccountId,
      priority: r.priority,
      isActive: r.isActive,
    }))

    // Generate import batch ID
    const importBatchId = `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    let categorizedCount = 0
    const ruleMatchCounts: Record<string, number> = {}

    // Create transactions
    const createdTransactions = await prisma.$transaction(
      transactions.map((txn) => {
        // Try to auto-categorize
        const match = findMatchingRule(txn.description, categoryRules)

        if (match) {
          categorizedCount++
          ruleMatchCounts[match.ruleId] = (ruleMatchCounts[match.ruleId] || 0) + 1
        }

        return prisma.bankTransaction.create({
          data: {
            bankAccountId,
            transactionDate: txn.date,
            description: txn.description,
            amount: txn.amount,
            transactionType: txn.type as BankTransactionType,
            status: match ? BankTransactionStatus.CATEGORIZED : BankTransactionStatus.PENDING,
            categoryAccountId: match?.categoryAccountId || null,
            categoryRuleId: match?.ruleId || null,
            importBatchId,
          },
        })
      })
    )

    // Update match counts for rules
    await Promise.all(
      Object.entries(ruleMatchCounts).map(([ruleId, count]) =>
        prisma.categoryRule.update({
          where: { id: ruleId },
          data: { matchCount: { increment: count } },
        })
      )
    )

    revalidatePath("/dashboard/finance/bank-transactions")

    return {
      success: true,
      imported: createdTransactions.length,
      categorized: categorizedCount,
      uncategorized: createdTransactions.length - categorizedCount,
      importBatchId,
    }
  } catch (error) {
    console.error("Failed to import transactions:", error)
    return {
      success: false,
      error: "Failed to import transactions",
    }
  }
}

export async function categorizeTransaction(
  transactionId: string,
  categoryAccountId: string
) {
  try {
    const transaction = await prisma.bankTransaction.findUnique({
      where: { id: transactionId },
    })

    if (!transaction) {
      return { success: false, error: "Transaction not found" }
    }

    await prisma.bankTransaction.update({
      where: { id: transactionId },
      data: {
        categoryAccountId,
        status: BankTransactionStatus.CATEGORIZED,
        categoryRuleId: null, // Manual categorization
      },
    })

    revalidatePath("/dashboard/finance/bank-transactions")
    return { success: true }
  } catch (error) {
    console.error("Failed to categorize transaction:", error)
    return { success: false, error: "Failed to categorize transaction" }
  }
}

export async function bulkCategorize(
  transactionIds: string[],
  categoryAccountId: string
) {
  try {
    await prisma.bankTransaction.updateMany({
      where: { id: { in: transactionIds } },
      data: {
        categoryAccountId,
        status: BankTransactionStatus.CATEGORIZED,
        categoryRuleId: null,
      },
    })

    revalidatePath("/dashboard/finance/bank-transactions")
    return { success: true, updated: transactionIds.length }
  } catch (error) {
    console.error("Failed to bulk categorize:", error)
    return { success: false, error: "Failed to categorize transactions" }
  }
}

export async function excludeTransaction(transactionId: string) {
  try {
    await prisma.bankTransaction.update({
      where: { id: transactionId },
      data: {
        status: BankTransactionStatus.EXCLUDED,
      },
    })

    revalidatePath("/dashboard/finance/bank-transactions")
    return { success: true }
  } catch (error) {
    console.error("Failed to exclude transaction:", error)
    return { success: false, error: "Failed to exclude transaction" }
  }
}

export async function deleteTransaction(transactionId: string) {
  try {
    await prisma.bankTransaction.delete({
      where: { id: transactionId },
    })

    revalidatePath("/dashboard/finance/bank-transactions")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete transaction:", error)
    return { success: false, error: "Failed to delete transaction" }
  }
}

export async function bulkDeleteTransactions(transactionIds: string[]) {
  try {
    await prisma.bankTransaction.deleteMany({
      where: { id: { in: transactionIds } },
    })

    revalidatePath("/dashboard/finance/bank-transactions")
    return { success: true, deleted: transactionIds.length }
  } catch (error) {
    console.error("Failed to bulk delete:", error)
    return { success: false, error: "Failed to delete transactions" }
  }
}

export async function getBankAccounts() {
  try {
    const accounts = await prisma.bankAccount.findMany({
      where: {
        organizationId: DEMO_ORG_ID,
        isActive: true,
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        bankName: true,
        accountNumber: true,
      },
    })
    return { success: true, accounts }
  } catch (error) {
    console.error("Failed to fetch bank accounts:", error)
    return { success: false, accounts: [] }
  }
}

export async function getCategoryAccounts() {
  try {
    const accounts = await prisma.account.findMany({
      where: {
        organizationId: DEMO_ORG_ID,
        isActive: true,
        type: { in: ["EXPENSE", "REVENUE"] },
      },
      orderBy: { number: "asc" },
      select: {
        id: true,
        number: true,
        name: true,
        type: true,
      },
    })
    return { success: true, accounts }
  } catch (error) {
    console.error("Failed to fetch category accounts:", error)
    return { success: false, accounts: [] }
  }
}

export async function getUncategorizedCount() {
  try {
    const count = await prisma.bankTransaction.count({
      where: {
        bankAccount: { organizationId: DEMO_ORG_ID },
        status: BankTransactionStatus.PENDING,
      },
    })
    return count
  } catch (error) {
    console.error("Failed to fetch uncategorized count:", error)
    return 0
  }
}

export async function applyRulesToUncategorized(ruleId?: string) {
  try {
    // Get rules to apply
    const rulesQuery = ruleId
      ? { id: ruleId, organizationId: DEMO_ORG_ID, isActive: true }
      : { organizationId: DEMO_ORG_ID, isActive: true }

    const rules = await prisma.categoryRule.findMany({
      where: rulesQuery,
      orderBy: { priority: "desc" },
    })

    if (rules.length === 0) {
      return { success: false, error: "No active rules found" }
    }

    const categoryRules: CategoryRuleType[] = rules.map(r => ({
      id: r.id,
      name: r.name,
      pattern: r.pattern,
      patternType: r.patternType as "contains" | "startsWith" | "regex",
      categoryAccountId: r.categoryAccountId,
      priority: r.priority,
      isActive: r.isActive,
    }))

    // Get uncategorized transactions
    const transactions = await prisma.bankTransaction.findMany({
      where: {
        bankAccount: { organizationId: DEMO_ORG_ID },
        status: BankTransactionStatus.PENDING,
      },
    })

    let matchedCount = 0
    const ruleMatchCounts: Record<string, number> = {}

    // Apply rules to each transaction
    for (const txn of transactions) {
      const match = findMatchingRule(txn.description, categoryRules)

      if (match) {
        await prisma.bankTransaction.update({
          where: { id: txn.id },
          data: {
            categoryAccountId: match.categoryAccountId,
            categoryRuleId: match.ruleId,
            status: BankTransactionStatus.CATEGORIZED,
          },
        })
        matchedCount++
        ruleMatchCounts[match.ruleId] = (ruleMatchCounts[match.ruleId] || 0) + 1
      }
    }

    // Update match counts
    await Promise.all(
      Object.entries(ruleMatchCounts).map(([id, count]) =>
        prisma.categoryRule.update({
          where: { id },
          data: { matchCount: { increment: count } },
        })
      )
    )

    revalidatePath("/dashboard/finance/bank-transactions")

    return {
      success: true,
      processed: transactions.length,
      matched: matchedCount,
    }
  } catch (error) {
    console.error("Failed to apply rules:", error)
    return { success: false, error: "Failed to apply rules" }
  }
}
