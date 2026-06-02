import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../app/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

// Shared Prisma client for all seeders: a single connection is created here and
// reused across the seeding modules. `seed.ts` owns disconnecting it.
export const prisma = new PrismaClient({ adapter });
