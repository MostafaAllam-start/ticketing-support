import type { PrismaClient, User } from "../../app/generated/prisma/client";

// Demo team members shown on the landing "Our Team" section. Photos point at a
// placeholder avatar service — swap for real images later. Two members are linked
// to existing sample users to exercise the optional user relation. Skips seeding
// if any team members already exist.
export async function seedTeamMembers(
  prisma: PrismaClient,
  users: Record<string, User>,
): Promise<void> {
  const existing = await prisma.teamMember.count();
  if (existing > 0) {
    console.log(
      `• Team members already present (${existing}); skipping team seed.`,
    );
    return;
  }

  const data = [
    {
      name: "Sarah Johnson",
      position: "Head of Support",
      image: "https://i.pravatar.cc/160?img=5",
      userId: null,
    },
    {
      name: "Omar Haddad",
      position: "Lead Engineer",
      image: "https://i.pravatar.cc/160?img=12",
      userId: users.engineer1?.id ?? null,
    },
    {
      name: "Mei Lin",
      position: "QA Reviewer",
      image: "https://i.pravatar.cc/160?img=32",
      userId: users.reviewer1?.id ?? null,
    },
    {
      name: "Carlos Ruiz",
      position: "Customer Success",
      image: "https://i.pravatar.cc/160?img=15",
      userId: null,
    },
  ];

  await prisma.teamMember.createMany({ data });
  console.log(`✓ Seeded ${data.length} team members.`);
}
