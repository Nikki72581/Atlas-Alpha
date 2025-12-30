"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MoreHorizontal, Edit, Trash2, Send, Package, CheckCircle } from "lucide-react"
import { TransferOrderDialog } from "./transfer-order-dialog"
import { releaseTransferOrder, shipTransferOrder, receiveTransferOrder, deleteTransferOrder } from "./actions"
import { toast } from "sonner"

interface TransferOrderActionsProps {
  transferOrder: any
  warehouses: any[]
  items: any[]
}

export function TransferOrderActions({ transferOrder, warehouses, items }: TransferOrderActionsProps) {
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleRelease = async () => {
    setIsProcessing(true)
    const result = await releaseTransferOrder(transferOrder.id)
    if (result.success) {
      toast.success("Transfer order released")
    } else {
      toast.error(result.error || "Failed to release transfer order")
    }
    setIsProcessing(false)
  }

  const handleShip = async () => {
    setIsProcessing(true)
    const result = await shipTransferOrder(transferOrder.id, {
      actualShipDate: new Date(),
    })
    if (result.success) {
      toast.success("Transfer order shipped")
    } else {
      toast.error(result.error || "Failed to ship transfer order")
    }
    setIsProcessing(false)
  }

  const handleReceive = async () => {
    setIsProcessing(true)
    const result = await receiveTransferOrder(transferOrder.id, {
      actualReceiptDate: new Date(),
      receivedLines: transferOrder.lines.map((line: any) => ({
        lineId: line.id,
        receivedQty: Number(line.orderedQty)
      }))
    })
    if (result.success) {
      toast.success("Transfer order received")
    } else {
      toast.error(result.error || "Failed to receive transfer order")
    }
    setIsProcessing(false)
  }

  const handleDelete = async () => {
    setIsProcessing(true)
    const result = await deleteTransferOrder(transferOrder.id)
    if (result.success) {
      toast.success("Transfer order deleted")
      setShowDeleteDialog(false)
    } else {
      toast.error(result.error || "Failed to delete transfer order")
    }
    setIsProcessing(false)
  }

  const canEdit = transferOrder.status === 'DRAFT'
  const canDelete = transferOrder.status === 'DRAFT'
  const canRelease = transferOrder.status === 'DRAFT'
  const canShip = transferOrder.status === 'RELEASED'
  const canReceive = transferOrder.status === 'SHIPPED' || transferOrder.status === 'PARTIALLY_RECEIVED'

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={isProcessing}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {canEdit && (
            <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
          )}

          {canRelease && (
            <DropdownMenuItem onClick={handleRelease}>
              <Send className="h-4 w-4 mr-2" />
              Release
            </DropdownMenuItem>
          )}

          {canShip && (
            <DropdownMenuItem onClick={handleShip}>
              <Package className="h-4 w-4 mr-2" />
              Ship
            </DropdownMenuItem>
          )}

          {canReceive && (
            <DropdownMenuItem onClick={handleReceive}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Receive
            </DropdownMenuItem>
          )}

          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <TransferOrderDialog
        transferOrder={transferOrder}
        warehouses={warehouses}
        items={items}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transfer Order?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete transfer order {transferOrder.transferOrderNumber}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isProcessing}
            >
              {isProcessing ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
