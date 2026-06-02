import type { PrismaClient, User } from "../../app/generated/prisma/client";

// Seeds demo tickets so the dashboards (admin Issues, engineer assigned, reviewer
// reported) and KPIs are populated. Skips if any tickets already exist.
export async function seedTickets(
  prisma: PrismaClient,
  users: Record<string, User>,
): Promise<void> {
  const existing = await prisma.ticket.count();
  if (existing > 0) {
    console.log(
      `• Tickets already present (${existing}); skipping ticket seed.`,
    );
    return;
  }

  const engineer1 = users.engineer1;
  const engineer2 = users.engineer2;
  const user1 = users.user1;
  const user2 = users.user2;

  // `assigneeIds` is the set of software-engineers assigned to each ticket — a
  // ticket can have zero, one, or many (the "Search returns no results" ticket is
  // assigned to both engineers).
  const data = [
    {
      title: "Cannot upload documents to ECM",
      description: "Upload fails with a 500 error on large files.",
      userId: user1.id,
      assigneeIds: [engineer1.id],
      status: "open" as const,
    },
    {
      title: "Search returns no results",
      description: "Full-text search is empty even for indexed documents.",
      userId: user2.id,
      assigneeIds: [engineer1.id, engineer2.id],
      status: "in_progress" as const,
    },
    {
      title: "Workflow approval stuck",
      description: "Approval step never sends notifications.",
      userId: user1.id,
      assigneeIds: [engineer2.id],
      status: "closed" as const,
    },
    {
      title: "Login redirect loop on SSO",
      description: "Users bounce between SSO and the app.",
      userId: user2.id,
      assigneeIds: [],
      status: "open" as const,
    },
    {
      title: "Permissions not applied to folder",
      description: "ACL changes are ignored on subfolders.",
      userId: user1.id,
      assigneeIds: [],
      status: "open" as const,
    },
    {
      title: "Report export is blank",
      description: "PDF export downloads an empty file.",
      userId: user2.id,
      assigneeIds: [],
      status: "in_progress" as const,
    },
  ];

  // createMany can't write the join rows, so create each ticket with its nested
  // assignment rows.
  for (const { assigneeIds, ...ticket } of data) {
    await prisma.ticket.create({
      data: {
        ...ticket,
        assignees: {
          create: assigneeIds.map((assigneeId) => ({ assigneeId })),
        },
      },
    });
  }
  console.log(`✓ Seeded ${data.length} sample tickets.`);
}
