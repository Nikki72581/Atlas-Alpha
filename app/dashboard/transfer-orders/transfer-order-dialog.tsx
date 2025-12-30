"use client"

import { useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createTransferOrder, updateTransferOrder } from "./actions"
import { toast } from "sonner"
import { Plus, Trash2 } from "lucide-react"

const transferOrderSchema = z.object({
  fromWarehouseId: z.string().min(1, "From warehouse required"),
  toWarehouseId: z.string().min(1, "To warehouse required"),
  orderDate: z.string().optional(),
  requestedShipDate: z.string().optional(),
  shippingMethod: z.string().optional(),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
  lines: z.array(z.object({
    itemId: z.string().min(1, "Item required"),
    orderedQty: z.number().positive("Quantity must be positive"),
    uom: z.string().default("EA"),
    unitCost: z.number().optional(),
    notes: z.string().optional(),
  })).min(1, "At least one line required")
}).refine((data) => data.fromWarehouseId !== data.toWarehouseId, {
  message: "From and To warehouses must be different",
  path: ["toWarehouseId"]
})

type TransferOrderFormValues = z.infer<typeof transferOrderSchema>

interface TransferOrderDialogProps {
  transferOrder?: any
  warehouses: any[]
  items: any[]
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function TransferOrderDialog({
  transferOrder,
  warehouses,
  items,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange
}: TransferOrderDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isControlled = controlledOpen !== undefined
  const dialogOpen = isControlled ? controlledOpen : open
  const setDialogOpen = isControlled ? controlledOnOpenChange! : setOpen

  const form = useForm<TransferOrderFormValues>({
    resolver: zodResolver(transferOrderSchema),
    defaultValues: transferOrder ? {
      fromWarehouseId: transferOrder.fromWarehouseId,
      toWarehouseId: transferOrder.toWarehouseId,
      orderDate: transferOrder.orderDate ? new Date(transferOrder.orderDate).toISOString().split('T')[0] : undefined,
      requestedShipDate: transferOrder.requestedShipDate ? new Date(transferOrder.requestedShipDate).toISOString().split('T')[0] : undefined,
      shippingMethod: transferOrder.shippingMethod || undefined,
      referenceNumber: transferOrder.referenceNumber || undefined,
      notes: transferOrder.notes || undefined,
      lines: transferOrder.lines || []
    } : {
      fromWarehouseId: "",
      toWarehouseId: "",
      orderDate: new Date().toISOString().split('T')[0],
      lines: [{
        itemId: "",
        orderedQty: 1,
        uom: "EA",
        unitCost: 0,
        notes: ""
      }]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines"
  })

  const onSubmit = async (values: TransferOrderFormValues) => {
    setIsSubmitting(true)

    const formData = {
      ...values,
      orderDate: values.orderDate ? new Date(values.orderDate) : undefined,
      requestedShipDate: values.requestedShipDate ? new Date(values.requestedShipDate) : undefined,
    }

    const result = transferOrder
      ? await updateTransferOrder(transferOrder.id, formData)
      : await createTransferOrder(formData)

    if (result.success) {
      toast.success(transferOrder ? "Transfer order updated" : "Transfer order created")
      setDialogOpen(false)
      form.reset()
    } else {
      toast.error(result.error || "Failed to save transfer order")
    }

    setIsSubmitting(false)
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {transferOrder ? "Edit Transfer Order" : "New Transfer Order"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fromWarehouseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From Warehouse *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select warehouse" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {warehouses.map((wh) => (
                          <SelectItem key={wh.id} value={wh.id}>
                            {wh.name} ({wh.code})
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
                name="toWarehouseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To Warehouse *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select warehouse" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {warehouses.map((wh) => (
                          <SelectItem key={wh.id} value={wh.id}>
                            {wh.name} ({wh.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="orderDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requestedShipDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requested Ship Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="shippingMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shipping Method</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select shipping method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="OCEAN_CONTAINER_FCL">Ocean Container (FCL)</SelectItem>
                        <SelectItem value="OCEAN_CONTAINER_LCL">Ocean Container (LCL)</SelectItem>
                        <SelectItem value="AIR_FREIGHT_DHL">Air Freight (DHL)</SelectItem>
                        <SelectItem value="AIR_FREIGHT_FEDEX">Air Freight (FedEx)</SelectItem>
                        <SelectItem value="GROUND_LTL">Ground (LTL)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="referenceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reference Number</FormLabel>
                    <FormControl>
                      <Input placeholder="PO or SO number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Additional notes..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Line Items</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({
                    itemId: "",
                    orderedQty: 1,
                    uom: "EA",
                    unitCost: 0,
                    notes: ""
                  })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Line
                </Button>
              </div>

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-3 items-start border rounded-lg p-3">
                    <div className="flex-1 grid grid-cols-4 gap-3">
                      <FormField
                        control={form.control}
                        name={`lines.${index}.itemId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Item *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Select item" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {items.map((item) => (
                                  <SelectItem key={item.id} value={item.id}>
                                    {item.sku} - {item.name}
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
                        name={`lines.${index}.orderedQty`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Quantity *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="1"
                                min="1"
                                className="h-9"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`lines.${index}.uom`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">UOM</FormLabel>
                            <FormControl>
                              <Input className="h-9" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`lines.${index}.unitCost`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Unit Cost</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                className="h-9"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 mt-6"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Transfer Order"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
