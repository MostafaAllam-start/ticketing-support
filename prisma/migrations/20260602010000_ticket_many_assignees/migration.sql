-- CreateTable
CREATE TABLE "ticket_assignments" (
    "ticket_id" INTEGER NOT NULL,
    "assignee_id" INTEGER NOT NULL,

    CONSTRAINT "ticket_assignments_pkey" PRIMARY KEY ("ticket_id","assignee_id")
);

-- CreateIndex
CREATE INDEX "ticket_assignments_assignee_id_idx" ON "ticket_assignments"("assignee_id");

-- AddForeignKey
ALTER TABLE "ticket_assignments" ADD CONSTRAINT "ticket_assignments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_assignments" ADD CONSTRAINT "ticket_assignments_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: carry every existing single assignee into the new join table before
-- the legacy column is dropped, so no current assignments are lost.
INSERT INTO "ticket_assignments" ("ticket_id", "assignee_id")
SELECT "id", "assignee_id" FROM "tickets" WHERE "assignee_id" IS NOT NULL;

-- DropForeignKey
ALTER TABLE "tickets" DROP CONSTRAINT "tickets_assignee_id_fkey";

-- DropIndex
DROP INDEX "tickets_assignee_id_idx";

-- AlterTable
ALTER TABLE "tickets" DROP COLUMN "assignee_id";
