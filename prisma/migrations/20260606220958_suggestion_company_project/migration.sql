-- AlterTable: add the new columns nullable first so existing rows can be backfilled.
ALTER TABLE "suggestions" ADD COLUMN     "company_id" INTEGER,
ADD COLUMN     "project_id" INTEGER;

-- Backfill company_id from each suggestion's author company where the author has one.
UPDATE "suggestions" s
SET "company_id" = u."company_id"
FROM "users" u
WHERE s."created_by" = u."id" AND u."company_id" IS NOT NULL;

-- Backfill any leftover rows (author without a company) to the lowest company id.
UPDATE "suggestions"
SET "company_id" = (SELECT MIN("id") FROM "companies")
WHERE "company_id" IS NULL;

-- Now that every row has a company, enforce the NOT NULL constraint.
ALTER TABLE "suggestions" ALTER COLUMN "company_id" SET NOT NULL;

-- CreateIndex
CREATE INDEX "suggestions_company_id_idx" ON "suggestions"("company_id");

-- CreateIndex
CREATE INDEX "suggestions_project_id_idx" ON "suggestions"("project_id");

-- AddForeignKey
ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
