import { PrismaClient } from "@prisma/client"
import { withAccelerate } from "@prisma/extension-accelerate"

const prismaClientSingleton = () => {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })

  // Only use Accelerate extension when DATABASE_URL uses the accelerate proxy
  if (process.env.DATABASE_URL?.includes("accelerate.prisma-data.net")) {
    return client.$extends(withAccelerate()) as unknown as PrismaClient
  }

  return client
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton> | undefined
} & typeof global

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export { prisma }

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma
