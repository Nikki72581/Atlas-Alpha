# Atlas ERP (Regenerated Starter)

Distribution-first ERP starter scaffold based on CommissionFlow UI patterns.

## Quick start

```bash
npm install
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run dev
```

Open: http://localhost:3000/dashboard

## Notes

- Uses SQLite by default (`DATABASE_URL="file:./dev.db"`). Swap to Postgres later.
- Demo tenant is hardcoded as `demo-org` to keep the starter simple.
- The UI shell is reused from CommissionFlow (sidebar/header/theme/toasts) but the domain + pages are Atlas-specific.

## Next slice (distribution MVP)

1. Sales order lines → allocate inventory
2. Shipments (issue inventory txn)
3. PO receipts (receipt inventory txn)
4. Posting preview → create JournalEntry (draft) → post (immutable)
