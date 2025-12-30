# Distribution Module - Quick Summary

## Business Scenario
**USVI Parts & Commodities Distributor**
- Main hub: Atlanta, GA (all goods received here first)
- Island warehouses: St Thomas, St Croix (with retail locations)
- St John served via St Thomas local delivery
- Transportation: Ocean containers (large shipments), DHL air freight (urgent), local courier (STT→STJ)
- Products: Car parts (special orders), hotel/resort bulk supplies (paper goods, etc.)
- Procurement: Sales reps purchase on corporate cards → ship to Atlanta → transfer to islands

## Core Problem to Solve
Replace Acumatica's inadequate handling of:
1. ❌ Container building and tracking (requires manual SQL queries)
2. ❌ In-transit inventory visibility (no real-time tracking)
3. ❌ Multi-leg transfers (ATL → STT → STJ)
4. ❌ Integrated SO → PO → Transfer Order flow

## Atlas Solution: Key Features

### 1. **Multi-Location Inventory Tracking**
- Real-time on-hand balances across 4 locations (ATL, STT, STX, STJ)
- In-transit inventory tracking (containers on water)
- Allocated vs. available quantities
- Materialized balance table for performance (supports 100k+ transactions)

### 2. **Container Management**
- Build ocean freight containers with load planning (weight/volume utilization)
- Track container status: PLANNING → READY → IN_TRANSIT → AT_PORT → DELIVERED
- Link multiple transfer orders to single container
- Vessel tracking (vessel name, voyage #, BOL, ETA)

### 3. **Transfer Orders** (Warehouse-to-Warehouse)
- Document-first workflow: DRAFT → RELEASED → SHIPPED → RECEIVED
- Multi-leg support (ATL → STT → STJ)
- Shipping method selection (Ocean FCL/LCL, Air Freight, Local Courier)
- Automatic inventory transactions on ship/receive

### 4. **Sales Order → Purchase Order → Transfer Flow**
- Customer orders at island retail location
- Sales rep purchases on corporate card (tracked on PO)
- Goods ship to Atlanta (PO receipt)
- Transfer to destination island (Transfer Order + Container)
- Fulfill customer order from island warehouse

### 5. **Corporate Card Tracking**
- Track POs purchased on sales rep credit cards
- Link PO to purchaser (sales rep)
- Corporate Card Reconciliation report
- Future: Reimbursement workflow integration

### 6. **Reorder Point Automation**
- Set min/max levels per item/warehouse
- Daily monitoring (on-hand + in-transit vs. min qty)
- Auto-generate PO recommendations
- Preferred vendor per item/warehouse

### 7. **Landed Cost Allocation**
- Allocate container freight cost to items (by weight, value, or qty)
- Update inventory unit cost with landed cost
- Post freight variance to GL

### 8. **Critical Reports**
- Inventory in Transit (all containers on water)
- Items to Transfer (SO lines awaiting fulfillment)
- Container Load Planning (capacity utilization)
- Items Below Reorder Point (auto-PO triggers)
- On-Hand by Location (ATL, STT, STX, In-Transit)
- Corporate Card Reconciliation (expense reimbursement)
- Freight Cost Analysis (cost per route, per lb, per item)

## Database Schema: New Models

| Model | Purpose |
|-------|---------|
| `InventoryBalance` | Materialized on-hand balances (performance + allocated/available tracking) |
| `TransferOrder` + `TransferOrderLine` | Warehouse-to-warehouse transfers |
| `Container` + `ContainerLine` | Ocean freight container management |
| `Shipment` + `ShipmentLine` | Logical shipment grouping (can be in container or standalone) |
| `ReorderPoint` | Min/max inventory levels per item/warehouse |
| `WarehouseLocation` | Bin/aisle/position tracking (future WMS) |

**Enhancements to Existing Models:**
- `Warehouse`: Add address, island code (STT/STX/STJ/ATL), warehouse type
- `PurchaseOrder`: Add purchase type (CORPORATE_CARD), purchased by (sales rep), card last 4
- `SalesOrderLine`: Add allocated warehouse, allocated qty, shipped qty

## Implementation Phases (12 Weeks)

### Phase 1 (Weeks 1-2): Foundation
- Transfer Order UI (create, edit, list)
- Warehouse setup (4 locations with island codes)
- Inventory Balance table (materialized balances)
- "Items to Transfer" report

### Phase 2 (Weeks 3-4): Container Management
- Container UI (build, plan, track)
- Container load planning (weight/volume utilization)
- "Inventory in Transit" dashboard
- Link Transfer Orders → Containers

### Phase 3 (Weeks 5-6): SO/PO Fulfillment
- SO allocation workflow (allocate inventory to warehouse)
- SO shipment workflow (create shipment, issue inventory)
- PO receipt workflow (receive at Atlanta)
- PO → SO linking (track custom orders)
- Corporate card PO tracking

### Phase 4 (Weeks 7-8): Reorder Automation
- Reorder Point setup UI
- "Items Below Reorder Point" report (scheduled daily)
- "Create PO from Reorder Point" action
- Demand forecast (future enhancement)

### Phase 5 (Weeks 9-10): Reporting
- 12+ operational & financial reports
- Role-based dashboards (Operations, Reorder Clerk, Sales)
- CSV/Excel/PDF export

### Phase 6 (Weeks 11-12): Advanced Features
- Lot/serial tracking
- Landed cost allocation (freight → inventory cost)
- Multi-leg transfer support (STT → STJ)
- Carrier integrations (DHL, Matson tracking APIs)

## Key Design Decisions

### Why Materialized `InventoryBalance` Table?
- **Performance**: O(1) lookup vs. O(n) aggregation of transactions
- **Allocated/Available Tracking**: Can't calculate from transactions alone
- **Lot/Serial Support**: Enables future lot/serial balances
- **Trade-off**: More complex writes (update both tables), but worth it for read performance

### Why Separate `Container` and `Shipment`?
- **Container** = Physical container (ocean freight only)
- **Shipment** = Logical grouping of items (can be in container or standalone for air freight)
- **Flexibility**: Supports both containerized and non-containerized shipments

### St Thomas → St John Transfers?
- **No Transfer Order needed** (local delivery within 1 day)
- **Workflow**: Allocate at ST THOMAS → Create Shipment directly to customer in St John
- **Simpler** than creating a Transfer Order for every local delivery

## Success Metrics

### Process Efficiency
- ✅ Eliminate manual SQL queries for container tracking
- ✅ Reduce container build time: 2 hours → 30 minutes
- ✅ Reduce in-transit inventory lookup: 15 minutes → 10 seconds

### Visibility
- ✅ Real-time inventory across 4 locations
- ✅ Real-time in-transit tracking
- ✅ Corporate card PO tracking (no more spreadsheets)

### Accuracy
- ✅ 100% audit trail (every inventory movement logged)
- ✅ Zero negative inventory (enforced by system)
- ✅ Accurate freight cost allocation

### User Adoption
- ✅ Reorder clerks build containers without IT support
- ✅ Sales reps see fulfillment status in real-time
- ✅ Finance reconciles corporate cards in 1 click

## What Makes This Better Than Acumatica?

| Feature | Acumatica | Atlas |
|---------|-----------|-------|
| Container tracking | Manual SQL query joins | First-class Container object with status tracking |
| In-transit inventory | Not visible | Real-time dashboard with ETAs |
| Multi-leg transfers | Workarounds | Native support (ATL → STT → STJ) |
| Corporate card POs | Manual spreadsheet | Built-in tracking + reconciliation report |
| Inventory balances | Slow aggregation | Materialized table (instant lookup) |
| Freight allocation | Manual | Automated by weight/value/qty |
| Audit trail | Limited | Every transaction immutable + traceable |

## ✅ Requirements Confirmed

### Key Decisions:

1. **Warehouses**: ✅ **3 locations** (ATL, STT, STX)
   - St John: Customer deliveries only (no warehouse)

2. **Container Sizes**: ✅ **40ft containers** (FCL only)
   - No LCL consolidation needed

3. **Shipping Frequency**: ✅ **Weekly** shipments
   - Transit time: **14 days** ATL → STT
   - Expect ~4 containers in-transit at any time

4. **Reorder Points**: ✅ **Reorder clerks** manage
   - **Stocked items only** (not all items)

5. **Corporate Cards**: ⚠️ **CRITICAL REQUIREMENT**
   - **NOT reimbursement** (corporate cards, not personal)
   - **Current process broken**: Fake AP Bills, purchases clearing is a mess
   - **Need**: Proper corporate card clearing workflow (see Part 11 in detailed plan)

6. **Hotel Customers**: ✅ **Standing orders** (some customers)
   - ✅ **Contract pricing** required (different prices per customer)

7. **Freight Allocation**: ⚠️ **Current process**: Build freight into item cost (not clean)
   - **Need**: Track freight separately from item cost (landed cost allocation)

8. **Lot/Serial**: ✅ **Some items serialized** (car parts with VINs)
   - ✅ **Some lot-controlled** (expiry dates for paper goods)

9. **Currency**: ✅ **USD only** (not needed at this time)

10. **Data Migration**: ✅ **~1 year out** (not immediate concern)
    - Build for greenfield implementation

---

## 🚨 NEW CRITICAL REQUIREMENT: Corporate Card Clearing Workflow

### The Problem (Current Acumatica Process):
1. Sales rep purchases car part on corporate card ($500)
2. Item ships to Atlanta
3. Sales rep creates "receipt of invoice" (even without actual invoice)
4. System creates fake AP Bill → Dr. Inventory / Cr. Purchases Clearing
5. CC statement arrives → Manual matching nightmare
6. **Result**: Purchases Clearing account is a mess (orphaned entries, doesn't reconcile)

### Atlas Solution:

**Step 1: Sales Rep Creates PO**
- Purchase Type: CORPORATE_CARD
- Card Holder: Sales Rep Name
- Card Last 4: 1234
- No AP Bill created

**Step 2: Receive at Atlanta**
- Auto-posts: Dr. Inventory / Cr. Corporate Card Clearing (Liability)
- Clean accounting (no fake AP Bills)

**Step 3: CC Statement Import (Month-End)**
- Accountant imports CC statement (CSV)
- System auto-matches charges to POs (by date, amount, card last 4, merchant)
- Manual match for exceptions

**Step 4: Create Payment**
- Single GL entry: Dr. Corporate Card Clearing / Cr. Cash
- Marks all POs as reconciled
- Clean reconciliation ✅

### Benefits:
- ✅ **No fake AP Bills** (POs are "already paid" via CC)
- ✅ **Clean Purchases Clearing account** (balances properly)
- ✅ **Auto-matching** (90%+ of charges match automatically)
- ✅ **Audit trail**: PO → Receipt → CC Charge → Payment
- ✅ **Unreconciled PO report** (shows which POs haven't been matched yet)

### New Database Models:
- `CreditCardStatement` (monthly imports)
- `CreditCardCharge` (individual CC transactions)
- New PO fields: `purchaseType`, `cardLast4`, `cardHolderId`, `ccReconciled`

### New UI Pages:
- Credit Card Reconciliation page (`/dashboard/credit-cards/reconciliation`)
- Unreconciled Corporate Card POs report
- Dashboard widget: Corporate Card Summary

**This is a Phase 3 deliverable** (weeks 5-6) and will solve a major pain point in the current system.

---

## Next Steps

### This Week:
1. ✅ **Review & approve this plan** with stakeholders
2. ✅ **Answer open questions** above
3. ✅ **Create feature branch**: `feature/distribution-module`

### Week 1-2 (Phase 1):
1. Update `schema.prisma` with new models
2. Create migration + seed data (4 warehouses, transfer orders)
3. Build Transfer Order UI (list, create, edit)
4. Build "Items to Transfer" report
5. Test full transfer order flow (DRAFT → RELEASED → SHIPPED → RECEIVED)

---

**Full detailed plan**: [DISTRIBUTION_IMPLEMENTATION_PLAN.md](./DISTRIBUTION_IMPLEMENTATION_PLAN.md)
