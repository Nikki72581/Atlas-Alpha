"use client"

import { useState, useCallback, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { DataTable, Td, Th, Tr } from "@/components/atlas/data-table"
import { ColumnMapper } from "./column-mapper"
import {
  parseCSV,
  detectColumnMapping,
  transformRows,
  validateMapping,
  type ColumnMapping,
  type ParsedTransaction,
  type ParsedRow,
} from "@/lib/csv-parser"
import { importTransactions, getBankAccounts, type TransactionImportData } from "./actions"
import {
  Upload,
  FileSpreadsheet,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react"

type BankAccount = {
  id: string
  name: string
  bankName: string | null
  accountNumber: string | null
}

type ImportDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportComplete?: () => void
}

type ImportStep = "upload" | "mapping" | "preview" | "importing" | "complete"

export function ImportDialog({ open, onOpenChange, onImportComplete }: ImportDialogProps) {
  const [step, setStep] = useState<ImportStep>("upload")
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<string>("")
  const [csvContent, setCsvContent] = useState<string>("")
  const [fileName, setFileName] = useState<string>("")
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [mapping, setMapping] = useState<Partial<ColumnMapping>>({})
  const [parsedTransactions, setParsedTransactions] = useState<ParsedTransaction[]>([])
  const [parseErrors, setParseErrors] = useState<{ row: number; error: string }[]>([])
  const [importResult, setImportResult] = useState<{
    imported: number
    categorized: number
    uncategorized: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Load bank accounts when dialog opens
  useEffect(() => {
    if (open) {
      loadBankAccounts()
      resetState()
    }
  }, [open])

  async function loadBankAccounts() {
    const result = await getBankAccounts()
    if (result.success) {
      setBankAccounts(result.accounts)
    }
  }

  function resetState() {
    setStep("upload")
    setSelectedAccountId("")
    setCsvContent("")
    setFileName("")
    setHeaders([])
    setRows([])
    setMapping({})
    setParsedTransactions([])
    setParseErrors([])
    setImportResult(null)
    setError(null)
  }

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setError(null)

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setCsvContent(content)

      // Parse CSV
      const { headers: parsedHeaders, rows: parsedRows } = parseCSV(content)

      if (parsedHeaders.length === 0) {
        setError("Could not parse CSV file. Please check the format.")
        return
      }

      setHeaders(parsedHeaders)
      setRows(parsedRows)

      // Auto-detect column mapping
      const detectedMapping = detectColumnMapping(parsedHeaders)
      setMapping(detectedMapping)
    }
    reader.readAsText(file)
  }, [])

  function handleNextFromUpload() {
    if (!selectedAccountId) {
      setError("Please select a bank account")
      return
    }
    if (headers.length === 0) {
      setError("Please upload a CSV file")
      return
    }
    setError(null)
    setStep("mapping")
  }

  function handleNextFromMapping() {
    const validation = validateMapping(mapping)
    if (!validation.valid) {
      setError(validation.errors.join(". "))
      return
    }

    // Transform rows to transactions
    const { transactions, errors } = transformRows(rows, mapping as ColumnMapping)
    setParsedTransactions(transactions)
    setParseErrors(errors)

    if (transactions.length === 0) {
      setError("No valid transactions found. Please check your column mapping.")
      return
    }

    setError(null)
    setStep("preview")
  }

  async function handleImport() {
    setIsLoading(true)
    setStep("importing")
    setError(null)

    const transactionData: TransactionImportData[] = parsedTransactions.map((txn) => ({
      date: txn.date,
      description: txn.description,
      amount: txn.amount,
      type: txn.type,
    }))

    const result = await importTransactions(selectedAccountId, transactionData)

    if (result.success) {
      setImportResult({
        imported: result.imported || 0,
        categorized: result.categorized || 0,
        uncategorized: result.uncategorized || 0,
      })
      setStep("complete")
      onImportComplete?.()
    } else {
      setError(result.error || "Import failed")
      setStep("preview")
    }

    setIsLoading(false)
  }

  function handleClose() {
    resetState()
    onOpenChange(false)
  }

  const selectedAccount = bankAccounts.find((a) => a.id === selectedAccountId)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Bank Transactions
          </DialogTitle>
          <DialogDescription>
            {step === "upload" && "Select a bank account and upload your CSV file."}
            {step === "mapping" && "Map the CSV columns to transaction fields."}
            {step === "preview" && "Review the parsed transactions before importing."}
            {step === "importing" && "Importing transactions..."}
            {step === "complete" && "Import completed successfully!"}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 px-2">
          {["upload", "mapping", "preview", "complete"].map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  step === s
                    ? "bg-primary text-primary-foreground"
                    : step === "complete" ||
                      (step === "importing" && i < 3) ||
                      (step === "preview" && i < 2) ||
                      (step === "mapping" && i < 1)
                    ? "bg-green-100 text-green-800"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step === "complete" ||
                (step === "importing" && i < 3) ||
                (step === "preview" && i < 2) ||
                (step === "mapping" && i < 1) ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  i + 1
                )}
              </div>
              {i < 3 && <div className="w-12 h-0.5 bg-muted mx-1" />}
            </div>
          ))}
        </div>

        {/* Step: Upload */}
        {step === "upload" && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bank-account">Bank Account</Label>
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger id="bank-account">
                  <SelectValue placeholder="Select bank account" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                      {account.bankName && ` (${account.bankName})`}
                      {account.accountNumber && ` ****${account.accountNumber}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>CSV File</Label>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center ${
                  fileName ? "border-green-300 bg-green-50" : "border-muted-foreground/25"
                }`}
              >
                {fileName ? (
                  <div className="space-y-2">
                    <CheckCircle2 className="h-8 w-8 mx-auto text-green-600" />
                    <p className="font-medium">{fileName}</p>
                    <p className="text-sm text-muted-foreground">
                      {rows.length} rows, {headers.length} columns
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Drag and drop or click to upload
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  style={{ position: "relative" }}
                />
                <Button variant="outline" size="sm" className="mt-4">
                  {fileName ? "Change File" : "Select File"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step: Mapping */}
        {step === "mapping" && (
          <div className="py-4">
            <ColumnMapper
              headers={headers}
              mapping={mapping}
              onMappingChange={setMapping}
              sampleRows={rows.slice(0, 3)}
            />
          </div>
        )}

        {/* Step: Preview */}
        {step === "preview" && (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {parsedTransactions.length} transactions ready to import
                </p>
                {parseErrors.length > 0 && (
                  <p className="text-xs text-amber-600">
                    {parseErrors.length} rows skipped due to errors
                  </p>
                )}
              </div>
              <Badge variant="secondary">{selectedAccount?.name}</Badge>
            </div>

            <div className="max-h-[300px] overflow-auto border rounded-lg">
              <DataTable>
                <thead>
                  <tr>
                    <Th>Date</Th>
                    <Th>Description</Th>
                    <Th className="text-right">Amount</Th>
                    <Th>Type</Th>
                  </tr>
                </thead>
                <tbody>
                  {parsedTransactions.slice(0, 50).map((txn, i) => (
                    <Tr key={i}>
                      <Td className="text-xs">
                        {txn.date.toLocaleDateString()}
                      </Td>
                      <Td className="text-sm max-w-[250px] truncate">
                        {txn.description}
                      </Td>
                      <Td className="text-right font-mono text-sm">
                        ${txn.amount.toFixed(2)}
                      </Td>
                      <Td>
                        <Badge
                          variant="secondary"
                          className={
                            txn.type === "DEBIT"
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800"
                          }
                        >
                          {txn.type}
                        </Badge>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </DataTable>
              {parsedTransactions.length > 50 && (
                <p className="text-xs text-muted-foreground p-2 text-center">
                  Showing 50 of {parsedTransactions.length} transactions
                </p>
              )}
            </div>

            {parseErrors.length > 0 && (
              <div className="rounded-lg bg-amber-50 p-3 space-y-1">
                <p className="text-sm font-medium text-amber-800 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Skipped Rows
                </p>
                <ul className="text-xs text-amber-700 list-disc list-inside max-h-24 overflow-auto">
                  {parseErrors.slice(0, 5).map((err, i) => (
                    <li key={i}>
                      Row {err.row}: {err.error}
                    </li>
                  ))}
                  {parseErrors.length > 5 && (
                    <li>...and {parseErrors.length - 5} more</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Step: Importing */}
        {step === "importing" && (
          <div className="py-8 space-y-4 text-center">
            <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Importing {parsedTransactions.length} transactions...
            </p>
            <Progress value={50} className="w-full max-w-xs mx-auto" />
          </div>
        )}

        {/* Step: Complete */}
        {step === "complete" && importResult && (
          <div className="py-8 space-y-4 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-600" />
            <div className="space-y-1">
              <p className="text-lg font-medium">Import Complete</p>
              <p className="text-sm text-muted-foreground">
                Successfully imported {importResult.imported} transactions
              </p>
            </div>
            <div className="flex justify-center gap-4 pt-2">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {importResult.categorized}
                </p>
                <p className="text-xs text-muted-foreground">Categorized</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-600">
                  {importResult.uncategorized}
                </p>
                <p className="text-xs text-muted-foreground">Uncategorized</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <DialogFooter>
          {step === "upload" && (
            <Button onClick={handleNextFromUpload}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}

          {step === "mapping" && (
            <>
              <Button variant="outline" onClick={() => setStep("upload")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleNextFromMapping}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          )}

          {step === "preview" && (
            <>
              <Button variant="outline" onClick={() => setStep("mapping")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleImport} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    Import {parsedTransactions.length} Transactions
                  </>
                )}
              </Button>
            </>
          )}

          {step === "complete" && (
            <Button onClick={handleClose}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
