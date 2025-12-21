"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { DEMO_ORG_ID } from "@/lib/demo-org"
import { PeriodStatus } from "@prisma/client"

export type PeriodFormData = {
  name: string
  startDate: Date | string
  endDate: Date | string
  fiscalYear: number
  periodNumber: number
}

/**
 * Create a new accounting period
 */
export async function createPeriod(data: PeriodFormData) {
  try {
    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate)

    // Validate dates
    if (endDate <= startDate) {
      return { success: false, error: "End date must be after start date" }
    }

    // Check for overlapping periods
    const overlapping = await prisma.period.findFirst({
      where: {
        organizationId: DEMO_ORG_ID,
        OR: [
          {
            AND: [
              { startDate: { lte: startDate } },
              { endDate: { gte: startDate } },
            ],
          },
          {
            AND: [
              { startDate: { lte: endDate } },
              { endDate: { gte: endDate } },
            ],
          },
          {
            AND: [
              { startDate: { gte: startDate } },
              { endDate: { lte: endDate } },
            ],
          },
        ],
      },
    })

    if (overlapping) {
      return {
        success: false,
        error: `Period overlaps with existing period: ${overlapping.name}`,
      }
    }

    // Check for duplicate fiscal year/period number
    const duplicate = await prisma.period.findUnique({
      where: {
        organizationId_fiscalYear_periodNumber: {
          organizationId: DEMO_ORG_ID,
          fiscalYear: data.fiscalYear,
          periodNumber: data.periodNumber,
        },
      },
    })

    if (duplicate) {
      return {
        success: false,
        error: `Period ${data.fiscalYear}-${data.periodNumber} already exists`,
      }
    }

    // Create period
    const period = await prisma.period.create({
      data: {
        organizationId: DEMO_ORG_ID,
        name: data.name,
        startDate,
        endDate,
        fiscalYear: data.fiscalYear,
        periodNumber: data.periodNumber,
        status: "OPEN",
      },
    })

    revalidatePath("/dashboard/finance/periods")
    return { success: true, data: period }
  } catch (error) {
    console.error("Error creating period:", error)
    return { success: false, error: "Failed to create period" }
  }
}

/**
 * Update an existing period (only if not closed)
 */
export async function updatePeriod(id: string, data: PeriodFormData) {
  try {
    const existing = await prisma.period.findUnique({
      where: { id },
    })

    if (!existing) {
      return { success: false, error: "Period not found" }
    }

    if (existing.status === "CLOSED" || existing.status === "LOCKED") {
      return { success: false, error: "Cannot update closed or locked periods" }
    }

    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate)

    if (endDate <= startDate) {
      return { success: false, error: "End date must be after start date" }
    }

    // Check for overlapping periods (excluding current period)
    const overlapping = await prisma.period.findFirst({
      where: {
        organizationId: DEMO_ORG_ID,
        id: { not: id },
        OR: [
          {
            AND: [
              { startDate: { lte: startDate } },
              { endDate: { gte: startDate } },
            ],
          },
          {
            AND: [
              { startDate: { lte: endDate } },
              { endDate: { gte: endDate } },
            ],
          },
          {
            AND: [
              { startDate: { gte: startDate } },
              { endDate: { lte: endDate } },
            ],
          },
        ],
      },
    })

    if (overlapping) {
      return {
        success: false,
        error: `Period overlaps with existing period: ${overlapping.name}`,
      }
    }

    const period = await prisma.period.update({
      where: { id },
      data: {
        name: data.name,
        startDate,
        endDate,
        fiscalYear: data.fiscalYear,
        periodNumber: data.periodNumber,
      },
    })

    revalidatePath("/dashboard/finance/periods")
    return { success: true, data: period }
  } catch (error) {
    console.error("Error updating period:", error)
    return { success: false, error: "Failed to update period" }
  }
}

/**
 * Delete a period (only if no journal entries and not closed)
 */
export async function deletePeriod(id: string) {
  try {
    const existing = await prisma.period.findUnique({
      where: { id },
      include: { journalEntries: true },
    })

    if (!existing) {
      return { success: false, error: "Period not found" }
    }

    if (existing.status === "CLOSED" || existing.status === "LOCKED") {
      return { success: false, error: "Cannot delete closed or locked periods" }
    }

    if (existing.journalEntries.length > 0) {
      return {
        success: false,
        error: `Cannot delete period with ${existing.journalEntries.length} journal entries`,
      }
    }

    await prisma.period.delete({
      where: { id },
    })

    revalidatePath("/dashboard/finance/periods")
    return { success: true }
  } catch (error) {
    console.error("Error deleting period:", error)
    return { success: false, error: "Failed to delete period" }
  }
}

/**
 * Close a period
 * This prevents new journal entries from being posted to this period
 */
export async function closePeriod(id: string) {
  try {
    const existing = await prisma.period.findUnique({
      where: { id },
      include: {
        journalEntries: {
          where: { status: "DRAFT" },
        },
      },
    })

    if (!existing) {
      return { success: false, error: "Period not found" }
    }

    if (existing.status === "CLOSED") {
      return { success: false, error: "Period is already closed" }
    }

    if (existing.status === "LOCKED") {
      return { success: false, error: "Period is locked and cannot be closed again" }
    }

    // Check for draft journal entries in this period
    if (existing.journalEntries.length > 0) {
      return {
        success: false,
        error: `Cannot close period with ${existing.journalEntries.length} draft journal entries. Post or delete them first.`,
      }
    }

    const period = await prisma.period.update({
      where: { id },
      data: {
        status: "CLOSED",
        closedAt: new Date(),
        closedBy: "system", // In production, this would be the current user ID
      },
    })

    revalidatePath("/dashboard/finance/periods")
    return { success: true, data: period }
  } catch (error) {
    console.error("Error closing period:", error)
    return { success: false, error: "Failed to close period" }
  }
}

/**
 * Reopen a closed period
 */
export async function reopenPeriod(id: string) {
  try {
    const existing = await prisma.period.findUnique({
      where: { id },
    })

    if (!existing) {
      return { success: false, error: "Period not found" }
    }

    if (existing.status === "LOCKED") {
      return {
        success: false,
        error: "Cannot reopen locked period. Unlock it first.",
      }
    }

    if (existing.status === "OPEN") {
      return { success: false, error: "Period is already open" }
    }

    const period = await prisma.period.update({
      where: { id },
      data: {
        status: "OPEN",
        closedAt: null,
        closedBy: null,
      },
    })

    revalidatePath("/dashboard/finance/periods")
    return { success: true, data: period }
  } catch (error) {
    console.error("Error reopening period:", error)
    return { success: false, error: "Failed to reopen period" }
  }
}

/**
 * Lock a period (permanent close - requires special permission)
 */
export async function lockPeriod(id: string) {
  try {
    const existing = await prisma.period.findUnique({
      where: { id },
    })

    if (!existing) {
      return { success: false, error: "Period not found" }
    }

    if (existing.status === "LOCKED") {
      return { success: false, error: "Period is already locked" }
    }

    if (existing.status === "OPEN") {
      return { success: false, error: "Period must be closed before locking" }
    }

    const period = await prisma.period.update({
      where: { id },
      data: {
        status: "LOCKED",
      },
    })

    revalidatePath("/dashboard/finance/periods")
    return { success: true, data: period }
  } catch (error) {
    console.error("Error locking period:", error)
    return { success: false, error: "Failed to lock period" }
  }
}

/**
 * Get the current open period for a given date
 */
export async function getCurrentPeriod(date?: Date) {
  const targetDate = date || new Date()

  const period = await prisma.period.findFirst({
    where: {
      organizationId: DEMO_ORG_ID,
      status: "OPEN",
      startDate: { lte: targetDate },
      endDate: { gte: targetDate },
    },
  })

  return period
}

/**
 * Generate periods for a fiscal year
 */
export async function generateFiscalYearPeriods(fiscalYear: number, startMonth: number = 1) {
  try {
    const periods: PeriodFormData[] = []

    // Generate 12 monthly periods
    for (let month = 0; month < 12; month++) {
      const periodNumber = month + 1
      const monthIndex = (startMonth - 1 + month) % 12
      const year = fiscalYear + Math.floor((startMonth - 1 + month) / 12)

      const startDate = new Date(year, monthIndex, 1)
      const endDate = new Date(year, monthIndex + 1, 0) // Last day of month

      const monthName = startDate.toLocaleDateString("en-US", { month: "long" })
      const name = `${monthName} ${year}`

      periods.push({
        name,
        startDate,
        endDate,
        fiscalYear,
        periodNumber,
      })
    }

    // Create all periods
    const results = []
    for (const periodData of periods) {
      const result = await createPeriod(periodData)
      results.push(result)
      if (!result.success) {
        return {
          success: false,
          error: `Failed to create period ${periodData.name}: ${result.error}`,
        }
      }
    }

    revalidatePath("/dashboard/finance/periods")
    return { success: true, data: results }
  } catch (error) {
    console.error("Error generating fiscal year periods:", error)
    return { success: false, error: "Failed to generate fiscal year periods" }
  }
}
