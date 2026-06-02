import bcrypt from "bcryptjs";
import type { PrismaClient, Role } from "../../app/generated/prisma/client";
import type { RoleName } from "./roles";

const BCRYPT_ROUNDS = 12;

// Admin account is configurable via env vars so the password is never committed.
// Read at call time (not module load) so load order can't outrun dotenv.
function adminConfig() {
  return {
    name: process.env.ADMIN_NAME ?? "Administrator",
    username: process.env.ADMIN_USERNAME ?? "admin",
    email: process.env.ADMIN_EMAIL ?? "admin@example.com",
    password: process.env.ADMIN_PASSWORD ?? "Admin@123",
    jobTitle: process.env.ADMIN_JOB_TITLE ?? "System Administrator",
  };
}

// Seeds the default users. Currently the admin account: created with a
// bcrypt-hashed password and linked to the `admin` role. Idempotent on
// `username`.
export async function seedUsers(
  prisma: PrismaClient,
  roles: Record<RoleName, Role>,
): Promise<void> {
  const config = adminConfig();
  const passwordHash = await bcrypt.hash(config.password, BCRYPT_ROUNDS);

  const admin = await prisma.user.upsert({
    where: { username: config.username },
    update: { roleId: roles.admin.id },
    create: {
      name: config.name,
      username: config.username,
      email: config.email,
      password: passwordHash,
      roleId: roles.admin.id,
      jobTitle: config.jobTitle,
    },
  });

  console.log(`✓ Seeded admin user: ${admin.username} <${admin.email}>`);

  if (!process.env.ADMIN_PASSWORD) {
    console.warn(
      "⚠ Using the default admin password. Set ADMIN_PASSWORD in .env and re-run for a real deployment.",
    );
  }
}
