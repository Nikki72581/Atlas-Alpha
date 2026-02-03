"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { createBankAccount, updateBankAccount, getAssetAccounts, type BankAccountFormData } from "./actions"

const bankAccountSchema = z.object({
  name: z.string().min(1, "Account name is required"),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  accountType: z.enum(["CHECKING", "SAVINGS", "MONEY_MARKET", "CREDIT_CARD"]),
  glAccountId: z.string().min(1, "GL Account is required"),
  currency: z.string().min(1, "Currency is required"),
  isActive: z.boolean(),
})

type BankAccountFormValues = z.infer<typeof bankAccountSchema>

type BankAccount = {
  id: string
  name: string
  bankName: string | null
  accountNumber: string | null
  accountType: "CHECKING" | "SAVINGS" | "MONEY_MARKET" | "CREDIT_CARD"
  glAccountId: string
  currency: string
  isActive: boolean
}

type AssetAccount = {
  id: string
  number: string
  name: string
}

type BankAccountDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  bankAccount?: BankAccount | null
}

export function BankAccountDialog({ open, onOpenChange, bankAccount }: BankAccountDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [assetAccounts, setAssetAccounts] = useState<AssetAccount[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(true)

  const form = useForm<BankAccountFormValues>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: bankAccount
      ? {
          name: bankAccount.name,
          bankName: bankAccount.bankName || "",
          accountNumber: bankAccount.accountNumber || "",
          accountType: bankAccount.accountType,
          glAccountId: bankAccount.glAccountId,
          currency: bankAccount.currency,
          isActive: bankAccount.isActive,
        }
      : {
          name: "",
          bankName: "",
          accountNumber: "",
          accountType: "CHECKING",
          glAccountId: "",
          currency: "USD",
          isActive: true,
        },
  })

  useEffect(() => {
    async function loadAssetAccounts() {
      setLoadingAccounts(true)
      const result = await getAssetAccounts()
      if (result.success) {
        setAssetAccounts(result.accounts)
      }
      setLoadingAccounts(false)
    }

    if (open) {
      loadAssetAccounts()
      // Reset form when opening with different account
      if (bankAccount) {
        form.reset({
          name: bankAccount.name,
          bankName: bankAccount.bankName || "",
          accountNumber: bankAccount.accountNumber || "",
          accountType: bankAccount.accountType,
          glAccountId: bankAccount.glAccountId,
          currency: bankAccount.currency,
          isActive: bankAccount.isActive,
        })
      } else {
        form.reset({
          name: "",
          bankName: "",
          accountNumber: "",
          accountType: "CHECKING",
          glAccountId: "",
          currency: "USD",
          isActive: true,
        })
      }
    }
  }, [open, bankAccount, form])

  async function onSubmit(data: BankAccountFormValues) {
    setIsSubmitting(true)
    setError(null)

    const formData: BankAccountFormData = {
      name: data.name,
      bankName: data.bankName || "",
      accountNumber: data.accountNumber || "",
      accountType: data.accountType,
      glAccountId: data.glAccountId,
      currency: data.currency || "USD",
      isActive: data.isActive,
    }

    const result = bankAccount
      ? await updateBankAccount(bankAccount.id, formData)
      : await createBankAccount(formData)

    if (result.success) {
      form.reset()
      onOpenChange(false)
    } else {
      setError(result.error || "An error occurred")
    }

    setIsSubmitting(false)
  }

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen) {
      form.reset()
      setError(null)
    }
    onOpenChange(newOpen)
  }

  const accountTypeLabels: Record<string, string> = {
    CHECKING: "Checking",
    SAVINGS: "Savings",
    MONEY_MARKET: "Money Market",
    CREDIT_CARD: "Credit Card",
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{bankAccount ? "Edit Bank Account" : "New Bank Account"}</DialogTitle>
          <DialogDescription>
            {bankAccount
              ? "Update the bank account details below."
              : "Add a new bank account to track transactions."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Main Checking" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Chase" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Number (Last 4)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 1234" maxLength={4} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="accountType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(accountTypeLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="CAD">CAD</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="glAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GL Account (Asset)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingAccounts ? "Loading..." : "Select GL account"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {assetAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.number} - {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Active Status</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Inactive accounts cannot receive new transactions
                    </div>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || loadingAccounts}>
                {isSubmitting ? "Saving..." : bankAccount ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
