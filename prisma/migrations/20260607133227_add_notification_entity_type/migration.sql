-- CreateEnum
CREATE TYPE "NotificationEntityType" AS ENUM ('ticket', 'suggestion');

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "entity_type" "NotificationEntityType";
