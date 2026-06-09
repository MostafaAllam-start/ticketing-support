-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "review_comment" TEXT,
ADD COLUMN     "reviewed_at" TIMESTAMP(3),
ADD COLUMN     "reviewer_id" INTEGER;

-- CreateIndex
CREATE INDEX "tickets_reviewer_id_idx" ON "tickets"("reviewer_id");

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
