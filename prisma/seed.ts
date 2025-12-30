import { PrismaClient, AccountType, ItemType, InventoryTxnType, JournalStatus, TransferOrderStatus, ContainerStatus } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const org = await prisma.organization.upsert({
    where: { id: "demo-org" },
    update: {},
    create: { id: "demo-org", name: "Junova Atlas Demo Co." },
  })

  await prisma.user.upsert({
    where: { email: "demo@junova.local" },
    update: { organizationId: org.id, role: "ADMIN" },
    create: { organizationId: org.id, email: "demo@junova.local", name: "Demo Admin", role: "ADMIN" },
  })

  // Master data - Warehouses (3 locations for USVI distribution)
  const whATL = await prisma.warehouse.upsert({
    where: { organizationId_code: { organizationId: org.id, code: "ATL" } },
    update: { name: "Atlanta Warehouse", islandCode: "ATL" },
    create: {
      organizationId: org.id,
      code: "ATL",
      name: "Atlanta Warehouse",
      addressLine1: "1234 Peachtree St",
      city: "Atlanta",
      state: "GA",
      postalCode: "30303",
      country: "US",
      warehouseType: "MAIN",
      islandCode: "ATL",
      isActive: true,
    },
  })

  const whSTT = await prisma.warehouse.upsert({
    where: { organizationId_code: { organizationId: org.id, code: "STT" } },
    update: { name: "St Thomas Warehouse", islandCode: "STT" },
    create: {
      organizationId: org.id,
      code: "STT",
      name: "St Thomas Warehouse",
      addressLine1: "123 Waterfront Drive",
      city: "Charlotte Amalie",
      state: "VI",
      postalCode: "00802",
      country: "US",
      warehouseType: "RETAIL",
      islandCode: "STT",
      isActive: true,
    },
  })

  const whSTX = await prisma.warehouse.upsert({
    where: { organizationId_code: { organizationId: org.id, code: "STX" } },
    update: { name: "St Croix Warehouse", islandCode: "STX" },
    create: {
      organizationId: org.id,
      code: "STX",
      name: "St Croix Warehouse",
      addressLine1: "456 Christiansted Wharf",
      city: "Christiansted",
      state: "VI",
      postalCode: "00820",
      country: "US",
      warehouseType: "RETAIL",
      islandCode: "STX",
      isActive: true,
    },
  })

  const c1 = await prisma.customer.upsert({
    where: { organizationId_number: { organizationId: org.id, number: "C1000" } },
    update: {},
    create: { organizationId: org.id, number: "C1000", name: "Northwind Distribution", email: "ap@northwind.example" },
  })

  const v1 = await prisma.vendor.upsert({
    where: { organizationId_number: { organizationId: org.id, number: "V2000" } },
    update: {},
    create: { organizationId: org.id, number: "V2000", name: "Contoso Supplies", email: "ar@contoso.example" },
  })

  const itemA = await prisma.item.upsert({
    where: { organizationId_sku: { organizationId: org.id, sku: "SKU-ALPHA" } },
    update: {},
    create: {
      organizationId: org.id,
      sku: "SKU-ALPHA",
      name: "Widget Alpha",
      type: ItemType.STOCK,
      uom: "EA",
      salesPrice: '49.99',
      purchaseCost: '22.50',
      isStocked: true,
    },
  })

  const itemB = await prisma.item.upsert({
    where: { organizationId_sku: { organizationId: org.id, sku: "SKU-BETA" } },
    update: {},
    create: {
      organizationId: org.id,
      sku: "SKU-BETA",
      name: "Widget Beta",
      type: ItemType.STOCK,
      uom: "EA",
      salesPrice: '79.99',
      purchaseCost: '38.00',
      isStocked: true,
    },
  })

  // Orders
  const so = await prisma.salesOrder.upsert({
    where: { organizationId_orderNo: { organizationId: org.id, orderNo: "SO-10001" } },
    update: {},
    create: {
      organizationId: org.id,
      orderNo: "SO-10001",
      customerId: c1.id,
      status: "RELEASED",
      notes: "Customer order for St Thomas retail location",
      lines: {
        create: [
          { lineNo: 1, itemId: itemA.id, quantity: '3', unitPrice: '49.99', warehouseId: whSTT.id },
          { lineNo: 2, itemId: itemB.id, quantity: '1', unitPrice: '79.99', warehouseId: whSTT.id },
        ],
      },
    },
  })

  await prisma.purchaseOrder.upsert({
    where: { organizationId_orderNo: { organizationId: org.id, orderNo: "PO-90001" } },
    update: {},
    create: {
      organizationId: org.id,
      orderNo: "PO-90001",
      vendorId: v1.id,
      status: "FULFILLED",
      notes: "Received at Atlanta warehouse",
      lines: {
        create: [
          { lineNo: 1, itemId: itemA.id, quantity: '20', unitCost: '22.50', warehouseId: whATL.id },
          { lineNo: 2, itemId: itemB.id, quantity: '10', unitCost: '38.00', warehouseId: whATL.id },
        ],
      },
    },
  })

  // Inventory movements - Received PO at Atlanta
  await prisma.inventoryTransaction.createMany({
    data: [
      {
        organizationId: org.id,
        txnType: InventoryTxnType.RECEIPT,
        itemId: itemA.id,
        warehouseId: whATL.id,
        quantity: '20',
        unitCost: '22.50',
        referenceType: "PO",
        referenceId: "PO-90001",
      },
      {
        organizationId: org.id,
        txnType: InventoryTxnType.RECEIPT,
        itemId: itemB.id,
        warehouseId: whATL.id,
        quantity: '10',
        unitCost: '38.00',
        referenceType: "PO",
        referenceId: "PO-90001",
      },
    ],
  })

  // Create inventory balances for Atlanta
  await prisma.inventoryBalance.upsert({
    where: {
      organizationId_itemId_warehouseId: {
        organizationId: org.id,
        itemId: itemA.id,
        warehouseId: whATL.id,
      },
    },
    update: { onHandQty: '20', availableQty: '20', unitCost: '22.50', totalValue: '450.00' },
    create: {
      organizationId: org.id,
      itemId: itemA.id,
      warehouseId: whATL.id,
      onHandQty: '20',
      availableQty: '20',
      allocatedQty: '0',
      inTransitQty: '0',
      unitCost: '22.50',
      totalValue: '450.00',
    },
  })

  await prisma.inventoryBalance.upsert({
    where: {
      organizationId_itemId_warehouseId: {
        organizationId: org.id,
        itemId: itemB.id,
        warehouseId: whATL.id,
      },
    },
    update: { onHandQty: '10', availableQty: '10', unitCost: '38.00', totalValue: '380.00' },
    create: {
      organizationId: org.id,
      itemId: itemB.id,
      warehouseId: whATL.id,
      onHandQty: '10',
      availableQty: '10',
      allocatedQty: '0',
      inTransitQty: '0',
      unitCost: '38.00',
      totalValue: '380.00',
    },
  })

  // Create a transfer order (ATL → STT) to fulfill the SO
  const to = await prisma.transferOrder.upsert({
    where: { organizationId_transferOrderNumber: { organizationId: org.id, transferOrderNumber: "TO-1001" } },
    update: {},
    create: {
      organizationId: org.id,
      transferOrderNumber: "TO-1001",
      status: TransferOrderStatus.DRAFT,
      fromWarehouseId: whATL.id,
      toWarehouseId: whSTT.id,
      shippingMethod: "OCEAN_CONTAINER_FCL",
      notes: "Transfer to fulfill SO-10001",
      lines: {
        create: [
          {
            lineNumber: 1,
            itemId: itemA.id,
            orderedQty: '5',
            uom: "EA",
            unitCost: '22.50',
          },
          {
            lineNumber: 2,
            itemId: itemB.id,
            orderedQty: '3',
            uom: "EA",
            unitCost: '38.00',
          },
        ],
      },
    },
  })

  // Create a container for ocean freight (ATL → STT)
  const container = await prisma.container.upsert({
    where: { organizationId_containerNumber: { organizationId: org.id, containerNumber: "CONT-001" } },
    update: {},
    create: {
      organizationId: org.id,
      containerNumber: "CONT-001",
      containerType: "40FT_FCL",
      status: ContainerStatus.PLANNED,
      originWarehouseId: whATL.id,
      destWarehouseId: whSTT.id,
      carrier: "Matson Navigation",
      vesselName: "MV Island Princess",
      bookingNumber: "MTN-2025-001",
      plannedLoadDate: new Date('2025-01-15'),
      plannedDepartDate: new Date('2025-01-16'),
      plannedArrivalDate: new Date('2025-01-30'),
      plannedUnloadDate: new Date('2025-01-31'),
      estimatedTransitDays: 14,
      notes: "Weekly container shipment to St Thomas",
    },
  })

  // Create reorder points for STT (stocked items)
  await prisma.reorderPoint.upsert({
    where: {
      organizationId_itemId_warehouseId: {
        organizationId: org.id,
        itemId: itemA.id,
        warehouseId: whSTT.id,
      },
    },
    update: {},
    create: {
      organizationId: org.id,
      itemId: itemA.id,
      warehouseId: whSTT.id,
      minQty: '10',
      maxQty: '50',
      safetyStock: '5',
      reorderQty: '25',
      leadTimeDays: 14,
    },
  })

  await prisma.reorderPoint.upsert({
    where: {
      organizationId_itemId_warehouseId: {
        organizationId: org.id,
        itemId: itemB.id,
        warehouseId: whSTT.id,
      },
    },
    update: {},
    create: {
      organizationId: org.id,
      itemId: itemB.id,
      warehouseId: whSTT.id,
      minQty: '5',
      maxQty: '25',
      safetyStock: '3',
      reorderQty: '15',
      leadTimeDays: 14,
    },
  })

  // Finance: minimal COA + demo journal
  const accounts = [
    { number: "1000", name: "Cash", type: AccountType.ASSET },
    { number: "1200", name: "Accounts Receivable", type: AccountType.ASSET },
    { number: "2000", name: "Accounts Payable", type: AccountType.LIABILITY },
    { number: "1400", name: "Inventory", type: AccountType.ASSET },
    { number: "4000", name: "Sales Revenue", type: AccountType.REVENUE },
    { number: "5000", name: "Cost of Goods Sold", type: AccountType.EXPENSE },
  ]

  for (const a of accounts) {
    await prisma.account.upsert({
      where: { organizationId_number: { organizationId: org.id, number: a.number } },
      update: { name: a.name, type: a.type },
      create: { organizationId: org.id, ...a },
    })
  }

  const je = await prisma.journalEntry.upsert({
    where: { organizationId_journalNo: { organizationId: org.id, journalNo: "JE-0001" } },
    update: {},
    create: {
      organizationId: org.id,
      journalNo: "JE-0001",
      description: "Demo sale posting (simplified)",
      status: JournalStatus.POSTED,
      lines: {
        create: [
          {
            lineNo: 1,
            accountId: (await prisma.account.findFirstOrThrow({ where: { organizationId: org.id, number: "1200" } })).id,
            debit: '229.96',
            credit: 0,
            memo: "AR",
          },
          {
            lineNo: 2,
            accountId: (await prisma.account.findFirstOrThrow({ where: { organizationId: org.id, number: "4000" } })).id,
            debit: 0,
            credit: '229.96',
            memo: "Revenue",
          },
        ],
      },
    },
  })

  console.log("Seeded org:", org.name)
  console.log("Warehouses: ATL, STT, STX")
  console.log("Transfer Order:", to.transferOrderNumber)
  console.log("Container:", container.containerNumber)
  console.log("Journal:", je.journalNo)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
