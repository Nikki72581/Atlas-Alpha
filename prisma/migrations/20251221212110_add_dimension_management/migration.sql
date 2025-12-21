-- CreateEnum
CREATE TYPE "DimensionType" AS ENUM ('DEPARTMENT', 'PROJECT', 'LOCATION', 'ENTITY', 'CUSTOMER', 'VENDOR', 'CUSTOM');

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "dimensionsEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "DimensionDefinition" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "DimensionType" NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "accountTypes" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DimensionDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DimensionValue" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "dimensionDefinitionId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DimensionValue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DimensionDefinition_organizationId_idx" ON "DimensionDefinition"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "DimensionDefinition_organizationId_code_key" ON "DimensionDefinition"("organizationId", "code");

-- CreateIndex
CREATE INDEX "DimensionValue_organizationId_idx" ON "DimensionValue"("organizationId");

-- CreateIndex
CREATE INDEX "DimensionValue_dimensionDefinitionId_idx" ON "DimensionValue"("dimensionDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "DimensionValue_dimensionDefinitionId_code_key" ON "DimensionValue"("dimensionDefinitionId", "code");

-- AddForeignKey
ALTER TABLE "DimensionDefinition" ADD CONSTRAINT "DimensionDefinition_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DimensionValue" ADD CONSTRAINT "DimensionValue_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DimensionValue" ADD CONSTRAINT "DimensionValue_dimensionDefinitionId_fkey" FOREIGN KEY ("dimensionDefinitionId") REFERENCES "DimensionDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
