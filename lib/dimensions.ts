import { AccountType } from "@prisma/client"

/**
 * Dimension Configuration
 *
 * Dimensions provide flexible tagging/segmentation of journal entries
 * following the AtlasConcepts principle: "Dimensions are first-class, not bolted onto account numbers"
 */

export type DimensionType = "DEPARTMENT" | "PROJECT" | "LOCATION" | "ENTITY" | "CUSTOMER" | "VENDOR"

export type DimensionDefinition = {
  code: string
  name: string
  type: DimensionType
  required: boolean
  accountTypes?: AccountType[]
  validValues?: string[]
}

/**
 * Default dimension configuration
 * In a real system, this would be stored in the database per organization
 */
export const DEFAULT_DIMENSIONS: DimensionDefinition[] = [
  {
    code: "DEPT",
    name: "Department",
    type: "DEPARTMENT",
    required: false,
    accountTypes: ["EXPENSE"], // Required for expense accounts
  },
  {
    code: "PROJ",
    name: "Project",
    type: "PROJECT",
    required: false,
    accountTypes: ["REVENUE", "EXPENSE"], // Required for revenue/expense if project-based
  },
  {
    code: "LOC",
    name: "Location",
    type: "LOCATION",
    required: false,
  },
  {
    code: "ENTITY",
    name: "Entity",
    type: "ENTITY",
    required: false,
  },
]

/**
 * Dimension validation rule
 * Defines when a dimension is required based on account type
 */
export type DimensionRule = {
  dimensionCode: string
  accountTypes: AccountType[]
  required: boolean
  errorMessage: string
}

/**
 * Default dimension rules
 * Following AtlasConcepts: "Department required for expense accounts"
 */
export const DEFAULT_DIMENSION_RULES: DimensionRule[] = [
  {
    dimensionCode: "DEPT",
    accountTypes: ["EXPENSE"],
    required: true,
    errorMessage: "Department is required for expense accounts",
  },
  {
    dimensionCode: "PROJ",
    accountTypes: ["REVENUE"],
    required: false, // Optional but available
    errorMessage: "Project may be required for consulting revenue",
  },
]

/**
 * Validate dimensions for a journal line
 */
export function validateDimensions(
  dimensions: Record<string, string> | null | undefined,
  accountType: AccountType,
  rules: DimensionRule[] = DEFAULT_DIMENSION_RULES
): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const dims = dimensions || {}

  // Check each rule
  for (const rule of rules) {
    if (rule.required && rule.accountTypes.includes(accountType)) {
      const value = dims[rule.dimensionCode]
      if (!value || value.trim() === "") {
        errors.push(rule.errorMessage)
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Get available dimensions for an account type
 */
export function getAvailableDimensions(
  accountType: AccountType,
  dimensions: DimensionDefinition[] = DEFAULT_DIMENSIONS
): DimensionDefinition[] {
  return dimensions.filter(
    (dim) => !dim.accountTypes || dim.accountTypes.includes(accountType)
  )
}

/**
 * Check if a dimension is required for an account type
 */
export function isDimensionRequired(
  dimensionCode: string,
  accountType: AccountType,
  rules: DimensionRule[] = DEFAULT_DIMENSION_RULES
): boolean {
  const rule = rules.find((r) => r.dimensionCode === dimensionCode)
  if (!rule) return false
  return rule.required && rule.accountTypes.includes(accountType)
}

/**
 * Format dimensions for display
 */
export function formatDimensions(dimensions: Record<string, string> | null | undefined): string {
  if (!dimensions) return "-"
  const entries = Object.entries(dimensions)
  if (entries.length === 0) return "-"
  return entries.map(([key, value]) => `${key}: ${value}`).join(", ")
}

/**
 * Example dimension values for different types
 * In a real system, these would come from database lookups
 */
export const SAMPLE_DIMENSION_VALUES: Record<DimensionType, string[]> = {
  DEPARTMENT: ["Sales", "Marketing", "Engineering", "Operations", "Finance", "HR"],
  PROJECT: ["Project Alpha", "Project Beta", "Project Gamma", "Internal", "R&D"],
  LOCATION: ["HQ", "East Coast", "West Coast", "Remote", "International"],
  ENTITY: ["Parent Corp", "Subsidiary A", "Subsidiary B"],
  CUSTOMER: [], // Would be populated from Customer table
  VENDOR: [], // Would be populated from Vendor table
}

/**
 * Get sample values for a dimension
 */
export function getSampleDimensionValues(type: DimensionType): string[] {
  return SAMPLE_DIMENSION_VALUES[type] || []
}
