import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { join } from "node:path";

// Uploaded user / team-member photos are written here and served from the public
// URL prefix below (anything under /public is served at the site root).
const UPLOAD_DIR = join(process.cwd(), "public", "users-images");
const PUBLIC_PREFIX = "/users-images";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

// Allowed image MIME types mapped to the extension we save under. We derive the
// extension from the (browser-reported) type rather than trusting the original
// filename, and name files with a random UUID — avoiding collisions and any
// path-traversal from user-supplied names.
const MIME_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const ACCEPTED_IMAGE_TYPES = Object.keys(MIME_EXT);

// Persists an uploaded image to /public/users-images and returns its public path
// (e.g. "/users-images/<uuid>.png"). Throws a user-facing Error when the file's
// type or size is not allowed.
export async function saveUserImage(file: File): Promise<string> {
  const ext = MIME_EXT[file.type];
  if (!ext) {
    throw new Error("Unsupported image type. Use PNG, JPG, WEBP, or GIF.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Image is too large. Maximum size is 5 MB.");
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${randomUUID()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(join(UPLOAD_DIR, filename), bytes);

  return `${PUBLIC_PREFIX}/${filename}`;
}
