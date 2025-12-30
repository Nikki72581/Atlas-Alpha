"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/lib/db"
import { DEMO_ORG_ID } from "@/lib/demo-org"
import { TransferOrderStatus } from "@prisma/client"

export type TransferOrderFormData = {
  fromWarehouseId: string
  toWarehouseId: string
  orderDate?: Date
  requestedShipDate?: Date
  shippingMethod?: string
  referenceNumber?: string
  notes?: string
  lines: {
    itemId: string
    orderedQty: number
    uom: string
    unitCost?: number
    notes?: string
  }[]
}

export async function createTransferOrder(data: TransferOrderFormData) {
  try {
    // Generate TO number
    const count = await prisma.transferOrder.count({
      where: { organizationId: DEMO_ORG_ID }
    })
    const transferOrderNumber = `TO-${String(count + 1001).padStart(4, '0')}`

    // Create TO with lines
    const transferOrder = await prisma.transferOrder.create({
      data: {
        organizationId: DEMO_ORG_ID,
        transferOrderNumber,
        status: TransferOrderStatus.DRAFT,
        fromWarehouseId: data.fromWarehouseId,
        toWarehouseId: data.toWarehouseId,
        orderDate: data.orderDate || new Date(),
        requestedShipDate: data.requestedShipDate,
        shippingMethod: data.shippingMethod,
        referenceNumber: data.referenceNumber,
        notes: data.notes,
        lines: {
          create: data.lines.map((line, index) => ({
            lineNumber: index + 1,
            itemId: line.itemId,
            orderedQty: line.orderedQty,
            shippedQty: 0,
            receivedQty: 0,
            uom: line.uom,
            unitCost: line.unitCost,
            notes: line.notes,
          }))
        }
      },
      include: {
        fromWarehouse: true,
        toWarehouse: true,
        lines: {
          include: {
            item: true
          }
        }
      }
    })

    revalidatePath('/dashboard/transfer-orders')
    return { success: true, data: transferOrder }

  } catch (error: any) {
    console.error('Error creating transfer order:', error)
    return { success: false, error: error.message || 'Failed to create transfer order' }
  }
}

export async function updateTransferOrder(id: string, data: TransferOrderFormData) {
  try {
    const transferOrder = await prisma.transferOrder.update({
      where: { id },
      data: {
        fromWarehouseId: data.fromWarehouseId,
        toWarehouseId: data.toWarehouseId,
        orderDate: data.orderDate,
        requestedShipDate: data.requestedShipDate,
        shippingMethod: data.shippingMethod,
        referenceNumber: data.referenceNumber,
        notes: data.notes,
      },
      include: {
        fromWarehouse: true,
        toWarehouse: true,
        lines: {
          include: {
            item: true
          }
        }
      }
    })

    revalidatePath('/dashboard/transfer-orders')
    return { success: true, data: transferOrder }

  } catch (error: any) {
    console.error('Error updating transfer order:', error)
    return { success: false, error: error.message || 'Failed to update transfer order' }
  }
}

export async function releaseTransferOrder(id: string) {
  try {
    const transferOrder = await prisma.transferOrder.update({
      where: { id },
      data: {
        status: TransferOrderStatus.RELEASED,
      }
    })

    revalidatePath('/dashboard/transfer-orders')
    return { success: true, data: transferOrder }

  } catch (error: any) {
    console.error('Error releasing transfer order:', error)
    return { success: false, error: error.message || 'Failed to release transfer order' }
  }
}

export async function shipTransferOrder(id: string, shipmentData: {
  actualShipDate: Date
  shippingMethod?: string
  referenceNumber?: string
}) {
  try {
    // 1. Get transfer order with lines
    const transferOrder = await prisma.transferOrder.findUnique({
      where: { id },
      include: {
        lines: true,
        fromWarehouse: true,
        toWarehouse: true
      }
    })

    if (!transferOrder) {
      return { success: false, error: 'Transfer order not found' }
    }

    if (transferOrder.status !== TransferOrderStatus.RELEASED) {
      return { success: false, error: 'Transfer order must be RELEASED before shipping' }
    }

    // 2. Update TO status
    await prisma.transferOrder.update({
      where: { id },
      data: {
        status: TransferOrderStatus.SHIPPED,
        actualShipDate: shipmentData.actualShipDate,
        shippingMethod: shipmentData.shippingMethod || transferOrder.shippingMethod,
        referenceNumber: shipmentData.referenceNumber || transferOrder.referenceNumber,
      }
    })

    // 3. Create inventory transactions (TRANSFER OUT from source warehouse)
    for (const line of transferOrder.lines) {
      await prisma.inventoryTransaction.create({
        data: {
          organizationId: DEMO_ORG_ID,
          txnType: 'TRANSFER',
          itemId: line.itemId,
          warehouseId: transferOrder.fromWarehouseId,
          quantity: -line.orderedQty, // Negative for OUT
          unitCost: line.unitCost || 0,
          referenceType: 'TransferOrder',
          referenceId: transferOrder.transferOrderNumber,
        }
      })

      // Update materialized balance (from warehouse)
      await updateInventoryBalance({
        organizationId: DEMO_ORG_ID,
        itemId: line.itemId,
        warehouseId: transferOrder.fromWarehouseId,
        qtyChange: -Number(line.orderedQty),
        inTransitQtyChange: Number(line.orderedQty)
      })
    }

    // 4. Update TO lines (shippedQty = orderedQty)
    for (const line of transferOrder.lines) {
      await prisma.transferOrderLine.update({
        where: { id: line.id },
        data: { shippedQty: line.orderedQty }
      })
    }

    revalidatePath('/dashboard/transfer-orders')
    revalidatePath('/dashboard/inventory')
    return { success: true }

  } catch (error: any) {
    console.error('Error shipping transfer order:', error)
    return { success: false, error: error.message || 'Failed to ship transfer order' }
  }
}

export async function receiveTransferOrder(id: string, receiptData: {
  actualReceiptDate: Date
  receivedLines: { lineId: string, receivedQty: number }[]
}) {
  try {
    const transferOrder = await prisma.transferOrder.findUnique({
      where: { id },
      include: { lines: true }
    })

    if (!transferOrder) {
      return { success: false, error: 'Transfer order not found' }
    }

    if (transferOrder.status !== TransferOrderStatus.SHIPPED && transferOrder.status !== TransferOrderStatus.PARTIALLY_RECEIVED) {
      return { success: false, error: 'Transfer order must be SHIPPED before receiving' }
    }

    // 1. Create inventory transactions (TRANSFER IN to destination warehouse)
    for (const receivedLine of receiptData.receivedLines) {
      const line = transferOrder.lines.find(l => l.id === receivedLine.lineId)
      if (!line) continue

      await prisma.inventoryTransaction.create({
        data: {
          organizationId: DEMO_ORG_ID,
          txnType: 'TRANSFER',
          itemId: line.itemId,
          warehouseId: transferOrder.toWarehouseId,
          quantity: receivedLine.receivedQty, // Positive for IN
          unitCost: line.unitCost || 0,
          referenceType: 'TransferOrder',
          referenceId: transferOrder.transferOrderNumber,
        }
      })

      // Update materialized balance (destination warehouse)
      await updateInventoryBalance({
        organizationId: DEMO_ORG_ID,
        itemId: line.itemId,
        warehouseId: transferOrder.toWarehouseId,
        qtyChange: receivedLine.receivedQty,
        inTransitQtyChange: 0
      })

      // Update materialized balance (source warehouse - reduce in-transit)
      await updateInventoryBalance({
        organizationId: DEMO_ORG_ID,
        itemId: line.itemId,
        warehouseId: transferOrder.fromWarehouseId,
        qtyChange: 0,
        inTransitQtyChange: -receivedLine.receivedQty
      })

      // Update line receivedQty
      await prisma.transferOrderLine.update({
        where: { id: receivedLine.lineId },
        data: { receivedQty: { increment: receivedLine.receivedQty } }
      })
    }

    // 2. Update TO status
    const allLinesReceived = transferOrder.lines.every(line => {
      const received = receiptData.receivedLines.find(r => r.lineId === line.id)
      const totalReceived = Number(line.receivedQty) + (received?.receivedQty || 0)
      return totalReceived >= Number(line.orderedQty)
    })

    await prisma.transferOrder.update({
      where: { id },
      data: {
        status: allLinesReceived ? TransferOrderStatus.RECEIVED : TransferOrderStatus.PARTIALLY_RECEIVED,
        actualReceiptDate: receiptData.actualReceiptDate
      }
    })

    revalidatePath('/dashboard/transfer-orders')
    revalidatePath('/dashboard/inventory')
    return { success: true }

  } catch (error: any) {
    console.error('Error receiving transfer order:', error)
    return { success: false, error: error.message || 'Failed to receive transfer order' }
  }
}

export async function deleteTransferOrder(id: string) {
  try {
    const transferOrder = await prisma.transferOrder.findUnique({
      where: { id }
    })

    if (!transferOrder) {
      return { success: false, error: 'Transfer order not found' }
    }

    if (transferOrder.status !== TransferOrderStatus.DRAFT) {
      return { success: false, error: 'Can only delete DRAFT transfer orders' }
    }

    await prisma.transferOrder.delete({
      where: { id }
    })

    revalidatePath('/dashboard/transfer-orders')
    return { success: true }

  } catch (error: any) {
    console.error('Error deleting transfer order:', error)
    return { success: false, error: error.message || 'Failed to delete transfer order' }
  }
}

// Helper function to update materialized balance
async function updateInventoryBalance(params: {
  organizationId: string
  itemId: string
  warehouseId: string
  qtyChange: number
  inTransitQtyChange: number
}) {
  await prisma.inventoryBalance.upsert({
    where: {
      organizationId_itemId_warehouseId: {
        organizationId: params.organizationId,
        itemId: params.itemId,
        warehouseId: params.warehouseId
      }
    },
    create: {
      organizationId: params.organizationId,
      itemId: params.itemId,
      warehouseId: params.warehouseId,
      onHandQty: params.qtyChange,
      allocatedQty: 0,
      availableQty: params.qtyChange,
      inTransitQty: params.inTransitQtyChange
    },
    update: {
      onHandQty: { increment: params.qtyChange },
      availableQty: { increment: params.qtyChange },
      inTransitQty: { increment: params.inTransitQtyChange }
    }
  })
}
