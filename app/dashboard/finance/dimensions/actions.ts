"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { DEMO_ORG_ID } from "@/lib/demo-org"
import { DimensionType } from "@prisma/client"

export type DimensionDefinitionFormData = {
  code: string
  name: string
  type: DimensionType
  isRequired: boolean
  isActive: boolean
  accountTypes?: string[]
  sortOrder?: number
}

export type DimensionValueFormData = {
  code: string
  name: string
  isActive: boolean
  sortOrder?: number
}

/**
 * Toggle dimensions feature for organization
 */
export async function toggleDimensions(enabled: boolean) {
  try {
    await prisma.organization.update({
      where: { id: DEMO_ORG_ID },
      data: { dimensionsEnabled: enabled },
    })

    revalidatePath("/dashboard/finance/dimensions")
    revalidatePath("/dashboard/settings")
    return { success: true }
  } catch (error) {
    console.error("Error toggling dimensions:", error)
    return { success: false, error: "Failed to toggle dimensions" }
  }
}

/**
 * Check if dimensions are enabled
 */
export async function areDimensionsEnabled() {
  const org = await prisma.organization.findUnique({
    where: { id: DEMO_ORG_ID },
    select: { dimensionsEnabled: true },
  })
  return org?.dimensionsEnabled ?? false
}

/**
 * Create dimension definition
 */
export async function createDimensionDefinition(data: DimensionDefinitionFormData) {
  try {
    // Check for duplicate code
    const existing = await prisma.dimensionDefinition.findUnique({
      where: {
        organizationId_code: {
          organizationId: DEMO_ORG_ID,
          code: data.code,
        },
      },
    })

    if (existing) {
      return { success: false, error: "Dimension code already exists" }
    }

    const dimension = await prisma.dimensionDefinition.create({
      data: {
        organizationId: DEMO_ORG_ID,
        code: data.code,
        name: data.name,
        type: data.type,
        isRequired: data.isRequired,
        isActive: data.isActive,
        ...(data.accountTypes && { accountTypes: data.accountTypes }),
        sortOrder: data.sortOrder || 0,
      },
    })

    revalidatePath("/dashboard/finance/dimensions")
    return { success: true, data: dimension }
  } catch (error) {
    console.error("Error creating dimension:", error)
    return { success: false, error: "Failed to create dimension" }
  }
}

/**
 * Update dimension definition
 */
export async function updateDimensionDefinition(id: string, data: DimensionDefinitionFormData) {
  try {
    const dimension = await prisma.dimensionDefinition.update({
      where: { id },
      data: {
        name: data.name,
        type: data.type,
        isRequired: data.isRequired,
        isActive: data.isActive,
        ...(data.accountTypes && { accountTypes: data.accountTypes }),
        sortOrder: data.sortOrder || 0,
      },
    })

    revalidatePath("/dashboard/finance/dimensions")
    return { success: true, data: dimension }
  } catch (error) {
    console.error("Error updating dimension:", error)
    return { success: false, error: "Failed to update dimension" }
  }
}

/**
 * Delete dimension definition
 */
export async function deleteDimensionDefinition(id: string) {
  try {
    // Check if dimension has values
    const dimension = await prisma.dimensionDefinition.findUnique({
      where: { id },
      include: { _count: { select: { values: true } } },
    })

    if (!dimension) {
      return { success: false, error: "Dimension not found" }
    }

    if (dimension._count.values > 0) {
      return {
        success: false,
        error: `Cannot delete dimension with ${dimension._count.values} values`,
      }
    }

    await prisma.dimensionDefinition.delete({
      where: { id },
    })

    revalidatePath("/dashboard/finance/dimensions")
    return { success: true }
  } catch (error) {
    console.error("Error deleting dimension:", error)
    return { success: false, error: "Failed to delete dimension" }
  }
}

/**
 * Create dimension value
 */
export async function createDimensionValue(dimensionDefinitionId: string, data: DimensionValueFormData) {
  try {
    // Check for duplicate code
    const existing = await prisma.dimensionValue.findUnique({
      where: {
        dimensionDefinitionId_code: {
          dimensionDefinitionId,
          code: data.code,
        },
      },
    })

    if (existing) {
      return { success: false, error: "Value code already exists for this dimension" }
    }

    const value = await prisma.dimensionValue.create({
      data: {
        organizationId: DEMO_ORG_ID,
        dimensionDefinitionId,
        code: data.code,
        name: data.name,
        isActive: data.isActive,
        sortOrder: data.sortOrder || 0,
      },
    })

    revalidatePath("/dashboard/finance/dimensions")
    return { success: true, data: value }
  } catch (error) {
    console.error("Error creating dimension value:", error)
    return { success: false, error: "Failed to create dimension value" }
  }
}

/**
 * Update dimension value
 */
export async function updateDimensionValue(id: string, data: DimensionValueFormData) {
  try {
    const value = await prisma.dimensionValue.update({
      where: { id },
      data: {
        name: data.name,
        isActive: data.isActive,
        sortOrder: data.sortOrder || 0,
      },
    })

    revalidatePath("/dashboard/finance/dimensions")
    return { success: true, data: value }
  } catch (error) {
    console.error("Error updating dimension value:", error)
    return { success: false, error: "Failed to update dimension value" }
  }
}

/**
 * Delete dimension value
 */
export async function deleteDimensionValue(id: string) {
  try {
    await prisma.dimensionValue.delete({
      where: { id },
    })

    revalidatePath("/dashboard/finance/dimensions")
    return { success: true }
  } catch (error) {
    console.error("Error deleting dimension value:", error)
    return { success: false, error: "Failed to delete dimension value" }
  }
}
