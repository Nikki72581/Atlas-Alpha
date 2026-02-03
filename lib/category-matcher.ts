/**
 * Category rule matching logic for auto-categorization of bank transactions
 */

export type CategoryRule = {
  id: string
  name: string
  pattern: string
  patternType: 'contains' | 'startsWith' | 'regex'
  categoryAccountId: string
  priority: number
  isActive: boolean
}

export type MatchResult = {
  ruleId: string
  categoryAccountId: string
  ruleName: string
} | null

/**
 * Check if a description matches a single rule
 */
export function matchRule(description: string, rule: CategoryRule): boolean {
  if (!rule.isActive) return false

  const normalizedDescription = description.toLowerCase().trim()
  const normalizedPattern = rule.pattern.toLowerCase().trim()

  switch (rule.patternType) {
    case 'contains':
      return normalizedDescription.includes(normalizedPattern)

    case 'startsWith':
      return normalizedDescription.startsWith(normalizedPattern)

    case 'regex':
      try {
        const regex = new RegExp(rule.pattern, 'i')
        return regex.test(description)
      } catch {
        // Invalid regex, don't match
        return false
      }

    default:
      return false
  }
}

/**
 * Find the best matching rule for a description
 * Rules are matched by priority (higher priority wins)
 */
export function findMatchingRule(
  description: string,
  rules: CategoryRule[]
): MatchResult {
  // Sort rules by priority descending
  const sortedRules = [...rules].sort((a, b) => b.priority - a.priority)

  for (const rule of sortedRules) {
    if (matchRule(description, rule)) {
      return {
        ruleId: rule.id,
        categoryAccountId: rule.categoryAccountId,
        ruleName: rule.name,
      }
    }
  }

  return null
}

/**
 * Match multiple descriptions against rules
 * Returns a map of description to match result
 */
export function matchDescriptions(
  descriptions: string[],
  rules: CategoryRule[]
): Map<string, MatchResult> {
  const results = new Map<string, MatchResult>()

  for (const description of descriptions) {
    results.set(description, findMatchingRule(description, rules))
  }

  return results
}

/**
 * Test a pattern against a sample description
 */
export function testPattern(
  pattern: string,
  patternType: 'contains' | 'startsWith' | 'regex',
  sampleDescription: string
): { matches: boolean; error?: string } {
  const testRule: CategoryRule = {
    id: 'test',
    name: 'test',
    pattern,
    patternType,
    categoryAccountId: 'test',
    priority: 0,
    isActive: true,
  }

  if (patternType === 'regex') {
    try {
      new RegExp(pattern)
    } catch (e) {
      return { matches: false, error: 'Invalid regular expression' }
    }
  }

  return { matches: matchRule(sampleDescription, testRule) }
}

/**
 * Generate a suggested pattern from a description
 */
export function suggestPattern(description: string): {
  pattern: string
  patternType: 'contains' | 'startsWith'
} {
  // Extract key words (excluding common ones)
  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need',
    'debit', 'credit', 'card', 'purchase', 'pos', 'payment', 'transfer'
  ])

  // Clean and split description
  const cleaned = description.toLowerCase().replace(/[^a-z0-9\s]/g, ' ')
  const words = cleaned.split(/\s+/).filter(w => w.length > 2 && !commonWords.has(w))

  if (words.length === 0) {
    // Use first significant part of description
    const parts = description.split(/\s+/)
    return {
      pattern: parts.slice(0, 3).join(' '),
      patternType: 'contains',
    }
  }

  // Return first meaningful word/phrase
  return {
    pattern: words[0],
    patternType: 'contains',
  }
}

/**
 * Escape special regex characters in a string
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
