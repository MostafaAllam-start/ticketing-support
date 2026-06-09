import type {
  Company,
  PrismaClient,
  Project,
  User,
} from "../../app/generated/prisma/client";

// Seeds a couple of suggestions and one complaint so the admin/manager dashboards
// have data. Idempotent: skips each kind if rows already exist. Every suggestion
// is scoped to a company (CTC here, matching the seeded authors) and may
// optionally be scoped to one of that company's projects.
export async function seedFeedback(
  prisma: PrismaClient,
  users: Record<string, User>,
  companies: Record<string, Company> = {},
  projects: Record<string, Project> = {},
): Promise<void> {
  const ctc = companies.ctc;
  const suggestionCount = await prisma.suggestion.count();
  if (suggestionCount === 0 && ctc) {
    await prisma.suggestion.createMany({
      data: [
        {
          title: "Add a dark mode to the SAP launchpad",
          details: "It would reduce eye strain during night shifts.",
          createdById: users.manager1.id,
          companyId: ctc.id,
          // Scoped to a specific CTC project.
          projectId: projects["sap-implementation"]?.id ?? null,
        },
        {
          title: "Bulk-close resolved tickets",
          details: "A way to close several tickets at once would save time.",
          createdById: users.reviewer1.id,
          companyId: ctc.id,
          // General to the company (no specific project).
        },
      ],
    });
    console.log("✓ Seeded 2 sample suggestions.");
  } else if (suggestionCount === 0 && !ctc) {
    console.log("• No CTC company found; skipping suggestion seed.");
  } else {
    console.log(
      `• Suggestions already present (${suggestionCount}); skipping.`,
    );
  }

  const complaintCount = await prisma.complaint.count();
  if (complaintCount === 0) {
    // Attach the complaint to one of user1's tickets, if any.
    const ticket = await prisma.ticket.findFirst({
      where: { userId: users.user1.id, deletedAt: null },
      orderBy: { id: "asc" },
    });
    if (ticket) {
      await prisma.complaint.create({
        data: {
          title: "Reviewer did not answer properly",
          details:
            "The reply did not address the actual upload error I described.",
          ticketId: ticket.id,
          createdById: users.user1.id,
        },
      });
      console.log("✓ Seeded 1 sample complaint.");
    } else {
      console.log("• No ticket for user1; skipping complaint seed.");
    }
  } else {
    console.log(`• Complaints already present (${complaintCount}); skipping.`);
  }
}
