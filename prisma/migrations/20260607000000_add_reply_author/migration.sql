-- Replies become an attributed two-party conversation: each row now records its
-- author (user_id) and timestamps. Existing replies are author-less sample data
-- recreated by the seeder, so they are cleared before the NOT NULL author column
-- is added (keeps this migration runnable non-interactively).
DELETE FROM "replies";

-- AlterTable
ALTER TABLE "replies"
  ADD COLUMN "user_id" INTEGER NOT NULL,
  ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "replies_user_id_idx" ON "replies"("user_id");

-- AddForeignKey
ALTER TABLE "replies" ADD CONSTRAINT "replies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
