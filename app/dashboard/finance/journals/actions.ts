"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { DEMO_ORG_ID } from "@/lib/demo-org"
import { validateDimensions } from "@/lib/dimensions"

export type JournalLineFormData = {
  lineNo: number
  accountId: string
  debit: number
  credit: number
  memo?: string
  dimensions?: Record<string, string>
}

export type JournalFormData = {
  journalNo: string
  description?: string
  postingDate: Date | string
  lines: JournalLineFormData[]
}

// Validate that debits equal credits
function validateBalance(lines: JournalLineFormData[]): { valid: boolean; message?: string } {
  const totalDebits = lines.reduce((sum, line) => sum + Number(line.debit), 0)
  const totalCredits = lines.reduce((sum, line) => sum + Number(line.credit), 0)

  // Use a small epsilon for floating point comparison
  const diff = Math.abs(totalDebits - totalCredits)
  if (diff > 0.01) {
    return {
      valid: false,
      message: `Journal entry is out of balance. Debits: ${totalDebits.toFixed(2)}, Credits: ${totalCredits.toFixed(2)}, Difference: ${diff.toFixed(2)}`
    }
  }

  return { valid: true }
}

// Validate that each line has either debit OR credit (not both, not neither)
function validateLines(lines: JournalLineFormData[]): { valid: boolean; message?: string } {
  if (lines.length < 2) {
    return { valid: false, message: "Journal entry must have at least 2 lines" }
  }

  for (const line of lines) {
    const debit = Number(line.debit)
    const credit = Number(line.credit)

    if (debit > 0 && credit > 0) {
      return { valid: false, message: `Line ${line.lineNo}: Cannot have both debit and credit` }
    }

    if (debit === 0 && credit === 0) {
      return { valid: false, message: `Line ${line.lineNo}: Must have either debit or credit` }
    }

    if (debit < 0 || credit < 0) {
      return { valid: false, message: `Line ${line.lineNo}: Amounts cannot be negative` }
    }
  }

  return { valid: true }
}

// Validate dimensions for journal lines
async function validateJournalDimensions(lines: JournalLineFormData[]): Promise<{ valid: boolean; message?: string }> {
  // Get all accounts for the lines
  const accountIds = lines.map(l => l.accountId).filter(Boolean)
  if (accountIds.length === 0) {
    return { valid: true }
  }

  const accounts = await prisma.account.findMany({
    where: { id: { in: accountIds } },
    select: { id: true, type: true, number: true, name: true },
  })

  // @ts-ignore - Prisma types being difficult
  const accountMap = new Map(accounts.map((a) => [a.id, a]))

  // Validate dimensions for each line
  for (const line of lines) {
    if (!line.accountId) continue

    const account = accountMap.get(line.accountId)
    if (!account) continue

    // @ts-ignore - Prisma types being difficult
    const dimValidation = validateDimensions(line.dimensions, account.type)
    if (!dimValidation.valid) {
      return {
        valid: false,
        // @ts-ignore - Prisma types being difficult
        message: `Line ${line.lineNo} (${account.number} - ${account.name}): ${dimValidation.errors.join(", ")}`
      }
    }
  }

  return { valid: true }
}

export async function createJournalEntry(data: JournalFormData) {
  try {
    // Validate lines
    const lineValidation = validateLines(data.lines)
    if (!lineValidation.valid) {
      return { success: false, error: lineValidation.message }
    }

    // Validate balance
    const balanceValidation = validateBalance(data.lines)
    if (!balanceValidation.valid) {
      return { success: false, error: balanceValidation.message }
    }

    // Validate dimensions
    const dimensionValidation = await validateJournalDimensions(data.lines)
    if (!dimensionValidation.valid) {
      return { success: false, error: dimensionValidation.message }
    }

    // Check for duplicate journal number
    const existing = await prisma.journalEntry.findUnique({
      where: {
        organizationId_journalNo: {
          organizationId: DEMO_ORG_ID,
          journalNo: data.journalNo,
        },
      },
    })

    if (existing) {
      return { success: false, error: "Journal number already exists" }
    }

    // Create journal entry with lines
    const journalEntry = await prisma.journalEntry.create({
      data: {
        organizationId: DEMO_ORG_ID,
        journalNo: data.journalNo,
        description: data.description,
        postingDate: new Date(data.postingDate),
        status: "DRAFT",
        lines: {
          create: data.lines.map((line) => ({
            lineNo: line.lineNo,
            account: {
              connect: { id: line.accountId },
            },
            debit: line.debit,
            credit: line.credit,
            memo: line.memo,
            ...(line.dimensions && { dimensions: line.dimensions }),
          })),
        },
      },
    })

    revalidatePath("/dashboard/finance/journals")
    return { success: true, data: journalEntry }
  } catch (error) {
    console.error("Error creating journal entry:", error)
    return { success: false, error: "Failed to create journal entry" }
  }
}

export async function updateJournalEntry(id: string, data: JournalFormData) {
  try {
    // Check if journal entry exists and is a draft
    const existing = await prisma.journalEntry.findUnique({
      where: { id },
    })

    if (!existing) {
      return { success: false, error: "Journal entry not found" }
    }

    if (existing.status === "POSTED") {
      return { success: false, error: "Cannot edit posted journal entries. Create a reversing entry instead." }
    }

    // Validate lines
    const lineValidation = validateLines(data.lines)
    if (!lineValidation.valid) {
      return { success: false, error: lineValidation.message }
    }

    // Validate balance
    const balanceValidation = validateBalance(data.lines)
    if (!balanceValidation.valid) {
      return { success: false, error: balanceValidation.message }
    }

    // Validate dimensions
    const dimensionValidation = await validateJournalDimensions(data.lines)
    if (!dimensionValidation.valid) {
      return { success: false, error: dimensionValidation.message }
    }

    // Update journal entry
    const journalEntry = await prisma.journalEntry.update({
      where: { id },
      data: {
        description: data.description,
        postingDate: new Date(data.postingDate),
        lines: {
          // Delete existing lines and create new ones
          deleteMany: {},
          create: data.lines.map((line) => ({
            lineNo: line.lineNo,
            account: {
              connect: { id: line.accountId },
            },
            debit: line.debit,
            credit: line.credit,
            memo: line.memo,
            ...(line.dimensions && { dimensions: line.dimensions }),
          })),
        },
      },
    })

    revalidatePath("/dashboard/finance/journals")
    return { success: true, data: journalEntry }
  } catch (error) {
    console.error("Error updating journal entry:", error)
    return { success: false, error: "Failed to update journal entry" }
  }
}

export async function postJournalEntry(id: string) {
  try {
    // Check if journal entry exists and is a draft
    const existing = await prisma.journalEntry.findUnique({
      where: { id },
      include: { lines: true },
    })

    if (!existing) {
      return { success: false, error: "Journal entry not found" }
    }

    if (existing.status === "POSTED") {
      return { success: false, error: "Journal entry is already posted" }
    }

    // Validate lines one more time before posting
    const lines = existing.lines.map(line => ({
      lineNo: line.lineNo,
      accountId: line.accountId,
      debit: Number(line.debit),
      credit: Number(line.credit),
      memo: line.memo || undefined,
    }))

    const lineValidation = validateLines(lines)
    if (!lineValidation.valid) {
      return { success: false, error: lineValidation.message }
    }

    const balanceValidation = validateBalance(lines)
    if (!balanceValidation.valid) {
      return { success: false, error: balanceValidation.message }
    }

    // Post the journal entry (immutable once posted)
    const journalEntry = await prisma.journalEntry.update({
      where: { id },
      data: { status: "POSTED" },
    })

    revalidatePath("/dashboard/finance/journals")
    return { success: true, data: journalEntry }
  } catch (error) {
    console.error("Error posting journal entry:", error)
    return { success: false, error: "Failed to post journal entry" }
  }
}

export async function deleteJournalEntry(id: string) {
  try {
    // Check if journal entry exists and is a draft
    const existing = await prisma.journalEntry.findUnique({
      where: { id },
    })

    if (!existing) {
      return { success: false, error: "Journal entry not found" }
    }

    if (existing.status === "POSTED") {
      return { success: false, error: "Cannot delete posted journal entries. Create a reversing entry instead." }
    }

    // Delete journal entry (lines will be cascade deleted)
    await prisma.journalEntry.delete({
      where: { id },
    })

    revalidatePath("/dashboard/finance/journals")
    return { success: true }
  } catch (error) {
    console.error("Error deleting journal entry:", error)
    return { success: false, error: "Failed to delete journal entry" }
  }
}

export async function createReversingEntry(id: string, reversalDate?: Date) {
  try {
    // Get the original journal entry
    const original = await prisma.journalEntry.findUnique({
      where: { id },
      include: { lines: true },
    })

    if (!original) {
      return { success: false, error: "Journal entry not found" }
    }

    if (original.status !== "POSTED") {
      return { success: false, error: "Can only reverse posted journal entries" }
    }

    // Generate new journal number
    const lastJournal = await prisma.journalEntry.findFirst({
      where: { organizationId: DEMO_ORG_ID },
      orderBy: { journalNo: "desc" },
    })

    const lastNumber = lastJournal ? parseInt(lastJournal.journalNo.split("-")[1]) : 0
    const newJournalNo = `JE-${String(lastNumber + 1).padStart(4, "0")}`

    // Create reversing entry with flipped debits/credits
    const reversingEntry = await prisma.journalEntry.create({
      data: {
        organizationId: DEMO_ORG_ID,
        journalNo: newJournalNo,
        description: `Reversal of ${original.journalNo}: ${original.description || ""}`,
        postingDate: reversalDate || new Date(),
        status: "DRAFT",
        lines: {
          create: original.lines.map((line) => ({
            lineNo: line.lineNo,
            account: {
              connect: { id: line.accountId },
            },
            // Flip debit and credit
            debit: line.credit,
            credit: line.debit,
            memo: line.memo ? `Reversal: ${line.memo}` : "Reversal entry",
            ...(line.dimensions && { dimensions: line.dimensions }),
          })),
        },
      },
    })

    revalidatePath("/dashboard/finance/journals")
    return { success: true, data: reversingEntry }
  } catch (error) {
    console.error("Error creating reversing entry:", error)
    return { success: false, error: "Failed to create reversing entry" }
  }
}

export async function getNextJournalNumber() {
  try {
    const lastJournal = await prisma.journalEntry.findFirst({
      where: { organizationId: DEMO_ORG_ID },
      orderBy: { journalNo: "desc" },
    })

    const lastNumber = lastJournal ? parseInt(lastJournal.journalNo.split("-")[1]) : 0
    const nextNumber = `JE-${String(lastNumber + 1).padStart(4, "0")}`

    return { success: true, data: nextNumber }
  } catch (error) {
    console.error("Error getting next journal number:", error)
    return { success: false, error: "Failed to get next journal number" }
  }
}
