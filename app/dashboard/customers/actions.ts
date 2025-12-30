"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { DEMO_ORG_ID } from "@/lib/demo-org"

export type CustomerFormData = {
  number: string
  name: string
  email?: string
  phone?: string
  termsNetDays: number
  isActive: boolean
}

export async function createCustomer(data: CustomerFormData) {
  try {
    await prisma.customer.create({
      data: {
        organizationId: DEMO_ORG_ID,
        number: data.number,
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        termsNetDays: data.termsNetDays,
        isActive: data.isActive,
      },
    })

    revalidatePath("/dashboard/customers")
    return { success: true }
  } catch (error: any) {
    console.error("Failed to create customer:", error)
    if (error.code === "P2002") {
      return { success: false, error: "Customer number already exists" }
    }
    return { success: false, error: "Failed to create customer" }
  }
}

export async function updateCustomer(id: string, data: CustomerFormData) {
  try {
    await prisma.customer.update({
      where: { id },
      data: {
        number: data.number,
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        termsNetDays: data.termsNetDays,
        isActive: data.isActive,
      },
    })

    revalidatePath("/dashboard/customers")
    return { success: true }
  } catch (error: any) {
    console.error("Failed to update customer:", error)
    if (error.code === "P2002") {
      return { success: false, error: "Customer number already exists" }
    }
    return { success: false, error: "Failed to update customer" }
  }
}

export async function deleteCustomer(id: string) {
  try {
    await prisma.customer.delete({
      where: { id },
    })

    revalidatePath("/dashboard/customers")
    return { success: true }
  } catch (error: any) {
    console.error("Failed to delete customer:", error)
    if (error.code === "P2003") {
      return {
        success: false,
        error: "Cannot delete customer with existing sales orders",
      }
    }
    return { success: false, error: "Failed to delete customer" }
  }
}

export async function toggleCustomerStatus(id: string) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
      select: { isActive: true },
    })

    if (!customer) {
      return { success: false, error: "Customer not found" }
    }

    await prisma.customer.update({
      where: { id },
      data: { isActive: !customer.isActive },
    })

    revalidatePath("/dashboard/customers")
    return { success: true }
  } catch (error) {
    console.error("Failed to toggle customer status:", error)
    return { success: false, error: "Failed to toggle customer status" }
  }
}
