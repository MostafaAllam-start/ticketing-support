import { prisma } from "@/lib/prisma";
import type { PrismaClient } from "@/app/generated/prisma/client";

// Base class for all domain services. Holds the shared Prisma client; the client
// is injectable so services can be unit-tested against a mock or a transaction.
export abstract class Service {
  protected readonly prisma: PrismaClient;

  constructor(client: PrismaClient = prisma) {
    this.prisma = client;
  }
}
