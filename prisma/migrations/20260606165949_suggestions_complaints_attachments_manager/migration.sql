/*
  Warnings:

  - You are about to drop the column `ticket_id` on the `replies` table. All the data in the column will be lost.
  - You are about to drop the `images` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `entity_id` to the `replies` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entity_type` to the `replies` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AttachmentEntityType" AS ENUM ('reply', 'ticket', 'suggestion', 'complaint');

-- CreateEnum
CREATE TYPE "ReplyEntityType" AS ENUM ('ticket', 'complaint', 'suggestion');

-- DropForeignKey
ALTER TABLE "replies" DROP CONSTRAINT "replies_ticket_id_fkey";

-- DropIndex
DROP INDEX "replies_ticket_id_idx";

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "manager_id" INTEGER;

-- AlterTable
ALTER TABLE "replies" DROP COLUMN "ticket_id",
ADD COLUMN     "entity_id" INTEGER NOT NULL,
ADD COLUMN     "entity_type" "ReplyEntityType" NOT NULL;

-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "project_id" INTEGER;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "company_id" INTEGER;

-- DropTable
DROP TABLE "images";

-- DropEnum
DROP TYPE "ImageEntityType";

-- CreateTable
CREATE TABLE "attachments" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "entity_type" "AttachmentEntityType" NOT NULL,
    "entity_id" INTEGER NOT NULL,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suggestions" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "details" TEXT,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complaints" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "ticket_id" INTEGER NOT NULL,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "complaints_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "attachments_entity_type_entity_id_idx" ON "attachments"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "suggestions_created_by_idx" ON "suggestions"("created_by");

-- CreateIndex
CREATE INDEX "complaints_ticket_id_idx" ON "complaints"("ticket_id");

-- CreateIndex
CREATE INDEX "complaints_created_by_idx" ON "complaints"("created_by");

-- CreateIndex
CREATE INDEX "projects_manager_id_idx" ON "projects"("manager_id");

-- CreateIndex
CREATE INDEX "replies_entity_type_entity_id_idx" ON "replies"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "tickets_project_id_idx" ON "tickets"("project_id");

-- CreateIndex
CREATE INDEX "users_company_id_idx" ON "users"("company_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
