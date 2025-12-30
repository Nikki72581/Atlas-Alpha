# Corporate Card Clearing Workflow
## Solving the "Purchases Clearing Account Nightmare"

---

## The Problem Today (Acumatica)

### Current Broken Process:

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Sales Rep Purchases on Corporate Card                   │
└─────────────────────────────────────────────────────────────────┘
Sales rep buys car part from Amazon for $500
- Uses corporate credit card (Card ending in 1234)
- NO PO created in advance (ad-hoc purchase)
- Item ships to Atlanta


┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Sales Rep Creates "Receipt of Invoice" (The Hack)       │
└─────────────────────────────────────────────────────────────────┘
Problem: Often NO actual invoice from vendor
- Sales rep creates fake "receipt of invoice" in Acumatica
- System creates AP Bill anyway:

  Dr. Inventory (Asset) $500
  Cr. Purchases Clearing (Liability) $500

- Purpose: Try to get the purchase into the system
- Reality: Creates mess in Purchases Clearing account


┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Credit Card Statement Arrives (Chaos Begins)            │
└─────────────────────────────────────────────────────────────────┘
Accountant receives CC statement with 200+ charges
- Must manually match each charge to "receipt of invoice"
- No systematic way to match:
  - Dates don't align (purchase date ≠ receipt date)
  - Amounts don't match (shipping, tax differences)
  - Merchant names don't match vendor names
- Many charges have NO matching receipt (sales rep forgot)
- Many receipts have NO matching charge (never actually purchased)


┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Accountant Tries to Clear Purchases Clearing            │
└─────────────────────────────────────────────────────────────────┘
Attempt to clear the liability:

  Dr. Purchases Clearing (Liability) $???
  Cr. Cash (Asset) $???

Problems:
- ❌ Purchases Clearing balance doesn't match CC statement total
- ❌ Orphaned entries (receipts with no CC charge)
- ❌ Unmatched charges (CC charges with no receipt)
- ❌ Account balance grows over time (never fully clears)
- ❌ Accountant spends 4+ hours/month manually reconciling
```

### Pain Points Summary:
| Issue | Impact |
|-------|--------|
| **Fake AP Bills** | Accounts Payable is polluted with non-payable items |
| **Purchases Clearing Doesn't Balance** | Can't reconcile, balance grows indefinitely |
| **Manual Matching Hell** | 4+ hours/month of tedious work |
| **No Audit Trail** | Can't trace PO → Receipt → CC Charge → Payment |
| **Missing Invoices** | Sales reps create receipts without actual vendor invoices |

---

## Atlas Solution: Clean Corporate Card Workflow

### New Process (Atlas):

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Sales Rep Creates PO (Before or After Purchase)         │
└─────────────────────────────────────────────────────────────────┘

Sales rep creates PO in Atlas (mobile-friendly):

  Purchase Order PO-10001
  ┌────────────────────────────────────────────────┐
  │ Vendor: Amazon Auto Parts                      │
  │ Purchase Type: ⚡ CORPORATE CARD               │
  │ Card Holder: John Smith (Sales Rep)            │
  │ Card Last 4: 1234                               │
  │ Receipt Warehouse: ATLANTA                      │
  │ Final Destination: ST THOMAS                    │
  │                                                 │
  │ Lines:                                          │
  │ - Brake Rotor (Qty 1, $500)                    │
  │                                                 │
  │ Status: RELEASED                                │
  └────────────────────────────────────────────────┘

Key: Purchase Type = CORPORATE_CARD (not STANDARD)
- System knows: This is already "paid" via CC
- No AP Bill will be created
- Posts to "Corporate Card Clearing" (not "Accounts Payable")


┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Warehouse Receives Item at Atlanta                      │
└─────────────────────────────────────────────────────────────────┘

Warehouse clicks "Receive PO":
- Creates Inventory Transaction (RECEIPT)
- Updates PO status: FULFILLED
- System checks purchaseType = CORPORATE_CARD
- Auto-posts to GL:

  Dr. Inventory (Asset 1300)              $500
  Cr. Corporate Card Clearing (Liability 2100)  $500

✅ Clean accounting (no fake AP Bill!)
✅ Liability created in correct account
✅ PO marked as "received but not reconciled"


┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: CC Statement Import (Month-End - 5 Minutes!)            │
└─────────────────────────────────────────────────────────────────┘

Accountant goes to: /dashboard/credit-cards/reconciliation

Import CC Statement (CSV):

  Credit Card Statement - December 2024
  ┌────────────────────────────────────────────────┐
  │ Card Last 4: 1234                               │
  │ Statement Date: 12/31/2024                      │
  │ Total Charges: $45,234.50                       │
  │                                                 │
  │ [Upload CSV File] ← Export from bank website   │
  └────────────────────────────────────────────────┘

CSV Format:
  Date,Merchant,Amount,Card
  2024-12-15,Amazon.com,$500.00,1234
  2024-12-18,AutoZone,$234.50,1234
  ...

System auto-imports → Creates CreditCardCharge records


┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Auto-Match Charges to POs (90%+ Success Rate!)          │
└─────────────────────────────────────────────────────────────────┘

System runs auto-match algorithm:

For each CC charge:
  1. Find POs with:
     - purchaseType = CORPORATE_CARD
     - cardLast4 = 1234 (matches)
     - ccReconciled = false (not yet matched)
     - PO date within ±3 days of charge date
     - Amount within ±$5 of charge amount
     - Merchant name fuzzy match (Amazon ≈ Amazon.com)

  2. If single match found → Auto-link charge to PO
     - matchStatus = AUTO_MATCHED
     - Update PO: ccChargeAmount = $500, ccChargeDate = 12/15

  3. If multiple matches or no match → Manual review needed
     - matchStatus = UNMATCHED
     - Accountant reviews exceptions

Reconciliation Screen:

  Credit Card Reconciliation
  ┌────────────────────────────────────────────────────────────────┐
  │ Total Charges: $45,234.50                                      │
  │ Auto-Matched: $43,100.00 (95%)                                 │
  │ Manual Review: $2,134.50 (5%)                                  │
  │                                                                │
  │ [View Auto-Matched] [Review Exceptions] [Create Payment]       │
  └────────────────────────────────────────────────────────────────┘

Exceptions Panel (for 5% that didn't auto-match):

  Unmatched Charges (Need Manual Match)
  ┌────────────────────────────────────────────────────────────────┐
  │ Charge: 12/20 - AutoZone - $234.50 - Card 1234                │
  │ Possible Matches:                                              │
  │   ○ PO-10005 - AutoZone - $229.99 (variance: $4.51)           │
  │   ○ PO-10012 - AutoZone - $240.00 (variance: -$5.50)          │
  │   ○ Create New PO (forgot to create PO)                       │
  │   ○ Mark as Personal/Error                                     │
  └────────────────────────────────────────────────────────────────┘

Accountant clicks → Links charge to PO-10005
- Creates variance entry if needed (freight, tax difference)


┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: Create Payment (One Click!)                             │
└─────────────────────────────────────────────────────────────────┘

All charges matched → Accountant clicks "Create Payment"

System generates GL journal entry:

  Journal Entry JE-2024-12-001
  ┌────────────────────────────────────────────────────────────────┐
  │ Date: 12/31/2024                                               │
  │ Description: Credit Card Payment - Card 1234 - December 2024  │
  │                                                                │
  │ Dr. Corporate Card Clearing (2100)  $45,234.50                │
  │ Cr. Cash - Checking (1010)          $45,234.50                │
  │                                                                │
  │ Status: POSTED                                                 │
  └────────────────────────────────────────────────────────────────┘

System updates all matched POs:
- ccReconciled = true
- ccReconciledAt = now()
- ccReconciledBy = accountant user ID

✅ Corporate Card Clearing account balance = $0 (cleared!)
✅ All POs marked as reconciled
✅ Clean audit trail


┌─────────────────────────────────────────────────────────────────┐
│ RESULT: CLEAN RECONCILIATION ✅                                  │
└─────────────────────────────────────────────────────────────────┘

Benefits:
  ✅ No fake AP Bills (POs are "already paid" via CC)
  ✅ Corporate Card Clearing account balances (clears to $0 monthly)
  ✅ 90%+ auto-match rate (saves 3.5 hours/month)
  ✅ Complete audit trail: PO → Receipt → CC Charge → Payment
  ✅ Easy to see unreconciled POs (report shows which haven't been matched)
  ✅ Variance tracking (handles shipping/tax differences)
  ✅ Exception handling (personal charges, forgotten POs)
```

---

## Database Schema

### New Models:

```prisma
model PurchaseOrder {
  // ... existing fields ...

  // Corporate Card Fields
  purchaseType    PurchaseType @default(STANDARD)
  paymentMethod   String?       // "CORPORATE_CARD_1234"
  cardLast4       String?       // "1234"
  cardHolderId    String?       // User ID of sales rep
  cardHolder      User? @relation(fields: [cardHolderId], references: [id])

  // Reconciliation Tracking
  ccChargeDate    DateTime?     // Date charge appeared on CC statement
  ccChargeAmount  Decimal?      // Actual CC charge (may differ from PO total)
  ccStatementId   String?       // Link to CC statement import
  ccReconciled    Boolean @default(false)
  ccReconciledAt  DateTime?
  ccReconciledBy  String?       // User who reconciled
}

enum PurchaseType {
  STANDARD          // Normal PO to vendor (creates AP Bill)
  CORPORATE_CARD    // Purchased on sales rep's corp card (no AP Bill)
  CONSIGNMENT       // Vendor-owned inventory
  DROP_SHIP         // Direct to customer
}

model CreditCardStatement {
  id              String   @id @default(cuid())
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id])

  statementDate   DateTime  // Statement closing date (e.g., 12/31/2024)
  cardLast4       String    // "1234"
  bankAccountId   String?   // Bank account for payment
  bankAccount     Account? @relation(fields: [bankAccountId], references: [id])

  totalCharges    Decimal   // Sum of all charges
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
```

---

## GL Posting Rules

### Standard PO (Normal Vendor):

```typescript
// On PO creation: No GL impact (just documents intent to purchase)

// On PO receipt:
Dr. Inventory (or Expense)  $500
Cr. Accounts Payable        $500

// On AP Bill payment (later):
Dr. Accounts Payable        $500
Cr. Cash                    $500
```

### Corporate Card PO (NEW):

```typescript
// On PO creation: No GL impact

// On PO receipt:
Dr. Inventory (or Expense)         $500
Cr. Corporate Card Clearing (Liability)  $500

// ❌ NO AP Bill created (already "paid" via CC)

// On CC statement payment (month-end):
Dr. Corporate Card Clearing (Liability)  $45,234.50 (sum of all charges)
Cr. Cash (Bank Account)                  $45,234.50

// This clears the liability when bank pays CC bill
```

### Variance Handling:

```typescript
// Example: PO was $500, CC charge is $515 (unexpected shipping)

// On receipt:
Dr. Inventory               $500
Cr. Corporate Card Clearing $500

// On reconciliation (when variance discovered):
Dr. Freight In (Expense)    $15
Cr. Corporate Card Clearing $15

// Now CC Clearing = $515 (matches CC charge)
```

---

## UI Components

### 1. Enhanced PO Form

```
Purchase Order Form
┌────────────────────────────────────────────────────────────────┐
│ Vendor: [Amazon Auto Parts ▼]                                  │
│ Purchase Type: [⚡ Corporate Card ▼]  ← NEW DROPDOWN           │
│                                                                │
│ ┌─ Corporate Card Details (conditional) ──────────────────┐   │
│ │ Card Holder: [John Smith (Sales) ▼]                     │   │
│ │ Card Last 4: 1234  (auto-populated)                     │   │
│ │                                                          │   │
│ │ ℹ️ Note: No AP Bill will be created. Payment posts to   │   │
│ │   Corporate Card Clearing account.                      │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                │
│ Receipt Warehouse: [Atlanta ▼]                                 │
│ Final Destination: [St Thomas ▼]                               │
│                                                                │
│ Lines:                                                         │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ Item          Qty  Unit Price  Total                     │  │
│ │ Brake Rotor   1    $500.00     $500.00                   │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                                │
│ [Cancel] [Save Draft] [Release PO]                            │
└────────────────────────────────────────────────────────────────┘
```

### 2. Credit Card Reconciliation Page

```
/dashboard/credit-cards/reconciliation

Credit Card Reconciliation
┌────────────────────────────────────────────────────────────────┐
│ [Import Statement (CSV)] [View Statements] [Unreconciled POs]  │
└────────────────────────────────────────────────────────────────┘

Active Statement: December 2024 - Card 1234
┌────────────────────────────────────────────────────────────────┐
│ Statement Date: 12/31/2024                                     │
│ Total Charges: $45,234.50                                      │
│ Matched: $43,100.00 (95%)                                      │
│ Unmatched: $2,134.50 (5%)                                      │
│ Status: MATCHED                                                │
│                                                                │
│ [Review Unmatched (10)] [Create Payment] [Export CSV]          │
└────────────────────────────────────────────────────────────────┘

Charges
┌────────────────────────────────────────────────────────────────┐
│ Date     Merchant        Amount    PO #      Status    Action  │
│ ──────────────────────────────────────────────────────────────│
│ 12/15    Amazon.com      $500.00   PO-10001  ✅ Matched   [View]│
│ 12/18    AutoZone        $234.50   PO-10005  ⚠️ Variance [Fix] │
│ 12/20    O'Reilly        $1,200    -         ❌ Unmatched [Match]│
│ ...                                                            │
└────────────────────────────────────────────────────────────────┘

Manual Match Dialog (when clicking [Match]):
┌────────────────────────────────────────────────────────────────┐
│ Match Charge to PO                                             │
│                                                                │
│ Charge: 12/20 - O'Reilly Auto Parts - $1,200.00               │
│                                                                │
│ Find PO:                                                       │
│ Search: [1200] [Search]                                        │
│                                                                │
│ Suggested Matches:                                             │
│ ○ PO-10012 - O'Reilly - $1,195.50 (Variance: $4.50)          │
│ ○ PO-10014 - O'Reilly - $1,200.00 (Exact match!)             │
│ ○ Create New PO (sales rep forgot to create)                  │
│                                                                │
│ [Cancel] [Match to PO-10014]                                   │
└────────────────────────────────────────────────────────────────┘
```

### 3. Unreconciled Corporate Card POs Report

```
/dashboard/reports/unreconciled-corporate-card-pos

Unreconciled Corporate Card POs
┌────────────────────────────────────────────────────────────────┐
│ [Export CSV] [Grouped by Card Holder ▼]                        │
└────────────────────────────────────────────────────────────────┘

John Smith (Sales Rep) - Total: $3,450.00
┌────────────────────────────────────────────────────────────────┐
│ PO #      Date    Vendor          Amount   Days Open  Status   │
│ ──────────────────────────────────────────────────────────────│
│ PO-10001  12/15   Amazon          $500.00  5         Received  │
│ PO-10005  12/18   AutoZone        $234.50  2         Received  │
│ PO-10012  12/20   O'Reilly        $1,200   0         Received  │
│ ...                                                            │
└────────────────────────────────────────────────────────────────┘

⚠️ Alert: PO-9987 has been unreconciled for 32 days (review needed)
```

### 4. Dashboard Widget

```
Corporate Card Summary (Finance Dashboard)
┌──────────────────────────────────────────┐
│ Unreconciled Charges: $3,450.00          │
│ Cards with Outstanding Charges: 3        │
│ Oldest Unreconciled PO: 32 days          │
│                                          │
│ This Month's CC Purchases: $12,340.00    │
│                                          │
│ [View Details]                           │
└──────────────────────────────────────────┘
```

---

## Reports

### 1. Unreconciled Corporate Card POs
**Purpose**: Show which POs haven't been matched to CC statement yet

**Columns**:
- PO #
- Date
- Card Holder
- Vendor
- Amount
- Card Last 4
- Days Open (since receipt)
- Status (Received, Partially Received)

**Filters**:
- Card Holder
- Date Range
- Days Open (> 30 days = red alert)

**Export**: CSV for review with sales reps

---

### 2. CC Reconciliation Status
**Purpose**: Show reconciliation progress for each CC statement

**Columns**:
- Statement Date
- Card Last 4
- Total Charges
- Matched Amount
- Unmatched Amount
- Match %
- Status (DRAFT, MATCHED, PAID)

**Actions**:
- Click to open reconciliation page
- Export unmatched charges (CSV)

---

### 3. CC Purchases by Card Holder
**Purpose**: Budget tracking, identify high spenders

**Columns**:
- Card Holder (Sales Rep)
- Month
- Total Purchases
- # of POs
- Avg PO Amount
- Reconciliation Status (X of Y reconciled)

**Filters**:
- Month Range
- Card Holder
- Min Amount

**Use Case**: Finance reviews monthly spending by sales rep

---

## Testing Scenarios

### Scenario 1: Happy Path (Auto-Match)
```
1. Sales rep creates PO (CORPORATE_CARD, $500, Card 1234, John Smith)
   ✅ PO-10001 created, status: RELEASED

2. Item received at Atlanta
   ✅ Inventory Transaction created (RECEIPT)
   ✅ GL posted: Dr. Inventory $500 / Cr. CC Clearing $500
   ✅ PO status: FULFILLED

3. CC statement imported (12/31/2024)
   ✅ CSV parsed, 200 charges imported
   ✅ Charge: 12/15, Amazon, $500, Card 1234

4. Auto-match runs
   ✅ Finds PO-10001 (date 12/14, amount $500, card 1234, vendor Amazon)
   ✅ Links charge to PO
   ✅ matchStatus: AUTO_MATCHED

5. Accountant clicks "Create Payment"
   ✅ GL entry created: Dr. CC Clearing $45,234.50 / Cr. Cash $45,234.50
   ✅ PO-10001 marked: ccReconciled = true
   ✅ CC Clearing balance = $0

Result: ✅ 5 minutes of work (vs. 4 hours in Acumatica)
```

### Scenario 2: Variance (Shipping Added)
```
1. PO created for $500, received
2. CC charge is $515 (vendor added shipping)
3. Auto-match flags variance ($15 difference)
4. Accountant reviews:
   - Sees $15 variance
   - Creates variance entry: Dr. Freight In $15 / Cr. CC Clearing $15
5. Mark as reconciled
   ✅ Total CC Clearing = $515 (matches charge)
```

### Scenario 3: Forgotten PO (Sales Rep Error)
```
1. Sales rep purchases item on CC but forgets to create PO
2. Item arrives at warehouse (no PO to receive against)
3. Warehouse creates "Receipt Without PO":
   - System prompts: "Create PO from receipt?"
   - Warehouse enters: Vendor, Item, Qty, Cost, Card Last 4
   - System auto-creates PO (CORPORATE_CARD, status: FULFILLED)
4. CC statement imported
5. Auto-match links charge to newly created PO
   ✅ Recovered from error
```

### Scenario 4: Personal Purchase (Fraud/Error)
```
1. CC statement has: "Starbucks $8.50" (personal purchase)
2. No matching PO found
3. Accountant marks as "Personal/Error"
4. Creates manual journal entry:
   Dr. Employee Advance (Asset) $8.50
   Cr. CC Clearing $8.50
5. Deduct from employee paycheck (outside ERP)
   ✅ Clean accounting, fraud flagged
```

---

## Success Metrics

| Metric | Before (Acumatica) | After (Atlas) | Improvement |
|--------|--------------------|---------------|-------------|
| **Monthly Reconciliation Time** | 4 hours | 30 minutes | 88% reduction |
| **Auto-Match Rate** | 0% (manual only) | 90%+ | Huge time saver |
| **Purchases Clearing Balance** | $50k+ (growing) | $0 (clears monthly) | Clean books |
| **AP Bills (fake)** | 200+/month | 0 | Eliminated |
| **Audit Trail** | Missing | Complete | Full traceability |
| **User Errors** | High (forgotten POs) | Low (system prompts) | Reduced |

---

## Implementation Timeline

**Phase 3, Week 5:**
- Database schema changes (PurchaseType, CC fields, CreditCardStatement, CreditCardCharge)
- Migration
- Update PO form (conditional CC fields)
- Update PO receipt logic (post to CC Clearing, not AP)

**Phase 3, Week 6:**
- Build CC Reconciliation page
- CSV import functionality
- Auto-match algorithm
- Manual match UI (drag-to-match)
- "Create Payment" action
- Reports (Unreconciled POs, CC Status, Purchases by Card Holder)
- Dashboard widget

**Testing:**
- Unit tests (auto-match algorithm)
- Integration tests (full workflow end-to-end)
- User acceptance testing (accountant reviews)

---

## Key Takeaways

### What Makes This Better Than Acumatica?

| Feature | Acumatica | Atlas |
|---------|-----------|-------|
| **PO Type Awareness** | No distinction between CC and standard POs | Purchase Type field (CORPORATE_CARD vs. STANDARD) |
| **AP Bill Creation** | Always creates AP Bill (even for CC purchases) | No AP Bill for CC purchases (cleaner AP) |
| **CC Reconciliation** | Manual matching in Excel | Auto-match algorithm (90%+ success) |
| **Purchases Clearing** | Balance grows indefinitely | Clears to $0 monthly (clean books) |
| **Audit Trail** | Broken (receipts without POs, charges without receipts) | Complete (PO → Receipt → Charge → Payment) |
| **Time Required** | 4+ hours/month | 30 minutes/month |
| **Error Recovery** | Manual fixes in GL | System prompts (create PO from receipt) |

### Why This Is Critical:

1. **Finance Pain Point**: Current process wastes 4+ hours/month
2. **Accounting Accuracy**: Purchases Clearing account is a mess (doesn't reconcile)
3. **Audit Risk**: No clean trail from purchase → receipt → payment
4. **User Frustration**: Sales reps and accountants hate the current process

### Business Impact:

- ✅ **Save 3.5 hours/month** of accountant time ($150/hour = $525/month = $6,300/year)
- ✅ **Clean financial statements** (Purchases Clearing balances properly)
- ✅ **Faster month-end close** (no more reconciliation bottleneck)
- ✅ **Better fraud detection** (unmatched charges are flagged immediately)
- ✅ **Happier users** (sales reps and accountants both benefit)

---

**This feature alone justifies switching from Acumatica to Atlas!** 🚀
