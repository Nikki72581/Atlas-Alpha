"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { OrderStatus } from "@prisma/client"

export async function deletePurchaseOrder(id: string) {
  try {
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
    })

    if (!purchaseOrder) {
      return { success: false, error: "Purchase order not found" }
    }

    if (purchaseOrder.status !== OrderStatus.DRAFT && purchaseOrder.status !== OrderStatus.CANCELLED) {
      return { success: false, error: "Can only delete DRAFT or CANCELLED purchase orders" }
    }

    await prisma.purchaseOrder.delete({
      where: { id },
    })

    revalidatePath("/dashboard/purchase-orders")
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting purchase order:", error)
    return { success: false, error: error.message || "Failed to delete purchase order" }
  }
}
