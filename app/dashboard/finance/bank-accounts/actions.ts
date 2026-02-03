"use server"

import { prisma } from "@/lib/db"
import { DEMO_ORG_ID } from "@/lib/demo-org"
import { revalidatePath } from "next/cache"
import { BankAccountType } from "@prisma/client"

export type BankAccountFormData = {
  name: string
  bankName: string
  accountNumber: string
  accountType: BankAccountType
  glAccountId: string
  currency: string
  isActive: boolean
}

export async function createBankAccount(data: BankAccountFormData) {
  try {
    // Check if bank account name already exists
    const existing = await prisma.bankAccount.findFirst({
      where: {
        organizationId: DEMO_ORG_ID,
        name: data.name,
      },
    })

    if (existing) {
      return {
        success: false,
        error: "A bank account with this name already exists",
      }
    }

    // Verify GL account exists and is an ASSET type
    const glAccount = await prisma.account.findUnique({
      where: { id: data.glAccountId },
    })

    if (!glAccount) {
      return {
        success: false,
        error: "Selected GL account not found",
      }
    }

    if (glAccount.type !== "ASSET") {
      return {
        success: false,
        error: "Bank accounts must be linked to an ASSET type GL account",
      }
    }

    await prisma.bankAccount.create({
      data: {
        organizationId: DEMO_ORG_ID,
        name: data.name,
        bankName: data.bankName || null,
        accountNumber: data.accountNumber || null,
        accountType: data.accountType,
        glAccountId: data.glAccountId,
        currency: data.currency || "USD",
        isActive: data.isActive,
      },
    })

    revalidatePath("/dashboard/finance/bank-accounts")
    return { success: true }
  } catch (error) {
    console.error("Failed to create bank account:", error)
    return {
      success: false,
      error: "Failed to create bank account",
    }
  }
}

export async function updateBankAccount(id: string, data: BankAccountFormData) {
  try {
    // Check if bank account name is being changed and if it already exists
    const existing = await prisma.bankAccount.findFirst({
      where: {
        organizationId: DEMO_ORG_ID,
        name: data.name,
        NOT: { id },
      },
    })

    if (existing) {
      return {
        success: false,
        error: "A bank account with this name already exists",
      }
    }

    // Verify GL account exists and is an ASSET type
    const glAccount = await prisma.account.findUnique({
      where: { id: data.glAccountId },
    })

    if (!glAccount) {
      return {
        success: false,
        error: "Selected GL account not found",
      }
    }

    if (glAccount.type !== "ASSET") {
      return {
        success: false,
        error: "Bank accounts must be linked to an ASSET type GL account",
      }
    }

    await prisma.bankAccount.update({
      where: { id },
      data: {
        name: data.name,
        bankName: data.bankName || null,
        accountNumber: data.accountNumber || null,
        accountType: data.accountType,
        glAccountId: data.glAccountId,
        currency: data.currency || "USD",
        isActive: data.isActive,
      },
    })

    revalidatePath("/dashboard/finance/bank-accounts")
    return { success: true }
  } catch (error) {
    console.error("Failed to update bank account:", error)
    return {
      success: false,
      error: "Failed to update bank account",
    }
  }
}

export async function deleteBankAccount(id: string) {
  try {
    // Check if bank account has any transactions
    const bankAccount = await prisma.bankAccount.findUnique({
      where: { id },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    })

    if (!bankAccount) {
      return {
        success: false,
        error: "Bank account not found",
      }
    }

    if (bankAccount._count.transactions > 0) {
      return {
        success: false,
        error: `Cannot delete bank account with ${bankAccount._count.transactions} transaction(s). Delete transactions first or deactivate the account.`,
      }
    }

    await prisma.bankAccount.delete({
      where: { id },
    })

    revalidatePath("/dashboard/finance/bank-accounts")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete bank account:", error)
    return {
      success: false,
      error: "Failed to delete bank account",
    }
  }
}

export async function toggleBankAccountStatus(id: string) {
  try {
    const bankAccount = await prisma.bankAccount.findUnique({
      where: { id },
    })

    if (!bankAccount) {
      return {
        success: false,
        error: "Bank account not found",
      }
    }

    await prisma.bankAccount.update({
      where: { id },
      data: {
        isActive: !bankAccount.isActive,
      },
    })

    revalidatePath("/dashboard/finance/bank-accounts")
    return { success: true }
  } catch (error) {
    console.error("Failed to toggle bank account status:", error)
    return {
      success: false,
      error: "Failed to toggle bank account status",
    }
  }
}

export async function getAssetAccounts() {
  try {
    const accounts = await prisma.account.findMany({
      where: {
        organizationId: DEMO_ORG_ID,
        type: "ASSET",
        isActive: true,
      },
      orderBy: { number: "asc" },
      select: {
        id: true,
        number: true,
        name: true,
      },
    })
    return { success: true, accounts }
  } catch (error) {
    console.error("Failed to fetch asset accounts:", error)
    return { success: false, accounts: [] }
  }
}
