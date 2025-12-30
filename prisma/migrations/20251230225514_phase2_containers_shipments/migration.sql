-- CreateEnum
CREATE TYPE "ContainerStatus" AS ENUM ('PLANNED', 'LOADING', 'LOADED', 'IN_TRANSIT', 'ARRIVED', 'UNLOADING', 'UNLOADED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('PLANNED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');

-- AlterTable
ALTER TABLE "transfer_orders" ADD COLUMN     "containerId" TEXT,
ADD COLUMN     "shipmentId" TEXT;

-- CreateTable
CREATE TABLE "containers" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "containerNumber" TEXT NOT NULL,
    "containerType" TEXT NOT NULL DEFAULT '40FT_FCL',
    "status" "ContainerStatus" NOT NULL DEFAULT 'PLANNED',
    "originWarehouseId" TEXT NOT NULL,
    "destWarehouseId" TEXT NOT NULL,
    "carrier" TEXT,
    "vesselName" TEXT,
    "voyageNumber" TEXT,
    "bookingNumber" TEXT,
    "sealNumber" TEXT,
    "plannedLoadDate" TIMESTAMP(3),
    "actualLoadDate" TIMESTAMP(3),
    "plannedDepartDate" TIMESTAMP(3),
    "actualDepartDate" TIMESTAMP(3),
    "plannedArrivalDate" TIMESTAMP(3),
    "actualArrivalDate" TIMESTAMP(3),
    "plannedUnloadDate" TIMESTAMP(3),
    "actualUnloadDate" TIMESTAMP(3),
    "estimatedTransitDays" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "containers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipments" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "shipmentNumber" TEXT NOT NULL,
    "shipmentType" TEXT NOT NULL DEFAULT 'OCEAN_FCL',
    "status" "ShipmentStatus" NOT NULL DEFAULT 'PLANNED',
    "originWarehouseId" TEXT NOT NULL,
    "destWarehouseId" TEXT NOT NULL,
    "carrier" TEXT,
    "trackingNumber" TEXT,
    "plannedShipDate" TIMESTAMP(3),
    "actualShipDate" TIMESTAMP(3),
    "plannedDeliveryDate" TIMESTAMP(3),
    "actualDeliveryDate" TIMESTAMP(3),
    "estimatedTransitDays" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "containers_organizationId_idx" ON "containers"("organizationId");

-- CreateIndex
CREATE INDEX "containers_status_idx" ON "containers"("status");

-- CreateIndex
CREATE INDEX "containers_originWarehouseId_idx" ON "containers"("originWarehouseId");

-- CreateIndex
CREATE INDEX "containers_destWarehouseId_idx" ON "containers"("destWarehouseId");

-- CreateIndex
CREATE UNIQUE INDEX "containers_organizationId_containerNumber_key" ON "containers"("organizationId", "containerNumber");

-- CreateIndex
CREATE INDEX "shipments_organizationId_idx" ON "shipments"("organizationId");

-- CreateIndex
CREATE INDEX "shipments_status_idx" ON "shipments"("status");

-- CreateIndex
CREATE INDEX "shipments_originWarehouseId_idx" ON "shipments"("originWarehouseId");

-- CreateIndex
CREATE INDEX "shipments_destWarehouseId_idx" ON "shipments"("destWarehouseId");

-- CreateIndex
CREATE UNIQUE INDEX "shipments_organizationId_shipmentNumber_key" ON "shipments"("organizationId", "shipmentNumber");

-- CreateIndex
CREATE INDEX "transfer_orders_containerId_idx" ON "transfer_orders"("containerId");

-- CreateIndex
CREATE INDEX "transfer_orders_shipmentId_idx" ON "transfer_orders"("shipmentId");

-- AddForeignKey
ALTER TABLE "transfer_orders" ADD CONSTRAINT "transfer_orders_containerId_fkey" FOREIGN KEY ("containerId") REFERENCES "containers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_orders" ADD CONSTRAINT "transfer_orders_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "shipments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "containers" ADD CONSTRAINT "containers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "containers" ADD CONSTRAINT "containers_originWarehouseId_fkey" FOREIGN KEY ("originWarehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "containers" ADD CONSTRAINT "containers_destWarehouseId_fkey" FOREIGN KEY ("destWarehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_originWarehouseId_fkey" FOREIGN KEY ("originWarehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_destWarehouseId_fkey" FOREIGN KEY ("destWarehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
