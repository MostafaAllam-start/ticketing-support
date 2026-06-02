import "dotenv/config";
import { prisma } from "./seeding/client";
import { seedRoles } from "./seeding/roles";
import { seedUsers } from "./seeding/users";
import { seedSampleUsers } from "./seeding/sample-users";
import { seedTickets } from "./seeding/tickets";
import { seedReplies } from "./seeding/replies";
import { seedTeamMembers } from "./seeding/team-members";
import { seedPartners } from "./seeding/partners";

// Orchestrates the individual seeders in dependency order: roles first, then the
// users that reference them, then sample accounts, tickets, and replies for the
// dashboard and user ticket views, and finally the public-facing team members and
// partners shown on the landing page.
async function main() {
  const roles = await seedRoles(prisma);
  await seedUsers(prisma, roles);
  const sampleUsers = await seedSampleUsers(prisma, roles);
  await seedTickets(prisma, sampleUsers);
  await seedReplies(prisma, sampleUsers);
  await seedTeamMembers(prisma, sampleUsers);
  await seedPartners(prisma);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Seeding failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
