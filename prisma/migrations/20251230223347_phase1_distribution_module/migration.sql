-- CreateEnum
CREATE TYPE "TransferOrderStatus" AS ENUM ('DRAFT', 'RELEASED', 'SHIPPED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "isStocked" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Warehouse" ADD COLUMN     "addressLine1" TEXT,
ADD COLUMN     "addressLine2" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT DEFAULT 'US',
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "islandCode" TEXT,
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "warehouseType" TEXT;

-- CreateTable
CREATE TABLE "inventory_balances" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "onHandQty" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "allocatedQty" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "availableQty" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "inTransitQty" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "unitCost" DECIMAL(65,30),
    "totalValue" DECIMAL(65,30),
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfer_orders" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "transferOrderNumber" TEXT NOT NULL,
    "status" "TransferOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "fromWarehouseId" TEXT NOT NULL,
    "toWarehouseId" TEXT NOT NULL,
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requestedShipDate" TIMESTAMP(3),
    "actualShipDate" TIMESTAMP(3),
    "expectedReceiptDate" TIMESTAMP(3),
    "actualReceiptDate" TIMESTAMP(3),
    "shippingMethod" TEXT,
    "referenceNumber" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transfer_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfer_order_lines" (
    "id" TEXT NOT NULL,
    "transferOrderId" TEXT NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "itemId" TEXT NOT NULL,
    "orderedQty" DECIMAL(65,30) NOT NULL,
    "shippedQty" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "receivedQty" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "uom" TEXT NOT NULL DEFAULT 'EA',
    "unitCost" DECIMAL(65,30),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transfer_order_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reorder_points" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "minQty" DECIMAL(65,30) NOT NULL,
    "maxQty" DECIMAL(65,30) NOT NULL,
    "safetyStock" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "reorderQty" DECIMAL(65,30) NOT NULL,
    "leadTimeDays" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reorder_points_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inventory_balances_organizationId_itemId_idx" ON "inventory_balances"("organizationId", "itemId");

-- CreateIndex
CREATE INDEX "inventory_balances_warehouseId_idx" ON "inventory_balances"("warehouseId");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_balances_organizationId_itemId_warehouseId_key" ON "inventory_balances"("organizationId", "itemId", "warehouseId");

-- CreateIndex
CREATE INDEX "transfer_orders_organizationId_idx" ON "transfer_orders"("organizationId");

-- CreateIndex
CREATE INDEX "transfer_orders_status_idx" ON "transfer_orders"("status");

-- CreateIndex
CREATE INDEX "transfer_orders_fromWarehouseId_idx" ON "transfer_orders"("fromWarehouseId");

-- CreateIndex
CREATE INDEX "transfer_orders_toWarehouseId_idx" ON "transfer_orders"("toWarehouseId");

-- CreateIndex
CREATE UNIQUE INDEX "transfer_orders_organizationId_transferOrderNumber_key" ON "transfer_orders"("organizationId", "transferOrderNumber");

-- CreateIndex
CREATE INDEX "transfer_order_lines_itemId_idx" ON "transfer_order_lines"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "transfer_order_lines_transferOrderId_lineNumber_key" ON "transfer_order_lines"("transferOrderId", "lineNumber");

-- CreateIndex
CREATE INDEX "reorder_points_organizationId_idx" ON "reorder_points"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "reorder_points_organizationId_itemId_warehouseId_key" ON "reorder_points"("organizationId", "itemId", "warehouseId");

-- AddForeignKey
ALTER TABLE "inventory_balances" ADD CONSTRAINT "inventory_balances_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_balances" ADD CONSTRAINT "inventory_balances_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_balances" ADD CONSTRAINT "inventory_balances_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_orders" ADD CONSTRAINT "transfer_orders_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_orders" ADD CONSTRAINT "transfer_orders_fromWarehouseId_fkey" FOREIGN KEY ("fromWarehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_orders" ADD CONSTRAINT "transfer_orders_toWarehouseId_fkey" FOREIGN KEY ("toWarehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_order_lines" ADD CONSTRAINT "transfer_order_lines_transferOrderId_fkey" FOREIGN KEY ("transferOrderId") REFERENCES "transfer_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_order_lines" ADD CONSTRAINT "transfer_order_lines_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reorder_points" ADD CONSTRAINT "reorder_points_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reorder_points" ADD CONSTRAINT "reorder_points_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reorder_points" ADD CONSTRAINT "reorder_points_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
