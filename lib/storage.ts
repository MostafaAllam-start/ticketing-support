import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

// Uploaded files live in an app-managed storage dir (NOT public/, which Next's
// static handler won't serve for files added at runtime) and are served through
// the /uploads/[...path] route handler.
export const STORAGE_ROOT = path.join(process.cwd(), "uploads");
const TICKET_DIR = path.join(STORAGE_ROOT, "tickets");
const PUBLIC_PREFIX = "/uploads/tickets";

// Keep within the Server Action body limit (see next.config.ts).
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB per image
export const MAX_IMAGES = 8;

const EXT_BY_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

// Pulls non-empty image files out of a multipart field. Empty file inputs submit
// a zero-byte File which we drop.
export function readImageFiles(formData: FormData, field = "images"): File[] {
  return formData
    .getAll(field)
    .filter((v): v is File => v instanceof File && v.size > 0);
}

// Validates the selection up-front (no disk writes) so a bad upload is rejected
// before the ticket is created. Throws a user-facing message on the first issue.
export function assertValidImages(files: File[]): void {
  if (files.length > MAX_IMAGES) {
    throw new Error(`You can attach at most ${MAX_IMAGES} images.`);
  }
  for (const file of files) {
    if (!EXT_BY_TYPE[file.type]) {
      throw new Error("Only PNG, JPEG, WebP, or GIF images are allowed.");
    }
    if (file.size > MAX_BYTES) {
      throw new Error("Each image must be 5 MB or smaller.");
    }
  }
}

// Writes the (already validated) images to disk and returns their public paths.
export async function saveImages(files: File[]): Promise<string[]> {
  if (files.length === 0) return [];
  await mkdir(TICKET_DIR, { recursive: true });

  const paths: string[] = [];
  for (const file of files) {
    const ext = EXT_BY_TYPE[file.type] ?? "bin";
    const name = `${randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(TICKET_DIR, name), buffer);
    paths.push(`${PUBLIC_PREFIX}/${name}`);
  }
  return paths;
}
