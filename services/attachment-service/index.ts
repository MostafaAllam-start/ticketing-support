import { Service } from "../service";
import type {
  Attachment,
  AttachmentEntityType,
} from "@/app/generated/prisma/client";

// Attachments use a polymorphic association (entity_type + entity_id) since an
// uploaded file can belong to a ticket, reply, suggestion, or complaint. Prisma
// can't model that with a real relation, so it is resolved here in app code.
export class AttachmentService extends Service {
  // Links stored file urls to an entity.
  async attach(
    entityType: AttachmentEntityType,
    entityId: number,
    urls: string[],
  ): Promise<void> {
    if (urls.length === 0) return;
    await this.prisma.attachment.createMany({
      data: urls.map((url) => ({ url, entityType, entityId })),
    });
  }

  // All attachments for one entity, oldest first.
  forEntity(
    entityType: AttachmentEntityType,
    entityId: number,
  ): Promise<Attachment[]> {
    return this.prisma.attachment.findMany({
      where: { entityType, entityId },
      orderBy: { id: "asc" },
    });
  }

  // Attachments for many entities of one type, grouped as an id -> attachments
  // map (entities with none are absent). Lets a list view (e.g. a reply thread)
  // load every item's attachments in one query.
  async forEntities(
    entityType: AttachmentEntityType,
    entityIds: number[],
  ): Promise<Map<number, Attachment[]>> {
    const map = new Map<number, Attachment[]>();
    if (entityIds.length === 0) return map;
    const rows = await this.prisma.attachment.findMany({
      where: { entityType, entityId: { in: entityIds } },
      orderBy: { id: "asc" },
    });
    for (const row of rows) {
      const group = map.get(row.entityId) ?? [];
      group.push(row);
      map.set(row.entityId, group);
    }
    return map;
  }
}

export const attachmentService = new AttachmentService();
