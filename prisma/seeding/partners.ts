import type { PrismaClient } from "../../app/generated/prisma/client";

// Demo partners shown on the landing "Partners" section. Logos point at a
// placeholder image service — swap for real logo URLs/paths later. Skips seeding
// if any partners already exist.
const PARTNERS = [
  {
    name: "Northwind",
    logo: "https://placehold.co/240x120?text=Northwind",
    details: "Document management integrations for the enterprise.",
  },
  {
    name: "Acme Corp",
    logo: "https://placehold.co/240x120?text=Acme+Corp",
    details: "Workflow automation and approval pipelines.",
  },
  {
    name: "Globex",
    logo: "https://placehold.co/240x120?text=Globex",
    details: "Secure cloud storage and content delivery.",
  },
  {
    name: "Initech",
    logo: "https://placehold.co/240x120?text=Initech",
    details: "Reporting and analytics for support teams.",
  },
  {
    name: "Umbrella",
    logo: "https://placehold.co/240x120?text=Umbrella",
    details: "Identity and single sign-on services.",
  },
  {
    name: "Soylent",
    logo: "https://placehold.co/240x120?text=Soylent",
    details: "Full-text search and indexing infrastructure.",
  },
];

export async function seedPartners(prisma: PrismaClient): Promise<void> {
  const existing = await prisma.partner.count();
  if (existing > 0) {
    console.log(`• Partners already present (${existing}); skipping partner seed.`);
    return;
  }

  await prisma.partner.createMany({ data: PARTNERS });
  console.log(`✓ Seeded ${PARTNERS.length} partners.`);
}
