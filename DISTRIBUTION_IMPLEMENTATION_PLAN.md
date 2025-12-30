# Atlas ERP: Distribution Module Implementation Plan
## USVI Parts & Commodities Distribution Scenario

---

## Executive Summary

This plan outlines the implementation of inventory, sales order (SO), and purchase order (PO) modules specifically designed for a multi-location distribution business operating between Atlanta, GA and the US Virgin Islands (St. Thomas, St. Croix, St. John).

**Business Model:** Parts and commodities transporter/distributor with:
- Main receiving location: Atlanta, GA
- Island warehouses: St. Thomas, St. Croix (St. John served via St. Thomas)
- Transportation modes: Ocean freight containers, DHL air freight
- Customer types: Retail walk-ins, custom special orders, hotel/resort bulk supplies
- Procurement model: Sales reps purchase on corporate cards → ship to Atlanta → transfer to islands

**Core Challenge:** Replace Acumatica's inadequate handling of:
1. Container building and tracking
2. In-transit inventory visibility
3. Multi-leg transfers (ATL → ST THOMAS → ST JOHN)
4. Sales order → Purchase order → Transfer order flow integration

---

## Part 1: Database Schema Extensions

### 1.1 New Models to Add to `schema.prisma`

```prisma
// ============================================================================
// WAREHOUSE & LOCATION ENHANCEMENTS
// ============================================================================

model WarehouseLocation {
  id             String   @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])

  warehouseId    String
  warehouse      Warehouse @relation(fields: [warehouseId], references: [id])

  // Location hierarchy: Aisle-Bin-Position (e.g., "A01-B12-P03")
  aisle          String?
  bin            String?
  position       String?

  // Formatted location code (e.g., "A01-B12-P03")
  locationCode   String

  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Relationships
  inventoryBalances InventoryBalance[]

  @@unique([warehouseId, locationCode])
  @@index([organizationId, warehouseId])
  @@map("warehouse_locations")
}

// Materialized inventory balance table for performance
model InventoryBalance {
  id             String   @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])

  itemId         String
  item           Item @relation(fields: [itemId], references: [id])

  warehouseId    String
  warehouse      Warehouse @relation(fields: [warehouseId], references: [id])

  locationId     String?
  location       WarehouseLocation? @relation(fields: [locationId], references: [id])

  // Lot/serial tracking
  lotNumber      String?
  serialNumber   String?
  expiryDate     DateTime?

  // Quantities
  onHandQty      Decimal  @default(0)  // Physical quantity
  allocatedQty   Decimal  @default(0)  // Reserved for SO
  availableQty   Decimal  @default(0)  // onHand - allocated
  inTransitQty   Decimal  @default(0)  // On transfer order

  // Costing
  unitCost       Decimal?
  totalValue     Decimal?

  lastUpdated    DateTime @updatedAt

  @@unique([organizationId, itemId, warehouseId, lotNumber, serialNumber, locationId])
  @@index([organizationId, itemId])
  @@index([warehouseId])
  @@map("inventory_balances")
}

// ============================================================================
// SHIPPING & LOGISTICS
// ============================================================================

enum ShippingMethod {
  OCEAN_CONTAINER_FCL  // Full Container Load
  OCEAN_CONTAINER_LCL  // Less than Container Load
  AIR_FREIGHT_DHL
  AIR_FREIGHT_FEDEX
  AIR_FREIGHT_UPS
  GROUND_LTL          // Less than Truckload
  GROUND_FTL          // Full Truckload
  COURIER_LOCAL       // Local delivery (St Thomas → St John)
}

enum ShipmentStatus {
  DRAFT
  READY_TO_SHIP
  IN_TRANSIT
  DELIVERED
  CANCELLED
  EXCEPTION  // Customs hold, damage, etc.
}

enum ContainerStatus {
  PLANNING      // Building the container
  READY         // Ready to ship
  IN_TRANSIT    // On the water
  AT_PORT       // Arrived at port (not yet delivered)
  DELIVERED     // Delivered to warehouse
  CANCELLED
}

model Shipment {
  id             String   @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])

  // Document info
  shipmentNumber String   @unique
  status         ShipmentStatus @default(DRAFT)

  // Source & destination
  fromWarehouseId String
  fromWarehouse   Warehouse @relation("ShipmentFrom", fields: [fromWarehouseId], references: [id])

  toWarehouseId   String
  toWarehouse     Warehouse @relation("ShipmentTo", fields: [toWarehouseId], references: [id])

  // Customer info (if customer shipment)
  customerId      String?
  customer        Customer? @relation(fields: [customerId], references: [id])

  shipToAddress   String?  // Full address in TEXT or JSONB
  shipToContact   String?
  shipToPhone     String?

  // Shipping details
  shippingMethod  ShippingMethod
  carrier         String?   // FedEx, DHL, Matson, etc.
  trackingNumber  String?
  containerId     String?   // If part of container
  container       Container? @relation(fields: [containerId], references: [id])

  // Dates
  shipDate        DateTime?
  expectedDeliveryDate DateTime?
  actualDeliveryDate   DateTime?

  // Weight/dimensions
  totalWeight     Decimal?
  weightUom       String?   // LBS, KG
  totalVolume     Decimal?
  volumeUom       String?   // CUFT, CBM

  // Costs
  freightCost     Decimal?
  insuranceCost   Decimal?
  otherCosts      Decimal?
  totalCost       Decimal?

  // Notes
  notes           String?
  internalNotes   String?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relationships
  lines           ShipmentLine[]

  @@index([organizationId])
  @@index([status])
  @@index([fromWarehouseId])
  @@index([toWarehouseId])
  @@index([containerId])
  @@map("shipments")
}

model ShipmentLine {
  id             String   @id @default(cuid())

  shipmentId     String
  shipment       Shipment @relation(fields: [shipmentId], references: [id], onDelete: Cascade)

  lineNumber     Int      // 1, 2, 3...

  // Item info
  itemId         String
  item           Item @relation(fields: [itemId], references: [id])

  lotNumber      String?
  serialNumber   String?

  // Quantities
  quantity       Decimal
  uom            String   @default("EA")

  // Weight/dimensions (line level)
  weight         Decimal?
  weightUom      String?

  // Reference to source document (SO, Transfer Order, etc.)
  sourceType     String?  // "SalesOrder", "TransferOrder", "PurchaseOrder"
  sourceId       String?
  sourceLineId   String?

  notes          String?

  @@unique([shipmentId, lineNumber])
  @@index([itemId])
  @@map("shipment_lines")
}

// Container management for ocean freight
model Container {
  id             String   @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])

  // Container info
  containerNumber String  @unique  // e.g., "CONT-2024-001"
  containerType   String?          // 20ft, 40ft, 40ft HC, etc.
  sealNumber      String?

  status          ContainerStatus @default(PLANNING)

  // Route
  fromWarehouseId String
  fromWarehouse   Warehouse @relation("ContainerFrom", fields: [fromWarehouseId], references: [id])

  toWarehouseId   String
  toWarehouse     Warehouse @relation("ContainerTo", fields: [toWarehouseId], references: [id])

  // Shipping details
  carrier         String?
  vesselName      String?
  voyageNumber    String?
  billOfLading    String?  // BOL number

  // Dates
  plannedShipDate     DateTime?
  actualShipDate      DateTime?
  estimatedArrivalDate DateTime?
  actualArrivalDate    DateTime?
  deliveredDate        DateTime?

  // Capacity
  maxWeight       Decimal?
  maxVolume       Decimal?
  currentWeight   Decimal?
  currentVolume   Decimal?

  // Costs
  totalFreightCost Decimal?

  notes           String?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relationships
  shipments       Shipment[]
  lines           ContainerLine[]

  @@index([organizationId])
  @@index([status])
  @@map("containers")
}

model ContainerLine {
  id             String   @id @default(cuid())

  containerId    String
  container      Container @relation(fields: [containerId], references: [id], onDelete: Cascade)

  lineNumber     Int

  // Item info
  itemId         String
  item           Item @relation(fields: [itemId], references: [id])

  quantity       Decimal
  uom            String   @default("EA")

  weight         Decimal?
  volume         Decimal?

  // Reference to source
  sourceType     String?  // "TransferOrder", "PurchaseOrder"
  sourceId       String?

  notes          String?

  @@unique([containerId, lineNumber])
  @@index([itemId])
  @@map("container_lines")
}

// ============================================================================
// TRANSFER ORDERS (Warehouse-to-Warehouse)
// ============================================================================

enum TransferOrderStatus {
  DRAFT
  RELEASED
  PARTIALLY_SHIPPED
  SHIPPED
  PARTIALLY_RECEIVED
  RECEIVED
  CANCELLED
}

model TransferOrder {
  id             String   @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])

  // Document info
  transferOrderNumber String @unique
  status         TransferOrderStatus @default(DRAFT)

  // Warehouses
  fromWarehouseId String
  fromWarehouse   Warehouse @relation("TransferOrderFrom", fields: [fromWarehouseId], references: [id])

  toWarehouseId   String
  toWarehouse     Warehouse @relation("TransferOrderTo", fields: [toWarehouseId], references: [id])

  // Dates
  orderDate       DateTime @default(now())
  requestedShipDate DateTime?
  actualShipDate    DateTime?
  expectedReceiptDate DateTime?
  actualReceiptDate   DateTime?

  // Shipping
  shippingMethod  ShippingMethod?
  shipmentId      String?
  containerId     String?

  // Reference
  referenceNumber String?
  notes           String?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relationships
  lines           TransferOrderLine[]

  @@index([organizationId])
  @@index([status])
  @@index([fromWarehouseId])
  @@index([toWarehouseId])
  @@map("transfer_orders")
}

model TransferOrderLine {
  id             String   @id @default(cuid())

  transferOrderId String
  transferOrder   TransferOrder @relation(fields: [transferOrderId], references: [id], onDelete: Cascade)

  lineNumber     Int

  // Item
  itemId         String
  item           Item @relation(fields: [itemId], references: [id])

  lotNumber      String?
  serialNumber   String?

  // Quantities
  orderedQty     Decimal
  shippedQty     Decimal @default(0)
  receivedQty    Decimal @default(0)

  uom            String   @default("EA")

  // Costing (for landed cost allocation)
  unitCost       Decimal?

  notes          String?

  @@unique([transferOrderId, lineNumber])
  @@index([itemId])
  @@map("transfer_order_lines")
}

// ============================================================================
// SALES ORDER ENHANCEMENTS
// ============================================================================

// Add to existing SalesOrderLine model:
// - allocatedWarehouseId (where inventory is allocated)
// - allocatedQty
// - shippedQty
// - backorderQty

// ============================================================================
// PURCHASE ORDER ENHANCEMENTS
// ============================================================================

enum PurchaseType {
  STANDARD          // Normal PO to vendor
  CORPORATE_CARD    // Purchased on sales rep's card
  CONSIGNMENT       // Vendor-owned inventory
  DROP_SHIP         // Direct to customer
}

// Add to existing PurchaseOrder model:
// - purchaseType (for corporate card tracking)
// - purchasedBy (sales rep who used their card)
// - cardLast4 (for reconciliation)
// - receiptWarehouseId (where goods will be received - Atlanta)
// - finalDestinationWarehouseId (ultimate island destination)

// ============================================================================
// REORDER MANAGEMENT
// ============================================================================

model ReorderPoint {
  id             String   @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])

  itemId         String
  item           Item @relation(fields: [itemId], references: [id])

  warehouseId    String
  warehouse      Warehouse @relation(fields: [warehouseId], references: [id])

  // Inventory levels
  minQty         Decimal  // Reorder point
  maxQty         Decimal  // Max stock level
  safetyStock    Decimal  @default(0)

  // Replenishment
  reorderQty     Decimal  // Standard order quantity
  leadTimeDays   Int      @default(0)

  // Vendor preference
  preferredVendorId String?
  vendor            Vendor? @relation(fields: [preferredVendorId], references: [id])

  isActive       Boolean  @default(true)

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@unique([organizationId, itemId, warehouseId])
  @@index([organizationId])
  @@map("reorder_points")
}

// ============================================================================
// ITEM ENHANCEMENTS
// ============================================================================

enum ItemTrackingType {
  NONE
  LOT
  SERIAL
  LOT_AND_SERIAL
}

// Add to existing Item model:
// - trackingType (NONE, LOT, SERIAL, LOT_AND_SERIAL)
// - defaultVendorId
// - defaultLeadTimeDays
// - isDropShip
// - isSerialized
// - requiresLotControl
```

### 1.2 Warehouse Enhancements

Add these fields to existing `Warehouse` model:

```prisma
model Warehouse {
  // ... existing fields ...

  // Location details
  addressLine1   String?
  addressLine2   String?
  city           String?
  state          String?
  postalCode     String?
  country        String?   @default("US")

  // Warehouse type
  warehouseType  String?   // "MAIN", "RETAIL", "TRANSIT", "3PL"

  // Island-specific
  islandCode     String?   // "STT", "STX", "STJ", "ATL"

  // Active status
  isActive       Boolean   @default(true)

  // New relationships
  locations      WarehouseLocation[]
  balances       InventoryBalance[]
  reorderPoints  ReorderPoint[]

  shipmentsFrom  Shipment[] @relation("ShipmentFrom")
  shipmentsTo    Shipment[] @relation("ShipmentTo")

  containersFrom Container[] @relation("ContainerFrom")
  containersTo   Container[] @relation("ContainerTo")

  transferOrdersFrom TransferOrder[] @relation("TransferOrderFrom")
  transferOrdersTo   TransferOrder[] @relation("TransferOrderTo")
}
```

---

## Part 2: Business Process Flows

### 2.1 **Custom Order Flow** (Car Parts / Special Orders)

```
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 1: ORDER & PROCUREMENT                                    │
└─────────────────────────────────────────────────────────────────┘

1. Customer places order at St Thomas retail location
   → CREATE Sales Order (status: DRAFT)
   → Customer: Hotel/Retail customer
   → Warehouse: ST THOMAS
   → Lines: Item (may not exist yet), Qty, Unit Price

2. Sales rep reviews order
   → If item doesn't exist: CREATE Item (on-the-fly)
   → Sales rep purchases on corporate credit card
   → CREATE Purchase Order:
      - Purchase Type: CORPORATE_CARD
      - Purchased By: Sales Rep
      - Card Last 4: 1234
      - Vendor: Online vendor / Auto parts supplier
      - Receipt Warehouse: ATLANTA
      - Final Destination: ST THOMAS (reference field)
   → Link PO to SO (reference fields)

3. Vendor ships to Atlanta
   → Track shipment (external tracking number on PO)

┌─────────────────────────────────────────────────────────────────┐
│ PHASE 2: ATLANTA RECEIPT                                         │
└─────────────────────────────────────────────────────────────────┘

4. Goods arrive at Atlanta warehouse
   → RECEIVE Purchase Order:
      - Create Receipt document (future enhancement)
      - Create Inventory Transaction:
         * Type: RECEIPT
         * Warehouse: ATLANTA
         * Item, Qty, Unit Cost
         * Reference: PO-90001
   → Update PO status: PARTIALLY_FULFILLED or FULFILLED
   → Update Inventory Balance (ATLANTA):
      * onHandQty += received qty

┌─────────────────────────────────────────────────────────────────┐
│ PHASE 3: CONTAINER BUILDING (If Ocean Freight)                  │
└─────────────────────────────────────────────────────────────────┘

5. Reorder clerk reviews pending transfers
   → View "Items to Transfer" report:
      - Shows SO lines awaiting fulfillment
      - Groups by destination warehouse
      - Shows qty needed vs. qty in Atlanta

6. Clerk creates Transfer Order
   → CREATE Transfer Order:
      - From Warehouse: ATLANTA
      - To Warehouse: ST THOMAS
      - Shipping Method: OCEAN_CONTAINER_FCL or _LCL
      - Lines: Items needed for ST THOMAS orders
   → Status: DRAFT

7. Clerk builds container
   → CREATE Container:
      - Container Number: CONT-2024-001
      - Container Type: 40ft
      - From: ATLANTA
      - To: ST THOMAS
      - Status: PLANNING

   → Link Transfer Orders to Container:
      - Container Lines reference TO lines
      - Calculate weight/volume utilization

   → When container is full:
      - Status: READY
      - Schedule ship date

┌─────────────────────────────────────────────────────────────────┐
│ PHASE 4: SHIPPING                                                │
└─────────────────────────────────────────────────────────────────┘

8. Container ships from Atlanta
   → UPDATE Container:
      - Status: IN_TRANSIT
      - Actual Ship Date: today
      - Vessel Name, Voyage Number, BOL

   → CREATE Shipment (linked to Container):
      - From: ATLANTA
      - To: ST THOMAS
      - Shipping Method: OCEAN_CONTAINER_FCL
      - Container: CONT-2024-001
      - Lines: (from Transfer Order)

   → UPDATE Transfer Order:
      - Status: SHIPPED
      - Actual Ship Date: today

   → CREATE Inventory Transactions (for each TO line):
      - Type: TRANSFER (OUT)
      - Warehouse: ATLANTA
      - Qty: -shipped qty
      - Reference: TO-1001

   → UPDATE Inventory Balance (ATLANTA):
      - inTransitQty += shipped qty
      - onHandQty -= shipped qty

┌─────────────────────────────────────────────────────────────────┐
│ PHASE 5: IN-TRANSIT TRACKING                                     │
└─────────────────────────────────────────────────────────────────┘

9. Container in transit
   → VIEW "Inventory in Transit" report:
      - Shows all containers with status IN_TRANSIT
      - Groups by destination
      - Shows ETA, days in transit
      - Shows items on each container

   → UPDATE Container:
      - Status: AT_PORT (when arrives at port)
      - Estimated Arrival Date → Actual Arrival Date

┌─────────────────────────────────────────────────────────────────┐
│ PHASE 6: ISLAND RECEIPT                                          │
└─────────────────────────────────────────────────────────────────┘

10. Container delivered to St Thomas warehouse
    → RECEIVE Transfer Order:
       - For each line:
          * Create Inventory Transaction:
            - Type: TRANSFER (IN)
            - Warehouse: ST THOMAS
            - Qty: +received qty
            - Reference: TO-1001

    → UPDATE Transfer Order:
       - Status: RECEIVED
       - Actual Receipt Date: today

    → UPDATE Inventory Balance (ST THOMAS):
       - onHandQty += received qty
       - inTransitQty -= received qty (in ATLANTA balance)

    → UPDATE Container:
       - Status: DELIVERED
       - Delivered Date: today

┌─────────────────────────────────────────────────────────────────┐
│ PHASE 7: FULFILLMENT                                             │
└─────────────────────────────────────────────────────────────────┘

11. Fulfill Sales Order
    → ALLOCATE SO Line:
       - Update SalesOrderLine:
          * allocatedWarehouseId: ST THOMAS
          * allocatedQty: qty
       - Update Inventory Balance:
          * allocatedQty += qty
          * availableQty -= qty

    → SHIP SO:
       - Create Shipment (customer delivery)
       - Create Inventory Transaction:
          * Type: ISSUE
          * Warehouse: ST THOMAS
          * Qty: -shipped qty
          * Reference: SO-10001
       - Update SO status: FULFILLED

    → UPDATE Inventory Balance (ST THOMAS):
       - onHandQty -= shipped qty
       - allocatedQty -= shipped qty

12. Invoice & Payment (future phase)
    → Create AR Invoice from SO
    → Post to GL
```

### 2.2 **Bulk Hotel Supply Flow** (Toilet Paper, Plates, etc.)

```
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 1: STANDING ORDERS & REORDER POINTS                       │
└─────────────────────────────────────────────────────────────────┘

1. Setup reorder points for stocked items
   → CREATE Reorder Point:
      - Item: Toilet Paper - 2-Ply Commercial
      - Warehouse: ST THOMAS
      - Min Qty: 500 cases
      - Max Qty: 2000 cases
      - Reorder Qty: 1000 cases
      - Lead Time: 21 days (Atlanta → St Thomas)
      - Preferred Vendor: Paper Goods Distributor

2. Reorder clerk runs "Items Below Reorder Point" report
   → Shows: ST THOMAS toilet paper at 450 cases (below 500 min)
   → Recommendation: Order 1000 cases

3. Clerk creates Purchase Order
   → CREATE Purchase Order:
      - Vendor: Paper Goods Distributor
      - Purchase Type: STANDARD
      - Receipt Warehouse: ATLANTA
      - Final Destination: ST THOMAS
      - Lines: 1000 cases toilet paper

┌─────────────────────────────────────────────────────────────────┐
│ PHASE 2: RECEIVE AT ATLANTA, TRANSFER TO ST THOMAS              │
└─────────────────────────────────────────────────────────────────┘

4. Receive at Atlanta (same as custom order flow step 4)

5. Create Transfer Order + Container (same as steps 6-7)

6. Ship, track, receive (same as steps 8-10)

┌─────────────────────────────────────────────────────────────────┐
│ PHASE 3: CUSTOMER ORDER & FULFILLMENT                           │
└─────────────────────────────────────────────────────────────────┘

7. Hotel places order (standing order or ad-hoc)
   → CREATE Sales Order:
      - Customer: Ritz Carlton St Thomas
      - Warehouse: ST THOMAS
      - Lines: 50 cases toilet paper

8. Allocate & ship (same as step 11)
```

### 2.3 **St Thomas → St John Transfer**

```
1. Customer on St John orders car part
   → CREATE Sales Order:
      - Customer: St John Auto Repair
      - Warehouse: ST THOMAS (inventory location)
      - Delivery Location: ST JOHN (custom field or ship-to)

2. Allocate from St Thomas inventory
   → ALLOCATE SO Line (warehouse: ST THOMAS)

3. Create local delivery shipment
   → CREATE Shipment:
      - From: ST THOMAS
      - To: ST JOHN (customer address)
      - Shipping Method: COURIER_LOCAL
      - Carrier: Local Courier

   → CREATE Inventory Transaction:
      - Type: ISSUE
      - Warehouse: ST THOMAS
      - Reference: SO-10002

4. Deliver to St John customer
   → UPDATE Shipment: status = DELIVERED
   → UPDATE SO: status = FULFILLED
```

### 2.4 **DHL Air Freight for Urgent Orders**

```
1. Customer needs urgent part (not in stock)
   → CREATE Sales Order (ST THOMAS)
   → CREATE Purchase Order (ATLANTA receipt)

2. Vendor ships to Atlanta (expedited)
   → RECEIVE at Atlanta

3. Immediately create air freight shipment
   → CREATE Transfer Order:
      - Shipping Method: AIR_FREIGHT_DHL
      - Expedited flag

   → CREATE Shipment (no container):
      - Shipping Method: AIR_FREIGHT_DHL
      - Tracking Number: DHL-12345

   → SHIP from Atlanta (same day)
   → UPDATE inventory (ATLANTA → in-transit)

4. Receive at St Thomas (2-3 days vs. 14 days ocean)
   → RECEIVE Transfer Order
   → Fulfill Sales Order
```

---

## Part 3: Reports & Dashboards

### 3.1 **Critical Reports for USVI Distribution**

| Report Name | Purpose | Key Metrics |
|-------------|---------|-------------|
| **Items to Transfer** | Shows SO lines awaiting fulfillment, grouped by destination | Item, Qty Ordered, Qty in ATL, Qty to Ship |
| **Inventory in Transit** | All containers/shipments between locations | Container #, From/To, Ship Date, ETA, Items, Status |
| **Container Load Planning** | Helps build containers efficiently | Container #, Capacity Used (weight/volume %), Items, Lines |
| **Items Below Reorder Point** | Triggers PO creation for stocked items | Item, Warehouse, On-Hand, Min Qty, Reorder Qty, Vendor |
| **On-Hand by Location** | Current inventory across all warehouses | Item, ATL, STT, STX, In-Transit Total |
| **Sales Order Fulfillment Status** | Open SO lines by status | SO #, Customer, Item, Ordered, Allocated, Shipped, Backorder |
| **Purchase Order Status** | Open PO lines by status | PO #, Vendor, Item, Ordered, Received, Outstanding, Type (Corp Card) |
| **Corporate Card Reconciliation** | POs purchased on sales rep cards | Sales Rep, PO #, Vendor, Amount, Card Last 4, Receipt Date, Reimbursed? |
| **Transfer Order Status** | All active transfer orders | TO #, From/To, Items, Ordered, Shipped, Received, Status |
| **Freight Cost Analysis** | Track shipping costs by route | Route, Container Count, Total Freight, Cost per LB, Cost per Item |
| **Inventory Valuation** | Total inventory value by location | Warehouse, Item Count, Total Units, Total Value |
| **Slow-Moving Inventory** | Items with low turnover | Item, Warehouse, On-Hand, Last Sale Date, Days Since Movement |
| **Customer Demand Forecast** | Predict reorder needs based on history | Item, Warehouse, Avg Monthly Sales, Suggested Min/Max |

### 3.2 **Dashboard Widgets**

**Operations Dashboard:**
- Containers in transit (count + ETA)
- Items below reorder point (count)
- Open sales orders (count + value)
- Open transfer orders (count)
- Inventory value by warehouse

**Reorder Clerk Dashboard:**
- Items to reorder (sorted by urgency)
- Items awaiting transfer (grouped by destination)
- Containers in planning status
- Transfer orders awaiting shipment

**Sales Dashboard:**
- Open sales orders by location
- Backorder queue
- Average fulfillment time (by warehouse)
- Top customers (by volume)

---

## Part 4: Implementation Phases

### **Phase 1: Foundation** (Weeks 1-2)

**Goal:** Set up warehouse structure, basic inventory tracking, transfer orders

**Tasks:**
1. Update `schema.prisma` with:
   - Warehouse enhancements (address, island code, type)
   - `InventoryBalance` model (materialized balances)
   - `TransferOrder` + `TransferOrderLine` models
   - `ReorderPoint` model

2. Create migration and run seed updates:
   - Add Atlanta, St Thomas, St Croix, St John warehouses
   - Set island codes (ATL, STT, STX, STJ)
   - Seed reorder points for demo items

3. Build Transfer Order UI:
   - `app/dashboard/transfer-orders/page.tsx` (list)
   - `transfer-order-dialog.tsx` (create/edit)
   - `actions.ts` (CRUD operations)
   - Status workflow: DRAFT → RELEASED → SHIPPED → RECEIVED

4. Build "Items to Transfer" report:
   - Shows open SO lines
   - Groups by destination warehouse
   - Shows qty needed vs. qty in Atlanta
   - Button: "Create Transfer Order"

**Deliverables:**
- ✅ Transfer order creation & management
- ✅ Basic multi-warehouse inventory visibility
- ✅ Reorder point setup

---

### **Phase 2: Container Management** (Weeks 3-4)

**Goal:** Build and track ocean freight containers

**Tasks:**
1. Add to `schema.prisma`:
   - `Container` + `ContainerLine` models
   - `Shipment` + `ShipmentLine` models
   - Shipping method enums

2. Build Container UI:
   - `app/dashboard/containers/page.tsx` (list with status filters)
   - `container-dialog.tsx` (create/edit)
   - Container builder:
     * Drag-and-drop transfer order lines into container
     * Show weight/volume utilization
     * Validate capacity
   - Status workflow: PLANNING → READY → IN_TRANSIT → AT_PORT → DELIVERED

3. Build "Inventory in Transit" dashboard:
   - Map view (optional: future enhancement)
   - List view with ETA countdown
   - Filter by destination
   - Drill-down to container lines

4. Integrate Transfer Orders with Containers:
   - Link TO to Container on shipment
   - Update TO status when container ships
   - Create inventory transactions (TRANSFER OUT from Atlanta)

**Deliverables:**
- ✅ Container creation & load planning
- ✅ In-transit inventory tracking
- ✅ Transfer order → Container → Shipment flow

---

### **Phase 3: Sales Order Fulfillment** (Weeks 5-6)

**Goal:** Complete SO → PO → Transfer → Fulfillment flow

**Tasks:**
1. Enhance SO/PO models:
   - Add `PurchaseType` enum
   - Add `purchasedBy`, `cardLast4` to PO
   - Add `allocatedWarehouseId`, `allocatedQty`, `shippedQty` to SO lines
   - Add `receiptWarehouseId`, `finalDestinationWarehouseId` to PO

2. Build SO allocation workflow:
   - "Allocate" button on SO page
   - Shows available inventory by warehouse
   - Updates `allocatedQty` on SO line
   - Updates `allocatedQty` in `InventoryBalance`

3. Build SO shipment workflow:
   - "Ship" button on SO page
   - Creates Shipment document
   - Creates Inventory Transaction (ISSUE)
   - Updates SO status to FULFILLED
   - Updates Inventory Balance

4. Build PO receipt workflow:
   - "Receive" button on PO page
   - Creates Inventory Transaction (RECEIPT)
   - Updates PO status to FULFILLED
   - Updates Inventory Balance

5. Build PO → SO linking:
   - Reference fields on PO lines
   - "Create PO from SO" action
   - Shows linked SO on PO detail page

6. Corporate card tracking:
   - Filter POs by `purchaseType = CORPORATE_CARD`
   - "Corporate Card Reconciliation" report
   - Export for expense reimbursement

**Deliverables:**
- ✅ SO allocation & shipment
- ✅ PO receipt at Atlanta
- ✅ SO → PO → TO → Container → Receipt → Fulfillment flow
- ✅ Corporate card PO tracking

---

### **Phase 4: Reorder Automation** (Weeks 7-8)

**Goal:** Automate reorder point monitoring and PO generation

**Tasks:**
1. Build "Items Below Reorder Point" report:
   - Scheduled job (daily) to check inventory levels
   - Compare `onHandQty + inTransitQty` vs. `minQty`
   - Show recommended order qty
   - Filter by warehouse

2. Build "Create PO from Reorder Point" action:
   - Pre-fill PO with:
     * Preferred vendor
     * Reorder qty
     * Receipt warehouse (Atlanta)
     * Final destination warehouse
   - User reviews & submits

3. Build reorder point management UI:
   - `app/dashboard/reorder-points/page.tsx`
   - CRUD for reorder points
   - Bulk import from CSV
   - "Copy from Warehouse" action (copy STT reorder points to STX)

4. Build demand forecast report (future enhancement):
   - Analyze historical SO data
   - Suggest min/max levels by item/warehouse
   - Seasonality adjustments

**Deliverables:**
- ✅ Reorder point monitoring
- ✅ Automated PO creation suggestions
- ✅ Reorder point management UI

---

### **Phase 5: Reporting & Analytics** (Weeks 9-10)

**Goal:** Build critical reports for operations & finance

**Tasks:**
1. Build operational reports:
   - On-Hand by Location (all warehouses + in-transit)
   - Sales Order Fulfillment Status
   - Transfer Order Status
   - Container Load Planning
   - Freight Cost Analysis

2. Build financial reports:
   - Inventory Valuation (by warehouse, by item)
   - Corporate Card Reconciliation
   - Purchase Price Variance (actual cost vs. standard cost)

3. Build analytics dashboards:
   - Operations Dashboard (for warehouse managers)
   - Reorder Clerk Dashboard
   - Sales Dashboard

4. Export functionality:
   - CSV export for all reports
   - Excel export with formatting
   - PDF export for container packing lists

**Deliverables:**
- ✅ 12+ operational & financial reports
- ✅ Role-based dashboards
- ✅ Export functionality

---

### **Phase 6: Advanced Features** (Weeks 11-12)

**Goal:** Lot/serial tracking, landed cost, multi-leg transfers

**Tasks:**
1. Lot/serial tracking:
   - Add `trackingType` to Item model
   - Add `lotNumber`, `serialNumber` to Inventory Balance
   - Enforce lot/serial entry on receipt
   - Show lot/serial on allocations & shipments

2. Landed cost allocation:
   - Add freight cost to Container
   - Allocate freight to container lines (by weight or value)
   - Update inventory unit cost on receipt
   - Post freight variance to GL

3. Multi-leg transfers:
   - St Thomas → St John local delivery
   - Create Transfer Order with intermediate stops
   - Track each leg separately

4. Shipping integrations:
   - DHL API for tracking (read-only)
   - Matson API for ocean freight visibility (read-only)
   - Auto-update container status based on carrier data

**Deliverables:**
- ✅ Lot/serial inventory tracking
- ✅ Landed cost allocation
- ✅ Multi-leg transfer support
- ✅ Carrier integration (tracking only)

---

## Part 5: Technical Architecture

### 5.1 **Inventory Transaction Model**

**Key Principle:** All inventory movements create an `InventoryTransaction` record (immutable audit trail).

**Transaction Types:**
- `RECEIPT` - PO receipt into warehouse
- `ISSUE` - SO shipment out of warehouse
- `TRANSFER` - Warehouse-to-warehouse movement (creates 2 txns: OUT and IN)
- `ADJUSTMENT` - Cycle count, writeoff, etc.

**Inventory Balance Calculation:**
```typescript
// Real-time calculation (current approach)
const balance = await prisma.inventoryTransaction.groupBy({
  by: ['itemId', 'warehouseId'],
  _sum: { quantity: true },
  where: { organizationId, itemId, warehouseId }
})

// Materialized balance (Phase 1 enhancement)
const balance = await prisma.inventoryBalance.findUnique({
  where: {
    organizationId_itemId_warehouseId: {
      organizationId, itemId, warehouseId
    }
  }
})
```

**Why Materialized Balances?**
- Performance: O(1) lookup vs. O(n) aggregation
- Supports allocated/available qty tracking
- Enables lot/serial balances
- Critical for 100k+ transactions

**Update Trigger Logic:**
```typescript
async function createInventoryTransaction(txn: InventoryTransactionInput) {
  // 1. Create transaction (immutable)
  await prisma.inventoryTransaction.create({ data: txn })

  // 2. Update materialized balance
  await prisma.inventoryBalance.upsert({
    where: { organizationId_itemId_warehouseId: {...} },
    create: { onHandQty: txn.quantity, ... },
    update: {
      onHandQty: { increment: txn.quantity },
      availableQty: { increment: txn.quantity }
    }
  })

  // 3. Revalidate on-hand (if negative, throw error)
  const balance = await prisma.inventoryBalance.findUnique({...})
  if (balance.availableQty < 0) {
    throw new Error('Insufficient inventory')
  }
}
```

### 5.2 **Document Status Workflows**

**Transfer Order Status:**
```
DRAFT
  ↓ (User clicks "Release")
RELEASED
  ↓ (Shipment created, container ships)
SHIPPED
  ↓ (Warehouse receives goods)
RECEIVED
```

**Container Status:**
```
PLANNING
  ↓ (User adds lines, calculates load)
READY
  ↓ (Carrier picks up, user enters ship date)
IN_TRANSIT
  ↓ (Carrier updates: arrived at port)
AT_PORT
  ↓ (Warehouse receives, user confirms delivery)
DELIVERED
```

**Sales Order Status** (current + enhancements):
```
DRAFT
  ↓ (User clicks "Release")
RELEASED
  ↓ (User allocates inventory)
ALLOCATED (new status)
  ↓ (User ships partial qty)
PARTIALLY_FULFILLED
  ↓ (User ships remaining qty)
FULFILLED
  ↓ (Invoice created)
INVOICED
```

### 5.3 **Server Actions Pattern**

Follow existing conventions:

```typescript
// app/dashboard/transfer-orders/actions.ts
"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/lib/db"
import { DEMO_ORG_ID } from "@/lib/demo-org"

export type TransferOrderFormData = {
  fromWarehouseId: string
  toWarehouseId: string
  orderDate: Date
  requestedShipDate?: Date
  shippingMethod?: string
  notes?: string
  lines: {
    itemId: string
    orderedQty: number
    uom: string
  }[]
}

export async function createTransferOrder(data: TransferOrderFormData) {
  try {
    // Generate TO number
    const count = await prisma.transferOrder.count({
      where: { organizationId: DEMO_ORG_ID }
    })
    const transferOrderNumber = `TO-${String(count + 1).padStart(5, '0')}`

    // Create TO with lines
    const transferOrder = await prisma.transferOrder.create({
      data: {
        organizationId: DEMO_ORG_ID,
        transferOrderNumber,
        status: 'DRAFT',
        fromWarehouseId: data.fromWarehouseId,
        toWarehouseId: data.toWarehouseId,
        orderDate: data.orderDate,
        requestedShipDate: data.requestedShipDate,
        shippingMethod: data.shippingMethod,
        notes: data.notes,
        lines: {
          create: data.lines.map((line, index) => ({
            lineNumber: index + 1,
            itemId: line.itemId,
            orderedQty: line.orderedQty,
            shippedQty: 0,
            receivedQty: 0,
            uom: line.uom
          }))
        }
      }
    })

    revalidatePath('/dashboard/transfer-orders')
    return { success: true, data: transferOrder }

  } catch (error: any) {
    console.error('Error creating transfer order:', error)
    return { success: false, error: 'Failed to create transfer order' }
  }
}

export async function shipTransferOrder(id: string, shipmentData: {
  actualShipDate: Date
  shippingMethod: string
  carrier?: string
  trackingNumber?: string
  containerId?: string
}) {
  try {
    // 1. Update TO status
    const transferOrder = await prisma.transferOrder.update({
      where: { id },
      data: {
        status: 'SHIPPED',
        actualShipDate: shipmentData.actualShipDate,
        shippingMethod: shipmentData.shippingMethod,
        containerId: shipmentData.containerId
      },
      include: { lines: true }
    })

    // 2. Create inventory transactions (TRANSFER OUT from source warehouse)
    for (const line of transferOrder.lines) {
      await prisma.inventoryTransaction.create({
        data: {
          organizationId: DEMO_ORG_ID,
          txnType: 'TRANSFER',
          itemId: line.itemId,
          warehouseId: transferOrder.fromWarehouseId,
          quantity: -line.orderedQty, // Negative for OUT
          unitCost: line.unitCost,
          referenceType: 'TransferOrder',
          referenceId: transferOrder.id
        }
      })

      // Update materialized balance
      await updateInventoryBalance({
        organizationId: DEMO_ORG_ID,
        itemId: line.itemId,
        warehouseId: transferOrder.fromWarehouseId,
        qtyChange: -line.orderedQty,
        inTransitQtyChange: line.orderedQty
      })
    }

    // 3. Update TO lines (shippedQty = orderedQty)
    await prisma.transferOrderLine.updateMany({
      where: { transferOrderId: id },
      data: { shippedQty: { set: prisma.raw('ordered_qty') } }
    })

    revalidatePath('/dashboard/transfer-orders')
    revalidatePath('/dashboard/inventory')
    return { success: true }

  } catch (error: any) {
    console.error('Error shipping transfer order:', error)
    return { success: false, error: 'Failed to ship transfer order' }
  }
}

export async function receiveTransferOrder(id: string, receiptData: {
  actualReceiptDate: Date
  receivedLines: { lineId: string, receivedQty: number }[]
}) {
  try {
    const transferOrder = await prisma.transferOrder.findUnique({
      where: { id },
      include: { lines: true }
    })

    if (!transferOrder) {
      return { success: false, error: 'Transfer order not found' }
    }

    // 1. Create inventory transactions (TRANSFER IN to destination warehouse)
    for (const receivedLine of receiptData.receivedLines) {
      const line = transferOrder.lines.find(l => l.id === receivedLine.lineId)
      if (!line) continue

      await prisma.inventoryTransaction.create({
        data: {
          organizationId: DEMO_ORG_ID,
          txnType: 'TRANSFER',
          itemId: line.itemId,
          warehouseId: transferOrder.toWarehouseId,
          quantity: receivedLine.receivedQty, // Positive for IN
          unitCost: line.unitCost,
          referenceType: 'TransferOrder',
          referenceId: transferOrder.id
        }
      })

      // Update materialized balance (destination warehouse)
      await updateInventoryBalance({
        organizationId: DEMO_ORG_ID,
        itemId: line.itemId,
        warehouseId: transferOrder.toWarehouseId,
        qtyChange: receivedLine.receivedQty,
        inTransitQtyChange: 0
      })

      // Update materialized balance (source warehouse - reduce in-transit)
      await updateInventoryBalance({
        organizationId: DEMO_ORG_ID,
        itemId: line.itemId,
        warehouseId: transferOrder.fromWarehouseId,
        qtyChange: 0,
        inTransitQtyChange: -receivedLine.receivedQty
      })

      // Update line receivedQty
      await prisma.transferOrderLine.update({
        where: { id: receivedLine.lineId },
        data: { receivedQty: { increment: receivedLine.receivedQty } }
      })
    }

    // 2. Update TO status
    const allLinesReceived = transferOrder.lines.every(line => {
      const received = receiptData.receivedLines.find(r => r.lineId === line.id)
      return received && received.receivedQty === line.orderedQty
    })

    await prisma.transferOrder.update({
      where: { id },
      data: {
        status: allLinesReceived ? 'RECEIVED' : 'PARTIALLY_RECEIVED',
        actualReceiptDate: receiptData.actualReceiptDate
      }
    })

    revalidatePath('/dashboard/transfer-orders')
    revalidatePath('/dashboard/inventory')
    return { success: true }

  } catch (error: any) {
    console.error('Error receiving transfer order:', error)
    return { success: false, error: 'Failed to receive transfer order' }
  }
}

// Helper function to update materialized balance
async function updateInventoryBalance(params: {
  organizationId: string
  itemId: string
  warehouseId: string
  qtyChange: number
  inTransitQtyChange: number
}) {
  await prisma.inventoryBalance.upsert({
    where: {
      organizationId_itemId_warehouseId: {
        organizationId: params.organizationId,
        itemId: params.itemId,
        warehouseId: params.warehouseId
      }
    },
    create: {
      organizationId: params.organizationId,
      itemId: params.itemId,
      warehouseId: params.warehouseId,
      onHandQty: params.qtyChange,
      allocatedQty: 0,
      availableQty: params.qtyChange,
      inTransitQty: params.inTransitQtyChange
    },
    update: {
      onHandQty: { increment: params.qtyChange },
      availableQty: { increment: params.qtyChange },
      inTransitQty: { increment: params.inTransitQtyChange }
    }
  })
}
```

### 5.4 **UI Component Pattern**

```typescript
// app/dashboard/transfer-orders/transfer-order-dialog.tsx
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createTransferOrder, updateTransferOrder } from "./actions"
import { toast } from "sonner"

const transferOrderSchema = z.object({
  fromWarehouseId: z.string().min(1, "From warehouse required"),
  toWarehouseId: z.string().min(1, "To warehouse required"),
  orderDate: z.date(),
  requestedShipDate: z.date().optional(),
  shippingMethod: z.enum(['OCEAN_CONTAINER_FCL', 'OCEAN_CONTAINER_LCL', 'AIR_FREIGHT_DHL']).optional(),
  notes: z.string().optional(),
  lines: z.array(z.object({
    itemId: z.string(),
    orderedQty: z.number().positive(),
    uom: z.string()
  }))
})

type TransferOrderFormValues = z.infer<typeof transferOrderSchema>

export function TransferOrderDialog({
  open,
  onOpenChange,
  transferOrder,
  warehouses,
  items
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  transferOrder?: any
  warehouses: any[]
  items: any[]
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<TransferOrderFormValues>({
    resolver: zodResolver(transferOrderSchema),
    defaultValues: transferOrder || {
      orderDate: new Date(),
      lines: [{ itemId: "", orderedQty: 1, uom: "EA" }]
    }
  })

  const onSubmit = async (values: TransferOrderFormValues) => {
    setIsSubmitting(true)

    const result = transferOrder
      ? await updateTransferOrder(transferOrder.id, values)
      : await createTransferOrder(values)

    if (result.success) {
      toast.success(transferOrder ? "Transfer order updated" : "Transfer order created")
      onOpenChange(false)
      form.reset()
    } else {
      toast.error(result.error || "Failed to save transfer order")
    }

    setIsSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {transferOrder ? "Edit Transfer Order" : "New Transfer Order"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fromWarehouseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From Warehouse</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select warehouse" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {warehouses.map((wh) => (
                          <SelectItem key={wh.id} value={wh.id}>
                            {wh.name} ({wh.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="toWarehouseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To Warehouse</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select warehouse" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {warehouses.map((wh) => (
                          <SelectItem key={wh.id} value={wh.id}>
                            {wh.name} ({wh.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Lines section - add/remove lines, select items, enter qty */}

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Transfer Order"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
```

---

## Part 6: Success Metrics

**How we'll measure success:**

1. **Process Efficiency:**
   - ✅ Eliminate manual SQL query for container tracking
   - ✅ Reduce time to build container from 2 hours → 30 minutes
   - ✅ Reduce time to locate in-transit inventory from 15 min → 10 seconds

2. **Visibility:**
   - ✅ Real-time view of inventory across all 4 locations (ATL, STT, STX, STJ)
   - ✅ Real-time view of in-transit inventory (containers on water)
   - ✅ Corporate card PO tracking (no more manual spreadsheets)

3. **Accuracy:**
   - ✅ 100% of inventory movements have audit trail (InventoryTransaction)
   - ✅ Zero negative inventory (enforced by system)
   - ✅ Accurate freight cost allocation (landed cost)

4. **User Adoption:**
   - ✅ Reorder clerks can build containers without IT support
   - ✅ Sales reps can see fulfillment status in real-time
   - ✅ Finance can reconcile corporate card POs in 1 click

---

## Part 7: Key Design Decisions

### 7.1 **Why Materialized `InventoryBalance` Table?**

**Problem:** Calculating on-hand inventory from transactions requires a `SUM(quantity) GROUP BY itemId, warehouseId` query. For 100k+ transactions, this is slow.

**Solution:** Maintain a materialized balance table that updates whenever a transaction is created.

**Trade-offs:**
- ✅ Pro: O(1) lookup performance
- ✅ Pro: Supports allocated/available qty (can't calculate from transactions)
- ✅ Pro: Supports lot/serial balances
- ❌ Con: More complex write logic (must update both tables)
- ❌ Con: Potential for drift (mitigated by transaction immutability)

**Decision:** Implement materialized balances in Phase 1. Add scheduled reconciliation job (nightly) to verify balances match transaction history.

---

### 7.2 **Why Separate `Container` and `Shipment` Models?**

**Problem:** A container can have multiple shipments (if consolidated), and a shipment can be part of a container or standalone.

**Solution:**
- `Container` = Physical container (ocean freight)
- `Shipment` = Logical grouping of items being shipped (can be in container, or standalone for air freight)

**Example:**
- Container CONT-001 (Atlanta → St Thomas)
  - Contains: Transfer Order TO-1001 (100 lines)
  - Also contains: Transfer Order TO-1002 (50 lines)
  - Creates 2 Shipments (one per TO)

- Shipment SHIP-501 (DHL air freight)
  - No container
  - Transfer Order TO-1003 (urgent car part)

**Decision:** Implement both models. Container is optional on Shipment.

---

### 7.3 **How to Handle St Thomas → St John Transfers?**

**Option 1:** Create Transfer Order (ST THOMAS → ST JOHN)
- ✅ Pro: Full audit trail
- ❌ Con: Overkill for local delivery (adds complexity)

**Option 2:** Create Shipment directly from Sales Order (no TO)
- ✅ Pro: Simpler workflow (one less document)
- ❌ Con: No separate "transfer" tracking

**Decision:** Use **Option 2** for local deliveries. Sales Order allocation happens at ST THOMAS warehouse, then shipment is created directly to customer in St John. This matches the real-world process (no warehouse in St John, just customer deliveries).

---

### 7.4 **Corporate Card PO Tracking: Reimbursement Flow?**

**Scenario:** Sales rep purchases on personal credit card, submits expense report for reimbursement.

**Requirements:**
1. Track which POs were purchased on corporate cards
2. Link PO to sales rep
3. Track reimbursement status

**Solution:** Add fields to `PurchaseOrder`:
- `purchaseType: CORPORATE_CARD`
- `purchasedById: User.id`
- `cardLast4: string`
- `reimbursed: boolean` (future enhancement)
- `reimbursementDate: DateTime` (future enhancement)

**Report:** "Corporate Card Reconciliation"
- Shows all `CORPORATE_CARD` POs
- Grouped by sales rep
- Shows total amount awaiting reimbursement

**Decision:** Implement in Phase 3. Reimbursement workflow (AP bill creation) is a Phase 4+ enhancement.

---

### 7.5 **Freight Cost Allocation: How to Split Across Items?**

**Scenario:** Container costs $5,000 to ship. Contains 100 items. How to allocate $5,000 across items?

**Options:**
1. By quantity (100 items → $50 per item)
2. By weight (10,000 lbs total → $0.50 per lb)
3. By value (10% of item value)

**Decision:** Support multiple allocation methods (user-configurable):
- Default: By weight
- Alternative: By value
- Alternative: By quantity

**Implementation:**
- Add `freightAllocationMethod` field to Container
- On receipt, calculate allocated freight per line
- Update `unitCost` in InventoryBalance to include landed cost
- Post freight variance to GL (if any)

**Phase:** Implement in Phase 6 (landed cost allocation).

---

## Part 8: Data Migration from Acumatica

**Challenge:** Customer is using Acumatica's PO → Transfer Order flow with a "nasty massive SQL query" to join data.

**Migration Strategy:**

1. **Extract Open Documents:**
   - Export open POs (not fully received)
   - Export open Transfer Orders (not fully received)
   - Export current on-hand inventory by warehouse

2. **Import into Atlas:**
   - Create Warehouses (ATL, STT, STX, STJ)
   - Create Items (from Acumatica item master)
   - Create Customers & Vendors
   - Import on-hand inventory (as opening balance `ADJUSTMENT` transactions)
   - Import open POs (status: `PARTIALLY_FULFILLED` if partially received)
   - Import open Transfer Orders (map to Atlas TO model)

3. **Cutover:**
   - Run both systems in parallel for 1 week (receive POs in both)
   - Reconcile inventory balances
   - Switch to Atlas for all new transactions
   - Archive Acumatica data (read-only)

**Tools:**
- CSV import for Items, Customers, Vendors, Inventory Balances
- Manual data entry for open POs/TOs (low volume during cutover week)

---

## Part 9: Next Steps

### Immediate Actions (This Week):

1. **Review & Approve Plan** ✅
   - Stakeholder review of business process flows
   - Confirm warehouse structure (4 locations correct?)
   - Confirm shipping methods (Ocean FCL/LCL, DHL, local courier)

2. **Prepare Development Environment:**
   - Create feature branch: `feature/distribution-module`
   - Update `schema.prisma` with Phase 1 models
   - Create migration

3. **Kickoff Phase 1:**
   - Build Transfer Order UI
   - Build "Items to Transfer" report
   - Seed demo data (4 warehouses, transfer orders)

### Weekly Milestones:

- **Week 1-2:** Phase 1 (Transfer Orders)
- **Week 3-4:** Phase 2 (Containers)
- **Week 5-6:** Phase 3 (SO Fulfillment)
- **Week 7-8:** Phase 4 (Reorder Automation)
- **Week 9-10:** Phase 5 (Reporting)
- **Week 11-12:** Phase 6 (Advanced Features)

---

## Part 10: Stakeholder Requirements (CONFIRMED)

### ✅ Answers Received:

1. **Warehouse Count:** 3 warehouse locations (ATL, STT, STX)
   - ✅ **St John**: Customer deliveries only (no warehouse)
   - **Impact**: Simplifies warehouse setup, St John orders ship from ST THOMAS

2. **Container Sizes:** 40ft containers (standard)
   - ✅ **FCL only** (Full Container Load)
   - **Impact**: Simplifies container model (no LCL consolidation logic needed)

3. **Shipping Frequencies:**
   - ✅ **Weekly** container shipments
   - ✅ **14 days** transit time Atlanta → St Thomas
   - **Impact**: Plan for ~4 containers in-transit at any given time

4. **Reorder Points:**
   - ✅ **Managed by reorder clerks**
   - ✅ **Stocked items only** (not all items)
   - **Impact**: Add `isStocked` flag to Item model, reorder points optional

5. **Corporate Card Tracking:** ⚠️ **CRITICAL REQUIREMENT**
   - ❌ **Not reimbursement** - Corporate cards (not personal)
   - ❌ **Current process broken**: Sales people do "receipt of invoice" even without actual invoice → purchases clearing account is a mess
   - ✅ **Need**: Proper workflow for corporate card purchases → receipt → clearing
   - **Impact**: Build corporate card clearing workflow in Phase 3 (see below)

6. **Hotel/Resort Customers:**
   - ✅ **Standing orders**: Some customers have recurring orders (weekly/monthly)
   - ✅ **Contract pricing**: Different prices per customer
   - **Impact**: Add Customer Price Lists (Phase 4+), Standing Orders (Phase 5+)

7. **Freight Cost Allocation:**
   - ⚠️ **Current process**: Build expected freight into item cost (not clean)
   - ✅ **Need**: Track freight cost separately from item cost
   - **Impact**: Critical requirement for Phase 6 (landed cost allocation)

8. **Lot/Serial Tracking:**
   - ✅ **Some items serialized** (car parts with VINs)
   - ✅ **Some items lot-controlled** (expiry dates for paper goods)
   - **Impact**: Implement in Phase 6 (advanced features)

9. **Multi-Currency:**
   - ✅ **USD only** (not needed at this time)
   - **Impact**: Defer multi-currency support to future phase

10. **Data Migration:**
    - ✅ **Timeline**: ~1 year out (not immediate concern)
    - **Impact**: Build for greenfield implementation, migration tools later

---

## Part 11: Corporate Card Clearing Workflow (NEW REQUIREMENT)

### Current Broken Process (Acumatica):

```
1. Sales rep purchases car part on corporate card ($500)
   → No PO created in advance (ad-hoc purchase)

2. Item ships to Atlanta

3. Sales rep creates "receipt of invoice" in system
   → Problem: Often no actual invoice from vendor
   → Creates AP Bill anyway (to clear the purchase)
   → Dr. Inventory / Cr. Purchases Clearing

4. Credit card statement arrives
   → Manually match CC charges to AP Bills
   → Purchases Clearing account is a mess (orphaned entries)
```

**Pain Points:**
- ❌ Purchases Clearing account balance doesn't reconcile
- ❌ Manual matching of CC charges to receipts
- ❌ No way to track which POs are "paid via corporate card" vs. "pay vendor later"
- ❌ Missing invoices create AP Bill records that don't match reality

### Atlas Solution: Corporate Card Workflow

**Workflow Option A: PO-First (Recommended)**

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: SALES REP CREATES PO (Before or After Purchase)         │
└─────────────────────────────────────────────────────────────────┘

Sales rep creates PO in Atlas:
  - Vendor: Amazon / AutoZone / O'Reilly Auto Parts
  - Purchase Type: CORPORATE_CARD
  - Payment Method: CORPORATE_CARD_1234 (last 4 digits)
  - Card Holder: John Smith (sales rep)
  - Lines: Item, Qty, Unit Cost (estimated if before purchase)
  - Receipt Warehouse: ATLANTA
  - Final Destination: ST THOMAS
  - Status: RELEASED

┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: ITEM SHIPS TO ATLANTA                                    │
└─────────────────────────────────────────────────────────────────┘

(Same as regular PO receipt - no change)

┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: RECEIVE PO AT ATLANTA                                    │
└─────────────────────────────────────────────────────────────────┘

Warehouse receives item:
  - Create Inventory Transaction (RECEIPT)
  - Update PO status: FULFILLED
  - GL Impact (if auto-posting enabled):
     Dr. Inventory (Asset) $500
     Cr. Corporate Card Clearing (Liability) $500

Note: No AP Bill created (because it's already "paid" via CC)

┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: CREDIT CARD STATEMENT ARRIVES (Month-End)                │
└─────────────────────────────────────────────────────────────────┘

Accountant imports CC statement (CSV):
  - Date, Merchant, Amount, Card Last 4

Match CC charges to POs:
  - Auto-match by: Date range (+/- 3 days), Amount, Card Last 4, Merchant name
  - Manual match for exceptions

Create single "Credit Card Payment" journal entry:
  Dr. Corporate Card Clearing (Liability) $10,000 (sum of all charges)
  Cr. Cash (Bank Account) $10,000

Mark matched POs as "reconciled"

┌─────────────────────────────────────────────────────────────────┐
│ RESULT: CLEAN RECONCILIATION                                     │
└─────────────────────────────────────────────────────────────────┘

Benefits:
  ✅ Purchases Clearing account balances (clears when CC statement paid)
  ✅ No fake AP Bills
  ✅ Easy to see which POs are unreconciled (not yet matched to CC statement)
  ✅ Audit trail: PO → Receipt → CC Charge → Payment
```

**Workflow Option B: PO After Receipt (If Sales Rep Forgets)**

```
1. Sales rep purchases item but forgets to create PO
2. Item arrives at Atlanta (no PO to receive against)
3. Warehouse creates "Receipt Without PO":
   - Item, Qty, Unit Cost
   - Auto-creates PO (Purchase Type: CORPORATE_CARD)
   - Auto-receives PO (status: FULFILLED)
4. Continue with Step 4 above (CC statement matching)
```

### Database Schema Additions for Corporate Card Workflow

```prisma
// Add to PurchaseOrder model
model PurchaseOrder {
  // ... existing fields ...

  purchaseType    PurchaseType @default(STANDARD)
  paymentMethod   String?       // "CORPORATE_CARD_1234", "NET_30", "PREPAID"
  cardLast4       String?       // Last 4 digits of card
  cardHolderId    String?       // User who made purchase
  cardHolder      User? @relation(fields: [cardHolderId], references: [id])

  // Reconciliation tracking
  ccChargeDate    DateTime?     // Date charge appeared on CC statement
  ccChargeAmount  Decimal?      // Actual CC charge (may differ from PO total)
  ccStatementId   String?       // Link to CC statement import
  ccReconciled    Boolean @default(false)
  ccReconciledAt  DateTime?
  ccReconciledBy  String?       // User who reconciled
}

// New model for CC statement imports
model CreditCardStatement {
  id              String   @id @default(cuid())
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id])

  statementDate   DateTime  // Statement closing date
  cardLast4       String
  bankAccountId   String?   // Bank account for payment
  bankAccount     Account? @relation(fields: [bankAccountId], references: [id])

  totalCharges    Decimal
  totalPayment    Decimal   @default(0)

  importedAt      DateTime @default(now())
  importedBy      String

  status          String    @default("DRAFT") // DRAFT, MATCHED, PAID

  lines           CreditCardCharge[]

  @@index([organizationId])
  @@map("credit_card_statements")
}

model CreditCardCharge {
  id              String   @id @default(cuid())

  statementId     String
  statement       CreditCardStatement @relation(fields: [statementId], references: [id], onDelete: Cascade)

  chargeDate      DateTime
  merchant        String
  amount          Decimal
  cardLast4       String

  // Matching
  matchedPOId     String?
  matchedPO       PurchaseOrder? @relation(fields: [matchedPOId], references: [id])
  matchStatus     String @default("UNMATCHED") // UNMATCHED, AUTO_MATCHED, MANUAL_MATCHED

  notes           String?

  @@index([statementId])
  @@map("credit_card_charges")
}

// Add GL Account for Corporate Card Clearing
// In seed data or COA setup:
// Account: "2100 - Corporate Card Clearing"
// Type: LIABILITY
// Normal Balance: CREDIT
```

### UI Components for Corporate Card Workflow

**1. PO Form Enhancement:**
- Add "Purchase Type" dropdown (STANDARD, CORPORATE_CARD, CONSIGNMENT, DROP_SHIP)
- If CORPORATE_CARD selected:
  - Show "Payment Method" dropdown (list of corporate cards)
  - Show "Card Holder" dropdown (list of users/sales reps)
  - Auto-populate card last 4 from payment method

**2. New Page: Credit Card Reconciliation**
- Path: `/dashboard/credit-cards/reconciliation`
- Import CC statement (CSV upload)
- Auto-match charges to POs
- Manual match interface (drag-and-drop or click-to-match)
- "Create Payment" button (generates GL journal entry)

**3. Report: Unreconciled Corporate Card POs**
- Shows all POs with `purchaseType = CORPORATE_CARD` and `ccReconciled = false`
- Grouped by card holder
- Shows: PO #, Date, Vendor, Amount, Days Outstanding
- Export to CSV for review

**4. Dashboard Widget: Corporate Card Summary**
- Total unreconciled charges (by card)
- Oldest unreconciled PO (alerts if > 30 days)
- This month's CC purchases (running total)

### GL Posting Rules for Corporate Card POs

**On PO Receipt (Purchase Type = CORPORATE_CARD):**

```typescript
// Automatic posting on receipt
Dr. Inventory (or Expense, depending on item type)  $500
Cr. Corporate Card Clearing (Liability 2100)        $500

// Note: No AP Bill created
```

**On CC Statement Payment:**

```typescript
// Manual journal entry (or automated from CC reconciliation page)
Dr. Corporate Card Clearing (Liability 2100)  $10,000
Cr. Cash - Checking (Asset 1010)              $10,000

// This clears the liability when the bank pays the CC bill
```

**Variance Handling (if CC charge ≠ PO amount):**

```typescript
// Example: PO was $500, CC charge is $515 (shipping added)
Dr. Freight In (Expense 5200)                  $15
Cr. Corporate Card Clearing (Liability 2100)   $15

// Or allocate to landed cost if freight should go to inventory
```

### Phase 3 Implementation Tasks (Corporate Card Workflow)

**Week 5:**
1. Add schema changes:
   - `purchaseType`, `paymentMethod`, `cardLast4`, `cardHolderId` to PurchaseOrder
   - `CreditCardStatement` + `CreditCardCharge` models
   - Migration

2. Update PO form:
   - Add "Purchase Type" field
   - Conditional fields for CORPORATE_CARD type
   - Validation (card holder required if CORPORATE_CARD)

3. Update PO receipt logic:
   - Check `purchaseType`
   - If CORPORATE_CARD: Post to "Corporate Card Clearing" instead of "Accounts Payable"
   - Skip AP Bill creation

**Week 6:**
4. Build CC Reconciliation page:
   - CSV import for CC statements
   - Auto-match algorithm (date +/- 3 days, amount within $5, card last 4, merchant fuzzy match)
   - Manual match UI (drag-and-drop or click-to-link)
   - Bulk actions: "Match Selected", "Create Variance Entry"

5. Build "Create Payment" action:
   - Generates GL journal entry (Dr. CC Clearing / Cr. Cash)
   - Marks all matched charges as reconciled
   - Updates POs: `ccReconciled = true`

6. Build reports:
   - Unreconciled Corporate Card POs
   - CC Reconciliation Status (by statement)
   - CC Purchases by Card Holder (for budget tracking)

### Testing Scenarios

**Scenario 1: Happy Path**
1. Sales rep creates PO (CORPORATE_CARD, $500, Card 1234, John Smith)
2. Item received at Atlanta (auto-posts: Dr. Inventory / Cr. CC Clearing)
3. CC statement imported ($500 charge on 2024-01-15, Card 1234, Merchant "Amazon")
4. Auto-match successful (PO linked to charge)
5. Accountant clicks "Create Payment" (Dr. CC Clearing / Cr. Cash)
6. PO marked as reconciled ✅

**Scenario 2: Amount Variance**
1. PO for $500, CC charge for $515 (unexpected shipping)
2. Auto-match finds PO but flags variance
3. Accountant reviews, creates adjustment entry (Dr. Freight In $15 / Cr. CC Clearing $15)
4. Mark as reconciled ✅

**Scenario 3: Forgotten PO**
1. Sales rep purchases item but forgets to create PO
2. Item arrives at warehouse (no PO to receive against)
3. Warehouse creates "Receipt Without PO" (prompts to create PO)
4. System auto-creates PO (CORPORATE_CARD, status: FULFILLED)
5. Continue with CC reconciliation as normal ✅

**Scenario 4: Personal Purchase on Corporate Card (Error)**
1. CC statement has charge for "Starbucks $8.50" (not business)
2. No matching PO found
3. Accountant creates manual journal entry (Dr. Employee Advance / Cr. CC Clearing)
4. Deduct from employee paycheck (outside ERP) ✅

---

This plan provides a comprehensive roadmap for building a robust distribution module for Atlas ERP that **far exceeds Acumatica's capabilities** for multi-location, multi-leg distribution scenarios.

**Key Differentiators:**
1. ✅ **Container tracking as first-class objects** (not a SQL hack)
2. ✅ **Real-time in-transit inventory visibility**
3. ✅ **Multi-leg transfer support** (ATL → STT → STJ)
4. ✅ **Corporate card PO tracking** (built-in expense reconciliation)
5. ✅ **Materialized inventory balances** (allocated/available/in-transit)
6. ✅ **Audit trail for every inventory movement** (immutable transactions)
7. ✅ **Landed cost allocation** (freight cost → inventory cost)
8. ✅ **Reorder point automation** (no more spreadsheets)

The implementation follows Atlas ERP's core principles:
- 📄 **Document-first UX** (TO, Container, Shipment as distinct documents)
- 🔒 **Accounting truth as the spine** (all movements post to GL)
- 🧩 **Composable architecture** (inventory, orders, shipping as separate services)
- 🚀 **API-first** (events for ShipmentCreated, ContainerDelivered, etc.)

Ready to proceed with Phase 1!
