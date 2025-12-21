The Junova ERP concept

Working name: Junova Atlas (because “ERP That Doesn’t Hate You” doesn’t fit on a logo)

Target: mid-market operators who outgrew “QuickBooks + spreadsheets + prayers,” but don’t want to buy a 900-screen monster that requires a cleric to administer.

Thesis: the ERP is not the UI. The ERP is a trustworthy accounting engine + clean domain model + composable services, wrapped in workflows humans can actually follow.

Product principles (non-negotiables)

Accounting truth is the spine. Everything either posts, drafts, or reconciles into a real ledger with auditable provenance.

Document-first UX. Humans think in documents (bill, PO, invoice, receipt), not in “screens.”

Composable, not monolithic. Core financials + modular operational domains (inventory, projects, manufacturing, etc.).

API-first and event-driven. Every action produces events. Integrations become normal, not a heroic side quest.

No “setup labyrinth.” Configuration is guided, validated, and testable (sandboxed config with diff/merge).

Every workflow has a why. If a process exists, it’s because it controls risk, cash, or compliance. Otherwise it’s deleted.

Core architecture (modern, boring in the best way)
1) Ledger Engine (the sacred layer)

A dedicated accounting service that owns:

Chart of accounts

Journal entries (double-entry, balanced, immutable once posted)

Posting rules (source document → ledger mapping)

Dimensions (not “segments/subaccounts hell”)

Periods / closes / audit locks

Multi-book (optional but mid-market loves it)

Multi-entity & intercompany

Multi-currency with revaluation

Key design choice:
Posted journals are immutable. Corrections are reversing entries. Audit and sanity both improve instantly.

2) Domain Services (the business reality layer)

Separate services/modules with clean boundaries:

AR: customer, invoice, credit memo, payments, dunning, cash application

AP: vendor, bill, approvals, payment runs, 1099/WHT options

Purchasing: requisitions → PO → receipts → bill match

Sales: quotes → sales orders → fulfillment → invoice

Inventory: items, lots/serial, warehouses, costing

Projects: budgets, time/expense, WIP, billing

Fixed Assets: acquisitions, depreciation books, disposals

Cash Management: bank feeds, reconciliation, cash forecasting

Each domain emits events like:

InvoiceApproved, GoodsReceived, PaymentApplied, PeriodClosed

3) Event Bus + Workflow Engine (the glue)

Event bus for integration + internal automation

Workflow engine for approvals, holds, exceptions, escalations

Rules expressed as readable policies (“If invoice > $25k and vendor is new → CFO approval”)

4) Analytics layer (not a report cemetery)

A semantic model on top of the ledger + domains

Real-time operational + financial metrics

Built-in dimensional reporting (P&L by anything that matters)

“Explain this number” traceability (click a line item → show contributing docs + journals)

Data model (simple enough to reason about, rich enough to scale)
The canonical object types

Parties: customers, vendors, employees (unified identity)

Documents: invoices, bills, orders, POs, receipts (state machines)

Entries: journals, subledger entries, allocations

Resources: items, assets, projects, locations

Dimensions: flexible tags with validation rules

Dimensions done right

Dimensions are first-class, not bolted onto account numbers.

Validation rules like:

“Department required for expense accounts”

“Project required for consulting revenue”

“Entity + intercompany partner required for IC postings”

This makes the system adaptable without inventing a new COA every time someone sneezes.

UX design (what users actually experience)
Home = Work Queue, not a dashboard of guilt

“Things that need me” (approvals, exceptions, unreconciled cash, stuck documents)

Contextual alerts: “3 invoices failed posting due to missing dimension: Department”

Document views are consistent across modules

Every document has the same layout:

Header (party, dates, terms, status)

Lines (items/services, quantities, accounts, dimensions)

Accounting impact preview (before posting)

Timeline/audit trail (who did what, when)

Related records (PO ↔ receipt ↔ bill, SO ↔ shipment ↔ invoice)

“Explain” mode everywhere

Click any total:

Show contributing documents

Show journal entries

Show dimensions

Show changes over time

Mid-market leadership loves this because it reduces “why is finance yelling” meetings.

Configuration & admin (no more ritual sacrifice)
Guided setup with guardrails

Setup wizard that produces a config manifest:

COA, dimensions, posting profiles, tax, numbering, approvals

Validate configuration (test posting scenarios)

Promote config from sandbox → production with diff and rollback

Industry templates (because reinventing the wheel is a disease)

Distribution

Professional services

Light manufacturing

Multi-entity franchise/holding co

Nonprofit (optional path, but doable)

Extensibility (the “don’t make me customize the core” strategy)
Apps + extensions

Public extension points:

events, webhooks

UI slots (add panels/fields)

custom objects (with permissions + reporting)

“Junova Store” for vetted modules/connectors

Integration-first stance

Clean REST + GraphQL (optional) for read models

OData compatibility only if absolutely necessary (I know, I know, enterprises love it)

Prebuilt connectors:

payroll, CRM, eCommerce, banks, payment processors, EDI, tax engines

AI features that aren’t gimmicks

AI should do boring, high-value work:

Cash application assistant

Match remittances to open invoices, propose splits, learn patterns

Anomaly detection

Duplicate invoices, odd spend spikes, unusual margin drops

Close assistant

“You can’t close because these 12 items are unresolved”

Natural language reporting

“Show AR aging by customer segment over 6 months”

Policy copilot

“Why did this invoice require approval?” → points to the rule + threshold

No “AI writes your journal entries.” That’s how you end up on a podcast you don’t want to be on.

Security & compliance (adult supervision)

Role-based access + attribute-based policies (entity/department scoping)

Full audit logs, immutable posting

SSO/SAML, MFA

Data encryption, tenant isolation

SOC2-ready architecture from day one (future-you will send present-you a gift basket)

MVP scope (what we build first)

Phase 1: Core Financials + AR/AP + Banking

GL + dimensions + periods/close

AR invoicing + payments + dunning

AP bills + approvals + payment runs

Bank feeds + reconciliation

Basic reporting + “Explain this number”

Integration API + webhooks

Phase 2: Order-to-Cash & Procure-to-Pay

Sales orders, fulfillment, invoicing

Purchasing, receiving, 3-way match

Inventory basics

Phase 3: Vertical power

Projects/WIP or Manufacturing, depending on target segment

Advanced allocations, revenue recognition, multi-book consolidation

The “why would anyone switch” pitch baked into the product

Faster implementation (templates + guided config)

Less admin burden (dimensions + validation + explainability)

Fewer broken processes (workflow engine + exception handling)

Better integrations (event-driven, API-first)

Truth you can trace (auditability without misery)