"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { DEMO_ORG_ID } from "@/lib/demo-org"

export type VendorFormData = {
  number: string
  name: string
  email?: string
  phone?: string
  termsNetDays: number
  isActive: boolean
}

export async function createVendor(data: VendorFormData) {
  try {
    await prisma.vendor.create({
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

    revalidatePath("/dashboard/vendors")
    return { success: true }
  } catch (error: any) {
    console.error("Failed to create vendor:", error)
    if (error.code === "P2002") {
      return { success: false, error: "Vendor number already exists" }
    }
    return { success: false, error: "Failed to create vendor" }
  }
}

export async function updateVendor(id: string, data: VendorFormData) {
  try {
    await prisma.vendor.update({
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

    revalidatePath("/dashboard/vendors")
    return { success: true }
  } catch (error: any) {
    console.error("Failed to update vendor:", error)
    if (error.code === "P2002") {
      return { success: false, error: "Vendor number already exists" }
    }
    return { success: false, error: "Failed to update vendor" }
  }
}

export async function deleteVendor(id: string) {
  try {
    await prisma.vendor.delete({
      where: { id },
    })

    revalidatePath("/dashboard/vendors")
    return { success: true }
  } catch (error: any) {
    console.error("Failed to delete vendor:", error)
    if (error.code === "P2003") {
      return {
        success: false,
        error: "Cannot delete vendor with existing purchase orders",
      }
    }
    return { success: false, error: "Failed to delete vendor" }
  }
}

export async function toggleVendorStatus(id: string) {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { id },
      select: { isActive: true },
    })

    if (!vendor) {
      return { success: false, error: "Vendor not found" }
    }

    await prisma.vendor.update({
      where: { id },
      data: { isActive: !vendor.isActive },
    })

    revalidatePath("/dashboard/vendors")
    return { success: true }
  } catch (error) {
    console.error("Failed to toggle vendor status:", error)
    return { success: false, error: "Failed to toggle vendor status" }
  }
}
