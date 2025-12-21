"use server"

import { prisma } from "@/lib/db"
import { DEMO_ORG_ID } from "@/lib/demo-org"
import { revalidatePath } from "next/cache"
import { AccountType } from "@prisma/client"

export type AccountFormData = {
  number: string
  name: string
  type: AccountType
  isActive: boolean
}

export async function createAccount(data: AccountFormData) {
  try {
    // Check if account number already exists
    const existing = await prisma.account.findFirst({
      where: {
        organizationId: DEMO_ORG_ID,
        number: data.number,
      },
    })

    if (existing) {
      return {
        success: false,
        error: "Account number already exists",
      }
    }

    await prisma.account.create({
      data: {
        organizationId: DEMO_ORG_ID,
        number: data.number,
        name: data.name,
        type: data.type,
        isActive: data.isActive,
      },
    })

    revalidatePath("/dashboard/finance/accounts")
    return { success: true }
  } catch (error) {
    console.error("Failed to create account:", error)
    return {
      success: false,
      error: "Failed to create account",
    }
  }
}

export async function updateAccount(id: string, data: AccountFormData) {
  try {
    // Check if account number is being changed and if it already exists
    const existing = await prisma.account.findFirst({
      where: {
        organizationId: DEMO_ORG_ID,
        number: data.number,
        NOT: { id },
      },
    })

    if (existing) {
      return {
        success: false,
        error: "Account number already exists",
      }
    }

    await prisma.account.update({
      where: { id },
      data: {
        number: data.number,
        name: data.name,
        type: data.type,
        isActive: data.isActive,
      },
    })

    revalidatePath("/dashboard/finance/accounts")
    return { success: true }
  } catch (error) {
    console.error("Failed to update account:", error)
    return {
      success: false,
      error: "Failed to update account",
    }
  }
}

export async function deleteAccount(id: string) {
  try {
    // Check if account has any journal lines
    const account = await prisma.account.findUnique({
      where: { id },
      include: {
        _count: {
          select: { journalLines: true },
        },
      },
    })

    if (!account) {
      return {
        success: false,
        error: "Account not found",
      }
    }

    if (account._count.journalLines > 0) {
      return {
        success: false,
        error: "Cannot delete account with journal entries. Deactivate it instead.",
      }
    }

    await prisma.account.delete({
      where: { id },
    })

    revalidatePath("/dashboard/finance/accounts")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete account:", error)
    return {
      success: false,
      error: "Failed to delete account",
    }
  }
}

export async function toggleAccountStatus(id: string) {
  try {
    const account = await prisma.account.findUnique({
      where: { id },
    })

    if (!account) {
      return {
        success: false,
        error: "Account not found",
      }
    }

    await prisma.account.update({
      where: { id },
      data: {
        isActive: !account.isActive,
      },
    })

    revalidatePath("/dashboard/finance/accounts")
    return { success: true }
  } catch (error) {
    console.error("Failed to toggle account status:", error)
    return {
      success: false,
      error: "Failed to toggle account status",
    }
  }
}
