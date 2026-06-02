import { readFile } from "node:fs/promises";
import path from "node:path";
import { STORAGE_ROOT } from "@/lib/storage";

const CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

// Serves files from the app-managed storage dir. Next's static handler does not
// serve files written to /public at runtime, so uploaded images are streamed
// through here instead. Path traversal is blocked by resolving the target and
// confirming it stays under STORAGE_ROOT.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;
  const target = path.resolve(STORAGE_ROOT, ...segments);

  if (target !== STORAGE_ROOT && !target.startsWith(STORAGE_ROOT + path.sep)) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const data = await readFile(target);
    const type =
      CONTENT_TYPES[path.extname(target).toLowerCase()] ??
      "application/octet-stream";
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
