import "dotenv/config";
import { prisma } from "./seeding/client";
import { seedRoles } from "./seeding/roles";
import { seedUsers } from "./seeding/users";
import { seedCompanies } from "./seeding/companies";
import { seedSampleUsers } from "./seeding/sample-users";
import { seedProjects } from "./seeding/projects";
import { seedTickets } from "./seeding/tickets";
import { seedReplies } from "./seeding/replies";
import { seedReports } from "./seeding/reports";
import { seedFeedback } from "./seeding/feedback";
import { seedPartners } from "./seeding/partners";

// Orchestrates the individual seeders in dependency order: roles and companies
// first, then the users that reference them, then projects (with managers and
// members), tickets, replies, diagnostic reports, and feedback
// (suggestions/complaints) for the dashboard and user views, and finally the
// public-facing team members and partners shown on the landing page.
async function main() {
  const roles = await seedRoles(prisma);
  const companies = await seedCompanies(prisma);
  await seedUsers(prisma);
  const sampleUsers = await seedSampleUsers(prisma, companies);
  const projects = await seedProjects(prisma, companies, sampleUsers, roles);
  await seedTickets(prisma, sampleUsers, projects);
  await seedReplies(prisma, sampleUsers);
  await seedReports(prisma, sampleUsers);
  await seedFeedback(prisma, sampleUsers, companies, projects);
  await seedPartners(prisma, companies);
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
