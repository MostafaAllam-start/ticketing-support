/*
  Warnings:

  - You are about to drop the `_CompanyToTeamMember` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `team_members` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_CompanyToTeamMember" DROP CONSTRAINT "_CompanyToTeamMember_A_fkey";

-- DropForeignKey
ALTER TABLE "_CompanyToTeamMember" DROP CONSTRAINT "_CompanyToTeamMember_B_fkey";

-- DropForeignKey
ALTER TABLE "team_members" DROP CONSTRAINT "team_members_user_id_fkey";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_team_member" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "_CompanyToTeamMember";

-- DropTable
DROP TABLE "team_members";
