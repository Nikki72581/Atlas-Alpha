import { PrismaClient, AccountType, ItemType, InventoryTxnType, JournalStatus } from "@prisma/client"

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

  // Master data
  const whMain = await prisma.warehouse.upsert({
    where: { organizationId_code: { organizationId: org.id, code: "MAIN" } },
    update: { name: "Main Warehouse" },
    create: { organizationId: org.id, code: "MAIN", name: "Main Warehouse" },
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
      lines: {
        create: [
          { lineNo: 1, itemId: itemA.id, quantity: '3', unitPrice: '49.99', warehouseId: whMain.id },
          { lineNo: 2, itemId: itemB.id, quantity: '1', unitPrice: '79.99', warehouseId: whMain.id },
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
      status: "RELEASED",
      lines: {
        create: [
          { lineNo: 1, itemId: itemA.id, quantity: '20', unitCost: '22.50', warehouseId: whMain.id },
          { lineNo: 2, itemId: itemB.id, quantity: '10', unitCost: '38.00', warehouseId: whMain.id },
        ],
      },
    },
  })

  // Inventory movements (pretend we received PO and shipped SO)
  await prisma.inventoryTransaction.createMany({
    data: [
      {
        organizationId: org.id,
        txnType: InventoryTxnType.RECEIPT,
        itemId: itemA.id,
        warehouseId: whMain.id,
        quantity: '20',
        unitCost: '22.50',
        referenceType: "PO",
        referenceId: "PO-90001",
      },
      {
        organizationId: org.id,
        txnType: InventoryTxnType.RECEIPT,
        itemId: itemB.id,
        warehouseId: whMain.id,
        quantity: '10',
        unitCost: '38.00',
        referenceType: "PO",
        referenceId: "PO-90001",
      },
      {
        organizationId: org.id,
        txnType: InventoryTxnType.ISSUE,
        itemId: itemA.id,
        warehouseId: whMain.id,
        quantity: '-3',
        unitCost: '22.50',
        referenceType: "SO",
        referenceId: so.orderNo,
      },
      {
        organizationId: org.id,
        txnType: InventoryTxnType.ISSUE,
        itemId: itemB.id,
        warehouseId: whMain.id,
        quantity: '-1',
        unitCost: '38.00',
        referenceType: "SO",
        referenceId: so.orderNo,
      },
    ],
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

  console.log("Seeded org:", org.name, "Journal:", je.journalNo)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
