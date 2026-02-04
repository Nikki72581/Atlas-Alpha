"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { OrderStatus } from "@prisma/client"

export async function deleteSalesOrder(id: string) {
  try {
    const salesOrder = await prisma.salesOrder.findUnique({
      where: { id },
    })

    if (!salesOrder) {
      return { success: false, error: "Sales order not found" }
    }

    if (salesOrder.status !== OrderStatus.DRAFT && salesOrder.status !== OrderStatus.CANCELLED) {
      return { success: false, error: "Can only delete DRAFT or CANCELLED sales orders" }
    }

    await prisma.salesOrder.delete({
      where: { id },
    })

    revalidatePath("/dashboard/sales-orders")
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting sales order:", error)
    return { success: false, error: error.message || "Failed to delete sales order" }
  }
}
