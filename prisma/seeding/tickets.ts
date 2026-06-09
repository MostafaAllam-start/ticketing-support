import type {
  PrismaClient,
  Project,
  User,
} from "../../app/generated/prisma/client";

// Seeds demo tickets so the dashboards (admin Issues, engineer assigned, reviewer
// reported, manager project queue) and KPIs are populated. Skips if any tickets
// already exist. `projects` (optional) lets CTC reporter tickets be scoped to a
// project so the manager's project-scoped view has data.
export async function seedTickets(
  prisma: PrismaClient,
  users: Record<string, User>,
  projects: Record<string, Project> = {},
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
  // user1 is a CTC reporter, so their tickets are scoped to a CTC project.
  const ctcProjectId = projects["sap-implementation"]?.id ?? null;

  // `assigneeIds` is the set of software-engineers assigned to each ticket — a
  // ticket can have zero, one, or many (the "Search returns no results" ticket is
  // assigned to both engineers).
  const data = [
    {
      title: "Cannot upload documents to SAP",
      description: "Upload fails with a 500 error on large files.",
      userId: user1.id,
      companyId: user1.companyId,
      projectId: ctcProjectId,
      assigneeIds: [engineer1.id],
      status: "open" as const,
    },
    {
      title: "Search returns no results",
      description: "Full-text search is empty even for indexed documents.",
      userId: user2.id,
      companyId: user2.companyId,
      projectId: null,
      assigneeIds: [engineer1.id, engineer2.id],
      status: "in_progress" as const,
    },
    {
      title: "Workflow approval stuck",
      description: "Approval step never sends notifications.",
      userId: user1.id,
      companyId: user1.companyId,
      projectId: ctcProjectId,
      assigneeIds: [engineer2.id],
      status: "closed" as const,
    },
    {
      title: "Login redirect loop on SSO",
      description: "Users bounce between SSO and the app.",
      userId: user2.id,
      companyId: user2.companyId,
      projectId: null,
      assigneeIds: [],
      status: "open" as const,
    },
    {
      title: "Permissions not applied to folder",
      description: "ACL changes are ignored on subfolders.",
      userId: user1.id,
      companyId: user1.companyId,
      projectId: ctcProjectId,
      assigneeIds: [],
      status: "open" as const,
    },
    {
      title: "Report export is blank",
      description: "PDF export downloads an empty file.",
      userId: user2.id,
      companyId: user2.companyId,
      projectId: null,
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
