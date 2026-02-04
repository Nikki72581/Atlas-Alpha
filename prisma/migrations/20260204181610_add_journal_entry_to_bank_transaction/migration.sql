-- AlterTable
ALTER TABLE "bank_transactions" ADD COLUMN     "journalEntryId" TEXT;

-- CreateIndex
CREATE INDEX "bank_transactions_journalEntryId_idx" ON "bank_transactions"("journalEntryId");

-- AddForeignKey
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
