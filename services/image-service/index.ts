import { Service } from "../service";
import type { Image, ImageEntityType } from "@/app/generated/prisma/client";

// Images use a polymorphic association (entity_type + entity_id) since an image
// can belong to either a ticket or a reply. Prisma can't model that with a real
// relation, so it is resolved here in application code.
export class ImageService extends Service {
  // Links stored image paths to an entity.
  async attach(
    entityType: ImageEntityType,
    entityId: number,
    paths: string[],
  ): Promise<void> {
    if (paths.length === 0) return;
    await this.prisma.image.createMany({
      data: paths.map((path) => ({ path, entityType, entityId })),
    });
  }

  // All images for one entity, oldest first.
  forEntity(entityType: ImageEntityType, entityId: number): Promise<Image[]> {
    return this.prisma.image.findMany({
      where: { entityType, entityId },
      orderBy: { id: "asc" },
    });
  }
}

export const imageService = new ImageService();
