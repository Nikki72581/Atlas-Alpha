/**
 * CSV Parser utilities for bank transaction import
 */

export type ParsedRow = Record<string, string>

export type ColumnMapping = {
  date: string
  description: string
  amount?: string       // Single amount column (positive/negative)
  debit?: string        // Separate debit column
  credit?: string       // Separate credit column
}

export type ParsedTransaction = {
  date: Date
  description: string
  amount: number
  type: 'DEBIT' | 'CREDIT'
  rawRow: ParsedRow
}

/**
 * Parse CSV content into rows with headers
 */
export function parseCSV(content: string): { headers: string[]; rows: ParsedRow[] } {
  const lines = content.split(/\r?\n/).filter(line => line.trim() !== '')

  if (lines.length === 0) {
    return { headers: [], rows: [] }
  }

  const headers = parseCSVLine(lines[0])
  const rows: ParsedRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    const row: ParsedRow = {}

    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })

    rows.push(row)
  }

  return { headers, rows }
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"' && inQuotes && nextChar === '"') {
      // Escaped quote
      current += '"'
      i++
    } else if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  values.push(current.trim())
  return values
}

/**
 * Auto-detect column mapping based on common header names
 */
export function detectColumnMapping(headers: string[]): Partial<ColumnMapping> {
  const mapping: Partial<ColumnMapping> = {}
  const lowerHeaders = headers.map(h => h.toLowerCase())

  // Date column detection
  const datePatterns = ['date', 'transaction date', 'trans date', 'posted date', 'posting date']
  const dateIndex = lowerHeaders.findIndex(h =>
    datePatterns.some(p => h.includes(p))
  )
  if (dateIndex >= 0) mapping.date = headers[dateIndex]

  // Description column detection
  const descPatterns = ['description', 'memo', 'narration', 'details', 'transaction description', 'payee']
  const descIndex = lowerHeaders.findIndex(h =>
    descPatterns.some(p => h.includes(p))
  )
  if (descIndex >= 0) mapping.description = headers[descIndex]

  // Amount column detection (single column or debit/credit)
  const amountPatterns = ['amount', 'transaction amount', 'trans amount']
  const amountIndex = lowerHeaders.findIndex(h =>
    amountPatterns.some(p => h.includes(p)) && !h.includes('debit') && !h.includes('credit')
  )
  if (amountIndex >= 0) {
    mapping.amount = headers[amountIndex]
  } else {
    // Look for separate debit/credit columns
    const debitPatterns = ['debit', 'debit amount', 'withdrawal', 'withdrawals']
    const creditPatterns = ['credit', 'credit amount', 'deposit', 'deposits']

    const debitIndex = lowerHeaders.findIndex(h =>
      debitPatterns.some(p => h.includes(p))
    )
    const creditIndex = lowerHeaders.findIndex(h =>
      creditPatterns.some(p => h.includes(p))
    )

    if (debitIndex >= 0) mapping.debit = headers[debitIndex]
    if (creditIndex >= 0) mapping.credit = headers[creditIndex]
  }

  return mapping
}

/**
 * Parse date string in various formats
 */
function parseDate(dateStr: string): Date | null {
  const cleaned = dateStr.trim()

  // Try various date formats
  const formats = [
    // MM/DD/YYYY
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    // YYYY-MM-DD
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
    // DD-MM-YYYY
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
    // MM-DD-YYYY
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
  ]

  // Try MM/DD/YYYY or MM-DD-YYYY
  let match = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (match) {
    const [, month, day, year] = match
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    if (!isNaN(date.getTime())) return date
  }

  // Try YYYY-MM-DD
  match = cleaned.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/)
  if (match) {
    const [, year, month, day] = match
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    if (!isNaN(date.getTime())) return date
  }

  // Fallback to native parsing
  const parsed = new Date(cleaned)
  return isNaN(parsed.getTime()) ? null : parsed
}

/**
 * Parse amount string to number
 */
function parseAmount(amountStr: string): number | null {
  if (!amountStr || amountStr.trim() === '') return null

  // Remove currency symbols and whitespace
  let cleaned = amountStr.trim().replace(/[$,\s]/g, '')

  // Handle parentheses for negative numbers
  const isNegativeParens = cleaned.startsWith('(') && cleaned.endsWith(')')
  if (isNegativeParens) {
    cleaned = '-' + cleaned.slice(1, -1)
  }

  const amount = parseFloat(cleaned)
  return isNaN(amount) ? null : amount
}

/**
 * Transform parsed rows into transactions using column mapping
 */
export function transformRows(
  rows: ParsedRow[],
  mapping: ColumnMapping
): { transactions: ParsedTransaction[]; errors: { row: number; error: string }[] } {
  const transactions: ParsedTransaction[] = []
  const errors: { row: number; error: string }[] = []

  rows.forEach((row, index) => {
    // Parse date
    const dateStr = row[mapping.date]
    const date = parseDate(dateStr)
    if (!date) {
      errors.push({ row: index + 2, error: `Invalid date: "${dateStr}"` })
      return
    }

    // Parse description
    const description = row[mapping.description]?.trim()
    if (!description) {
      errors.push({ row: index + 2, error: 'Missing description' })
      return
    }

    // Parse amount
    let amount: number | null = null
    let type: 'DEBIT' | 'CREDIT' = 'DEBIT'

    if (mapping.amount) {
      // Single amount column
      amount = parseAmount(row[mapping.amount])
      if (amount !== null) {
        if (amount < 0) {
          type = 'DEBIT'
          amount = Math.abs(amount)
        } else {
          type = 'CREDIT'
        }
      }
    } else if (mapping.debit || mapping.credit) {
      // Separate debit/credit columns
      const debitAmount = mapping.debit ? parseAmount(row[mapping.debit]) : null
      const creditAmount = mapping.credit ? parseAmount(row[mapping.credit]) : null

      if (debitAmount && debitAmount !== 0) {
        amount = Math.abs(debitAmount)
        type = 'DEBIT'
      } else if (creditAmount && creditAmount !== 0) {
        amount = Math.abs(creditAmount)
        type = 'CREDIT'
      }
    }

    if (amount === null || amount === 0) {
      errors.push({ row: index + 2, error: 'Invalid or missing amount' })
      return
    }

    transactions.push({
      date,
      description,
      amount,
      type,
      rawRow: row,
    })
  })

  return { transactions, errors }
}

/**
 * Validate column mapping
 */
export function validateMapping(mapping: Partial<ColumnMapping>): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!mapping.date) {
    errors.push('Date column is required')
  }

  if (!mapping.description) {
    errors.push('Description column is required')
  }

  if (!mapping.amount && !mapping.debit && !mapping.credit) {
    errors.push('Amount column or Debit/Credit columns are required')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
