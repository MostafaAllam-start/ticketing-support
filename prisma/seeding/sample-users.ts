import bcrypt from "bcryptjs";
import type {
  PrismaClient,
  Role,
  User,
} from "../../app/generated/prisma/client";
import type { RoleName } from "./roles";

const BCRYPT_ROUNDS = 12;
const PASSWORD = "Password@123";

type SampleSpec = {
  name: string;
  username: string;
  email: string;
  role: RoleName;
  jobTitle?: string;
  website?: string;
  whatsapp?: string;
  linkedin?: string;
  // Whether this user has a public /contact-info card (defaults to false).
  contactCard?: boolean;
};

const SAMPLES: SampleSpec[] = [
  {
    name: "Evan Engineer",
    username: "engineer1",
    email: "engineer1@example.com",
    role: "software-engineer",
    jobTitle: "Software Engineer",
    website: "https://evanengineer.dev",
    whatsapp: "+962790000011",
    linkedin: "https://www.linkedin.com/in/evan-engineer",
    contactCard: true,
  },
  {
    name: "Erin Engineer",
    username: "engineer2",
    email: "engineer2@example.com",
    role: "software-engineer",
    jobTitle: "Software Engineer",
    website: "https://erinengineer.dev",
    whatsapp: "+962790000012",
    linkedin: "https://www.linkedin.com/in/erin-engineer",
  },
  {
    name: "Rana Reviewer",
    username: "reviewer1",
    email: "reviewer1@example.com",
    role: "reviewer",
    jobTitle: "QA Reviewer",
    website: "https://ranareviewer.dev",
    whatsapp: "+962790000021",
    linkedin: "https://www.linkedin.com/in/rana-reviewer",
    contactCard: true,
  },
  {
    name: "Uma User",
    username: "user1",
    email: "user1@example.com",
    role: "user",
    whatsapp: "+962790000031",
    linkedin: "https://www.linkedin.com/in/uma-user",
  },
  {
    name: "Sam Sample",
    username: "user2",
    email: "user2@example.com",
    role: "user",
    website: "https://samsample.example.com",
  },
];

// Seeds demo accounts (two engineers, one reviewer, two users) so the dashboard
// has data. All share the same dev password. Idempotent on `username`.
export async function seedSampleUsers(
  prisma: PrismaClient,
  roles: Record<RoleName, Role>,
): Promise<Record<string, User>> {
  const passwordHash = await bcrypt.hash(PASSWORD, BCRYPT_ROUNDS);
  const created: Record<string, User> = {};

  for (const spec of SAMPLES) {
    created[spec.username] = await prisma.user.upsert({
      where: { username: spec.username },
      // Backfill the contact fields on existing rows too, so re-seeding an older
      // database populates the columns added later.
      update: {
        roleId: roles[spec.role].id,
        website: spec.website ?? null,
        whatsapp: spec.whatsapp ?? null,
        linkedin: spec.linkedin ?? null,
        hasContactInfoCard: spec.contactCard ?? false,
      },
      create: {
        name: spec.name,
        username: spec.username,
        email: spec.email,
        password: passwordHash,
        roleId: roles[spec.role].id,
        jobTitle: spec.jobTitle,
        website: spec.website,
        whatsapp: spec.whatsapp,
        linkedin: spec.linkedin,
        hasContactInfoCard: spec.contactCard ?? false,
      },
    });
  }

  console.log(
    `✓ Seeded ${SAMPLES.length} sample users (password "${PASSWORD}"): ${SAMPLES.map((s) => s.username).join(", ")}`,
  );
  return created;
}
