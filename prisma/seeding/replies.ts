import type { PrismaClient, User } from "../../app/generated/prisma/client";

// Seeds a short support thread on user1's tickets so the ticket-details view has
// replies to display. Idempotent: skips if any replies already exist.
export async function seedReplies(
  prisma: PrismaClient,
  users: Record<string, User>,
): Promise<void> {
  const existing = await prisma.reply.count();
  if (existing > 0) {
    console.log(
      `• Replies already present (${existing}); skipping reply seed.`,
    );
    return;
  }

  const tickets = await prisma.ticket.findMany({
    where: { userId: users.user1.id, deletedAt: null },
    orderBy: { id: "asc" },
    take: 2,
  });

  if (tickets.length === 0) {
    console.log("• No tickets for user1; skipping reply seed.");
    return;
  }

  const data = [
    {
      ticketId: tickets[0].id,
      description:
        "Thanks for reporting this. We've reproduced the issue and are investigating.",
    },
    {
      ticketId: tickets[0].id,
      description:
        "A fix is being rolled out. Please try again and let us know.",
    },
  ];

  if (tickets[1]) {
    data.push({
      ticketId: tickets[1].id,
      description:
        "Could you share the exact document size that fails? It will help us narrow it down.",
    });
  }

  await prisma.reply.createMany({ data });
  console.log(`✓ Seeded ${data.length} sample replies.`);
}
