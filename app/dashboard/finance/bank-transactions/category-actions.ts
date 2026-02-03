"use server"

import { prisma } from "@/lib/db"
import { DEMO_ORG_ID } from "@/lib/demo-org"
import { revalidatePath } from "next/cache"

export type CategoryRuleFormData = {
  name: string
  pattern: string
  patternType: "contains" | "startsWith" | "regex"
  categoryAccountId: string
  priority: number
  isActive: boolean
}

export async function createCategoryRule(data: CategoryRuleFormData) {
  try {
    // Check if rule name already exists
    const existing = await prisma.categoryRule.findFirst({
      where: {
        organizationId: DEMO_ORG_ID,
        name: data.name,
      },
    })

    if (existing) {
      return {
        success: false,
        error: "A rule with this name already exists",
      }
    }

    // Validate regex if pattern type is regex
    if (data.patternType === "regex") {
      try {
        new RegExp(data.pattern)
      } catch {
        return {
          success: false,
          error: "Invalid regular expression pattern",
        }
      }
    }

    const rule = await prisma.categoryRule.create({
      data: {
        organizationId: DEMO_ORG_ID,
        name: data.name,
        pattern: data.pattern,
        patternType: data.patternType,
        categoryAccountId: data.categoryAccountId,
        priority: data.priority,
        isActive: data.isActive,
      },
    })

    revalidatePath("/dashboard/finance/bank-transactions")
    return { success: true, ruleId: rule.id }
  } catch (error) {
    console.error("Failed to create category rule:", error)
    return {
      success: false,
      error: "Failed to create category rule",
    }
  }
}

export async function updateCategoryRule(id: string, data: CategoryRuleFormData) {
  try {
    // Check if rule name is being changed and if it already exists
    const existing = await prisma.categoryRule.findFirst({
      where: {
        organizationId: DEMO_ORG_ID,
        name: data.name,
        NOT: { id },
      },
    })

    if (existing) {
      return {
        success: false,
        error: "A rule with this name already exists",
      }
    }

    // Validate regex if pattern type is regex
    if (data.patternType === "regex") {
      try {
        new RegExp(data.pattern)
      } catch {
        return {
          success: false,
          error: "Invalid regular expression pattern",
        }
      }
    }

    await prisma.categoryRule.update({
      where: { id },
      data: {
        name: data.name,
        pattern: data.pattern,
        patternType: data.patternType,
        categoryAccountId: data.categoryAccountId,
        priority: data.priority,
        isActive: data.isActive,
      },
    })

    revalidatePath("/dashboard/finance/bank-transactions")
    return { success: true }
  } catch (error) {
    console.error("Failed to update category rule:", error)
    return {
      success: false,
      error: "Failed to update category rule",
    }
  }
}

export async function deleteCategoryRule(id: string) {
  try {
    // Clear the rule reference from transactions but keep categorization
    await prisma.bankTransaction.updateMany({
      where: { categoryRuleId: id },
      data: { categoryRuleId: null },
    })

    await prisma.categoryRule.delete({
      where: { id },
    })

    revalidatePath("/dashboard/finance/bank-transactions")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete category rule:", error)
    return {
      success: false,
      error: "Failed to delete category rule",
    }
  }
}

export async function toggleCategoryRuleStatus(id: string) {
  try {
    const rule = await prisma.categoryRule.findUnique({
      where: { id },
    })

    if (!rule) {
      return {
        success: false,
        error: "Rule not found",
      }
    }

    await prisma.categoryRule.update({
      where: { id },
      data: {
        isActive: !rule.isActive,
      },
    })

    revalidatePath("/dashboard/finance/bank-transactions")
    return { success: true }
  } catch (error) {
    console.error("Failed to toggle rule status:", error)
    return {
      success: false,
      error: "Failed to toggle rule status",
    }
  }
}

export async function getCategoryRules() {
  try {
    const rules = await prisma.categoryRule.findMany({
      where: { organizationId: DEMO_ORG_ID },
      include: {
        categoryAccount: {
          select: {
            number: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: [{ priority: "desc" }, { name: "asc" }],
    })
    return { success: true, rules }
  } catch (error) {
    console.error("Failed to fetch category rules:", error)
    return { success: false, rules: [] }
  }
}

export async function createRuleFromTransaction(
  transactionDescription: string,
  categoryAccountId: string,
  pattern?: string,
  patternType?: "contains" | "startsWith" | "regex"
) {
  try {
    // Generate a name based on the pattern
    const finalPattern = pattern || transactionDescription.split(" ").slice(0, 3).join(" ")
    const name = `Rule: ${finalPattern.substring(0, 30)}${finalPattern.length > 30 ? "..." : ""}`

    // Check if similar rule exists
    const existing = await prisma.categoryRule.findFirst({
      where: {
        organizationId: DEMO_ORG_ID,
        pattern: finalPattern,
      },
    })

    if (existing) {
      return {
        success: false,
        error: "A rule with this pattern already exists",
        existingRuleId: existing.id,
      }
    }

    const rule = await prisma.categoryRule.create({
      data: {
        organizationId: DEMO_ORG_ID,
        name,
        pattern: finalPattern,
        patternType: patternType || "contains",
        categoryAccountId,
        priority: 0,
        isActive: true,
      },
    })

    revalidatePath("/dashboard/finance/bank-transactions")
    return { success: true, ruleId: rule.id, ruleName: name }
  } catch (error) {
    console.error("Failed to create rule from transaction:", error)
    return {
      success: false,
      error: "Failed to create rule",
    }
  }
}
