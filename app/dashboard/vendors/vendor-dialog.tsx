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
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { createVendor, updateVendor, type VendorFormData } from "./actions"

const vendorSchema = z.object({
  number: z.string().min(1, "Vendor number is required"),
  name: z.string().min(1, "Vendor name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  termsNetDays: z.number().min(0, "Terms must be 0 or greater"),
  isActive: z.boolean(),
})

type VendorFormValues = z.infer<typeof vendorSchema>

type Vendor = {
  id: string
  number: string
  name: string
  email: string | null
  phone: string | null
  termsNetDays: number
  isActive: boolean
}

type VendorDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  vendor: Vendor | null
}

export function VendorDialog({ open, onOpenChange, vendor }: VendorDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<VendorFormValues>({
    resolver: zodResolver(vendorSchema),
    defaultValues: vendor
      ? {
          number: vendor.number,
          name: vendor.name,
          email: vendor.email || "",
          phone: vendor.phone || "",
          termsNetDays: vendor.termsNetDays,
          isActive: vendor.isActive,
        }
      : {
          number: "",
          name: "",
          email: "",
          phone: "",
          termsNetDays: 30,
          isActive: true,
        },
  })

  // Reset form when dialog opens/closes or vendor changes
  useState(() => {
    if (open) {
      form.reset(
        vendor
          ? {
              number: vendor.number,
              name: vendor.name,
              email: vendor.email || "",
              phone: vendor.phone || "",
              termsNetDays: vendor.termsNetDays,
              isActive: vendor.isActive,
            }
          : {
              number: "",
              name: "",
              email: "",
              phone: "",
              termsNetDays: 30,
              isActive: true,
            }
      )
    }
  })

  async function onSubmit(values: VendorFormValues) {
    setIsSubmitting(true)

    const data: VendorFormData = {
      number: values.number,
      name: values.name,
      email: values.email || undefined,
      phone: values.phone || undefined,
      termsNetDays: values.termsNetDays,
      isActive: values.isActive,
    }

    const result = vendor
      ? await updateVendor(vendor.id, data)
      : await createVendor(data)

    setIsSubmitting(false)

    if (result.success) {
      onOpenChange(false)
      form.reset()
    } else {
      alert(result.error || "An error occurred")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{vendor ? "Edit Vendor" : "New Vendor"}</DialogTitle>
          <DialogDescription>
            {vendor
              ? "Update vendor information"
              : "Create a new vendor for Order to Cash"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vendor Number</FormLabel>
                  <FormControl>
                    <Input placeholder="C-001" {...field} />
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
                  <FormLabel>Vendor Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Corporation" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="contact@acme.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 (555) 123-4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="termsNetDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Terms (Days)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" placeholder="30" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Active Status</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      {field.value ? "Vendor is active" : "Vendor is inactive"}
                    </div>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : vendor ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
