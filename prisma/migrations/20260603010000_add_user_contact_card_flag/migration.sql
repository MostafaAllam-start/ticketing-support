-- AlterTable
ALTER TABLE "users" ADD COLUMN "has_contact_info_card" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: users already linked to a public team-member profile get a contact
-- card so their existing /contact-info/[id] pages keep working after this gate.
UPDATE "users"
SET "has_contact_info_card" = true
WHERE "id" IN (SELECT "user_id" FROM "team_members" WHERE "user_id" IS NOT NULL);
