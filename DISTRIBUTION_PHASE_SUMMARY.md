# Distribution Module: Implementation Phases

## Overview
**Timeline**: 12 weeks (6 phases)
**Warehouses**: 3 locations (Atlanta, St Thomas, St Croix)
**Container Frequency**: Weekly (40ft FCL only)
**Transit Time**: 14 days ATL → STT

---

## Phase 1: Foundation (Weeks 1-2)

### Goal
Set up multi-warehouse inventory tracking and transfer orders

### Database Changes
```prisma
✅ Warehouse enhancements (address, island code, warehouse type)
✅ InventoryBalance (materialized balances: on-hand, allocated, available, in-transit)
✅ TransferOrder + TransferOrderLine
✅ ReorderPoint
✅ Add isStocked flag to Item model
```

### UI Components
```
✅ /dashboard/transfer-orders/page.tsx (list view)
✅ /dashboard/transfer-orders/transfer-order-dialog.tsx (create/edit)
✅ /dashboard/transfer-orders/actions.ts (CRUD + ship/receive workflows)
✅ /dashboard/reports/items-to-transfer (shows SO lines awaiting fulfillment)
```

### Features Delivered
- Create transfer orders (ATL → STT or STX)
- Transfer order status workflow: DRAFT → RELEASED → SHIPPED → RECEIVED
- Automatic inventory transactions on ship/receive
- Materialized inventory balances (performance optimization)
- "Items to Transfer" report (groups by destination warehouse)

### Seed Data Updates
- Add 3 warehouses (ATL, STT, STX) with island codes
- Add reorder points for demo items
- Add sample transfer orders

---

## Phase 2: Container Management (Weeks 3-4)

### Goal
Build and track ocean freight containers

### Database Changes
```prisma
✅ Container + ContainerLine
✅ Shipment + ShipmentLine
✅ ShippingMethod enum (OCEAN_CONTAINER_FCL, AIR_FREIGHT_DHL, COURIER_LOCAL)
✅ ContainerStatus enum (PLANNING → READY → IN_TRANSIT → AT_PORT → DELIVERED)
```

### UI Components
```
✅ /dashboard/containers/page.tsx (list with status filters)
✅ /dashboard/containers/container-dialog.tsx (create/edit)
✅ /dashboard/containers/[id]/builder (container load planning UI)
✅ /dashboard/reports/inventory-in-transit (dashboard view)
```

### Features Delivered
- Build containers (40ft FCL)
- Container load planning:
  - Drag-and-drop transfer order lines into container
  - Weight/volume utilization tracking
  - Validate capacity limits
- Link multiple transfer orders to single container
- Container status tracking (with vessel info, BOL, ETA)
- "Inventory in Transit" dashboard:
  - Shows all containers on water
  - ETA countdown
  - Drill-down to container lines
- Automatic inventory updates when container ships (in-transit qty)

### Workflow
```
1. Create Transfer Order (ATL → STT, status: DRAFT)
2. Create Container (40ft, status: PLANNING)
3. Add TO lines to container (load planning)
4. Mark container READY
5. Ship container → status: IN_TRANSIT
   - Creates Shipment document
   - Updates TO status: SHIPPED
   - Creates inventory txns (TRANSFER OUT from ATL)
   - Updates inventory balance (in-transit qty)
6. Container arrives → status: AT_PORT
7. Receive at STT → status: DELIVERED
   - Updates TO status: RECEIVED
   - Creates inventory txns (TRANSFER IN to STT)
   - Clears in-transit qty
```

---

## Phase 3: SO/PO Fulfillment + Corporate Card Workflow (Weeks 5-6)

### Goal
Complete SO → PO → Transfer → Fulfillment flow + solve corporate card clearing nightmare

### Database Changes
```prisma
✅ Add to PurchaseOrder:
   - purchaseType (STANDARD, CORPORATE_CARD, CONSIGNMENT, DROP_SHIP)
   - paymentMethod, cardLast4, cardHolderId
   - ccChargeDate, ccChargeAmount, ccStatementId
   - ccReconciled, ccReconciledAt, ccReconciledBy

✅ Add to SalesOrderLine:
   - allocatedWarehouseId, allocatedQty, shippedQty, backorderQty

✅ Add to PurchaseOrder:
   - receiptWarehouseId (ATL), finalDestinationWarehouseId (STT/STX)

✅ CreditCardStatement model
✅ CreditCardCharge model (links to PO)
```

### UI Components
```
✅ Enhanced PO form:
   - Purchase Type dropdown
   - Conditional fields for CORPORATE_CARD type
   - Card holder selection

✅ SO allocation workflow:
   - "Allocate" button on SO page
   - Shows available inventory by warehouse
   - Updates allocatedQty on SO line & inventory balance

✅ SO shipment workflow:
   - "Ship" button on SO page
   - Creates Shipment document
   - Creates inventory transaction (ISSUE)
   - Updates SO status: FULFILLED

✅ PO receipt workflow:
   - "Receive" button on PO page
   - Creates inventory transaction (RECEIPT)
   - GL posting based on purchaseType:
      - STANDARD: Dr. Inventory / Cr. Accounts Payable
      - CORPORATE_CARD: Dr. Inventory / Cr. Corporate Card Clearing

✅ /dashboard/credit-cards/reconciliation:
   - CSV import for CC statements
   - Auto-match algorithm (date ±3 days, amount, card, merchant)
   - Manual match UI (drag-to-match)
   - "Create Payment" button (generates GL entry)

✅ Reports:
   - Unreconciled Corporate Card POs
   - CC Reconciliation Status
   - CC Purchases by Card Holder
```

### Features Delivered
- **Sales Order Allocation**: Reserve inventory at specific warehouse
- **Sales Order Shipment**: Create shipment, issue inventory, update SO status
- **Purchase Order Receipt**: Receive at Atlanta, update inventory
- **SO → PO Linking**: Track custom orders end-to-end
- **Corporate Card Workflow**: 🚨 **CRITICAL FEATURE**
  - Sales rep creates PO (type: CORPORATE_CARD)
  - Receive at Atlanta (posts to CC Clearing, not AP)
  - Import CC statement (CSV)
  - Auto-match charges to POs (90%+ match rate)
  - Create payment (Dr. CC Clearing / Cr. Cash)
  - Clean reconciliation (no more fake AP Bills!)

### Corporate Card Workflow Benefits
- ✅ **No fake AP Bills** (current Acumatica problem solved)
- ✅ **Clean Purchases Clearing account** (balances properly)
- ✅ **Auto-matching** (saves hours of manual work)
- ✅ **Audit trail**: PO → Receipt → CC Charge → Payment
- ✅ **Visibility**: See unreconciled POs at a glance

---

## Phase 4: Reorder Automation (Weeks 7-8)

### Goal
Automate reorder point monitoring and PO generation

### Database Changes
```
✅ ReorderPoint model (already in Phase 1)
✅ Add preferredVendorId to ReorderPoint
```

### UI Components
```
✅ /dashboard/reorder-points/page.tsx (CRUD)
✅ /dashboard/reports/items-below-reorder-point
✅ "Create PO from Reorder Point" action
✅ Bulk import reorder points (CSV)
✅ "Copy from Warehouse" action (STT → STX)
```

### Features Delivered
- **Reorder Point Management**: Set min/max levels per item/warehouse
- **Daily Monitoring**: Scheduled job checks inventory levels
  - Compare (on-hand + in-transit) vs. min qty
  - Flag items below reorder point
- **Auto PO Creation**: One-click PO generation from reorder point
  - Pre-fills: preferred vendor, reorder qty, receipt warehouse (ATL), final destination
- **Reports**:
  - Items Below Reorder Point (sorted by urgency)
  - Reorder Point Summary (by warehouse)
- **Bulk Actions**: Import/export reorder points, copy between warehouses

### Workflow
```
1. Reorder clerk sets reorder points:
   - Item: Toilet Paper (Bulk)
   - Warehouse: ST THOMAS
   - Min Qty: 500 cases
   - Max Qty: 2000 cases
   - Reorder Qty: 1000 cases
   - Preferred Vendor: Paper Goods Distributor

2. Daily job runs:
   - Current stock: 450 cases (on-hand: 400, in-transit: 50)
   - Below min (500) → Flag for reorder

3. Clerk reviews "Items Below Reorder Point" report
   - Click "Create PO" → Pre-filled PO dialog opens
   - Review & submit

4. PO flows through normal process (Phase 3)
```

---

## Phase 5: Reporting & Analytics (Weeks 9-10)

### Goal
Build critical reports for operations & finance

### Reports Delivered

#### Operational Reports
```
✅ On-Hand by Location (all warehouses + in-transit)
   - Columns: Item, ATL, STT, STX, In-Transit, Total

✅ Sales Order Fulfillment Status
   - Columns: SO #, Customer, Item, Ordered, Allocated, Shipped, Backorder, Status

✅ Transfer Order Status
   - Columns: TO #, From, To, Items, Ordered, Shipped, Received, Status, Ship Date, ETA

✅ Container Load Planning
   - Columns: Container #, Capacity Used (%), Items, Weight, Volume, Status

✅ Freight Cost Analysis
   - Columns: Route, Container Count, Total Freight, Cost/LB, Cost/Item

✅ Slow-Moving Inventory
   - Columns: Item, Warehouse, On-Hand, Last Sale Date, Days Since Movement
```

#### Financial Reports
```
✅ Inventory Valuation (by warehouse, by item)
   - Columns: Warehouse, Item Count, Total Units, Total Value

✅ Corporate Card Reconciliation
   - Columns: PO #, Card Holder, Vendor, Amount, Card Last 4, Receipt Date, Reconciled?

✅ Purchase Price Variance
   - Columns: Item, Standard Cost, Actual Cost, Variance $, Variance %
```

### Dashboards

**Operations Dashboard** (for warehouse managers):
- Widgets:
  - Containers in transit (count + ETA)
  - Items below reorder point (count + value)
  - Open sales orders (count + value)
  - Open transfer orders (count)
  - Inventory value by warehouse (pie chart)

**Reorder Clerk Dashboard**:
- Widgets:
  - Items to reorder (sorted by urgency, limit 10)
  - Items awaiting transfer (grouped by destination)
  - Containers in planning status (needs action)
  - Transfer orders awaiting shipment (ready to ship)

**Sales Dashboard**:
- Widgets:
  - Open sales orders by location
  - Backorder queue (top 10)
  - Average fulfillment time (by warehouse, last 30 days)
  - Top customers (by volume, current month)

### Export Functionality
- CSV export (all reports)
- Excel export with formatting (financial reports)
- PDF export (container packing lists, shipping labels)

---

## Phase 6: Advanced Features (Weeks 11-12)

### Goal
Lot/serial tracking, landed cost, multi-leg transfers, carrier integrations

### Database Changes
```prisma
✅ Add to Item:
   - trackingType (NONE, LOT, SERIAL, LOT_AND_SERIAL)

✅ Add to InventoryBalance:
   - lotNumber, serialNumber, expiryDate

✅ Add to all inventory transaction sources (PO line, SO line, TO line):
   - lotNumber, serialNumber
```

### Features Delivered

#### 1. Lot/Serial Tracking
- Enforce lot/serial entry on PO receipt (if item requires it)
- Show lot/serial selection on SO allocation (FIFO by default)
- Lot/serial detail on all inventory transactions
- Reports:
  - On-Hand by Lot (expiry dates visible)
  - Serial Number Trace (where is serial XYZ?)

#### 2. Landed Cost Allocation
- Add freight cost to Container
- Allocation methods (user-configurable):
  - By weight (default)
  - By value
  - By quantity
- On container receipt:
  - Calculate allocated freight per line
  - Update inventory unit cost (item cost + allocated freight)
  - Post freight variance to GL (if any)
- Reports:
  - Landed Cost Analysis (item cost vs. total cost)
  - Freight Allocation Summary (by container)

#### 3. Multi-Leg Transfers
- Support St Thomas → St John local delivery:
  - Allocate inventory at ST THOMAS
  - Create Shipment (shipping method: COURIER_LOCAL)
  - Ship directly to customer in St John
  - No Transfer Order needed (simpler workflow)

#### 4. Carrier Integrations (Read-Only)
- DHL API integration:
  - Auto-fetch tracking updates
  - Update shipment status based on carrier data
  - Display tracking events on Shipment detail page
- Matson API integration (ocean freight):
  - Fetch vessel arrival times
  - Update container status (IN_TRANSIT → AT_PORT)
  - Display estimated delivery dates

---

## Phase Completion Summary

| Phase | Weeks | Core Deliverable | Status |
|-------|-------|------------------|--------|
| 1 | 1-2 | Transfer Orders + Multi-Warehouse Inventory | ⏳ Ready to start |
| 2 | 3-4 | Container Management + In-Transit Tracking | ⏳ Pending |
| 3 | 5-6 | SO/PO Fulfillment + **Corporate Card Workflow** | ⏳ Pending |
| 4 | 7-8 | Reorder Automation | ⏳ Pending |
| 5 | 9-10 | Reporting & Analytics (12+ reports) | ⏳ Pending |
| 6 | 11-12 | Lot/Serial + Landed Cost + Carrier Integrations | ⏳ Pending |

---

## Critical Path Dependencies

```
Phase 1 (Transfer Orders + Inventory)
  ↓
Phase 2 (Containers) ← depends on Transfer Orders
  ↓
Phase 3 (SO/PO Fulfillment + Corporate Cards) ← depends on Inventory
  ↓
Phase 4 (Reorder Automation) ← depends on PO workflow
  ↓
Phase 5 (Reporting) ← depends on all data models
  ↓
Phase 6 (Advanced Features) ← enhances existing workflows
```

**MVP Milestone** (End of Phase 3, Week 6):
- ✅ Multi-warehouse inventory tracking
- ✅ Container building & tracking
- ✅ Full SO → PO → Transfer → Container → Receipt → Fulfillment flow
- ✅ Corporate card clearing workflow (major pain point solved!)

**Production-Ready Milestone** (End of Phase 5, Week 10):
- ✅ All MVP features
- ✅ Reorder automation
- ✅ Complete reporting suite
- ✅ Role-based dashboards

**Full-Featured Release** (End of Phase 6, Week 12):
- ✅ All production features
- ✅ Lot/serial tracking
- ✅ Landed cost allocation
- ✅ Carrier integrations

---

## Key Success Metrics

### Process Efficiency
- ✅ Eliminate manual SQL queries for container tracking
- ✅ Container build time: 2 hours → 30 minutes (75% reduction)
- ✅ In-transit inventory lookup: 15 minutes → 10 seconds (99% reduction)
- ✅ CC reconciliation time: 4 hours/month → 30 minutes/month (88% reduction)

### Visibility
- ✅ Real-time inventory across 3 locations (ATL, STT, STX)
- ✅ Real-time in-transit tracking (~4 containers at any time)
- ✅ Corporate card PO tracking (no more spreadsheets)

### Accuracy
- ✅ 100% audit trail (every inventory movement logged)
- ✅ Zero negative inventory (enforced by system)
- ✅ Clean Purchases Clearing account (corporate card workflow)
- ✅ Accurate freight cost allocation (landed cost)

### User Adoption
- ✅ Reorder clerks build containers without IT support
- ✅ Sales reps see fulfillment status in real-time
- ✅ Finance reconciles corporate cards in 1 click
- ✅ Accountant sees clean GL (no fake AP Bills)

---

## Technology Stack

**Backend:**
- Next.js 15 (App Router)
- Prisma ORM + PostgreSQL
- Server Actions for mutations
- Zod for validation

**Frontend:**
- React 19
- TypeScript
- TailwindCSS 4
- Radix UI components
- React Hook Form

**Reporting:**
- Server-side data aggregation
- CSV/Excel/PDF export
- Real-time dashboards (no caching for critical metrics)

**Integrations:**
- DHL API (tracking)
- Matson API (vessel tracking)
- Future: QuickBooks sync, Shopify, EDI

---

## Next Steps

### This Week:
1. ✅ Review & approve implementation plan
2. ✅ Confirm requirements (all questions answered)
3. ✅ Create feature branch: `feature/distribution-module`

### Week 1 (Phase 1 Start):
1. Update `schema.prisma` with Phase 1 models
2. Create migration
3. Update seed data (3 warehouses, transfer orders, reorder points)
4. Build Transfer Order UI (list, create, edit)
5. Build "Items to Transfer" report

### Week 2 (Phase 1 Complete):
1. Build ship/receive workflows
2. Test full transfer order flow (DRAFT → RELEASED → SHIPPED → RECEIVED)
3. Verify inventory balance calculations
4. Deploy to staging for user acceptance testing

---

**Ready to begin Phase 1?** 🚀
