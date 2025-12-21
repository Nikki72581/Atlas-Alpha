"use client"

import { useState } from "react"
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
import { createAccount, updateAccount, type AccountFormData } from "./actions"

const accountSchema = z.object({
  number: z.string().min(1, "Account number is required"),
  name: z.string().min(1, "Account name is required"),
  type: z.enum(["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"]),
  isActive: z.boolean(),
})

type AccountFormValues = z.infer<typeof accountSchema>

type Account = {
  id: string
  number: string
  name: string
  type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE"
  isActive: boolean
}

type AccountDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  account?: Account | null
}

export function AccountDialog({ open, onOpenChange, account }: AccountDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: account
      ? {
          number: account.number,
          name: account.name,
          type: account.type,
          isActive: account.isActive,
        }
      : {
          number: "",
          name: "",
          type: "ASSET",
          isActive: true,
        },
  })

  async function onSubmit(data: AccountFormValues) {
    setIsSubmitting(true)
    setError(null)

    const result = account
      ? await updateAccount(account.id, data as AccountFormData)
      : await createAccount(data as AccountFormData)

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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>{account ? "Edit Account" : "New Account"}</DialogTitle>
          <DialogDescription>
            {account
              ? "Update the account details below."
              : "Add a new account to your chart of accounts."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Number</FormLabel>
                  <FormControl>
                    <Input placeholder="1000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Cash" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ASSET">Asset</SelectItem>
                      <SelectItem value="LIABILITY">Liability</SelectItem>
                      <SelectItem value="EQUITY">Equity</SelectItem>
                      <SelectItem value="REVENUE">Revenue</SelectItem>
                      <SelectItem value="EXPENSE">Expense</SelectItem>
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
                      Inactive accounts cannot be used in new transactions
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : account ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
