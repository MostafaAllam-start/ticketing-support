import { copyFile, mkdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import type { PrismaClient, User } from "../../app/generated/prisma/client";

// One diagnostic report: the issue an engineer/reviewer/consultant identified and
// the solution they applied. `author` is a sample-user key (e.g. "engineer1");
// `attachments` are public/ image paths copied in as the report's attachments.
type Report = {
  author: string;
  issue: string;
  solution: string;
  attachments?: string[];
};

// A set of reports plus a distinctive, case-insensitive substring used to find
// their ticket by title (matching a phrase, not the exact title, keeps the set
// bound to the right ticket even if wording drifts). A ticket can accumulate more
// than one report over its lifetime.
type ReportSet = { match: string; reports: Report[] };

const REPORT_SETS: ReportSet[] = [
  {
    match: "upload documents",
    reports: [
      {
        author: "engineer1",
        issue:
          "The API gateway rejected uploads above its 10 MB body limit, returning a generic 500 instead of a clear error.",
        solution:
          "Raised the gateway upload limit to 50 MB and added a friendly client-side message when a file is too large.",
        attachments: ["CTC.webp"],
      },
    ],
  },
  {
    match: "search returns no results",
    reports: [
      {
        author: "engineer2",
        issue:
          "The search indexer skipped documents larger than 10 MB, so they never made it into the index.",
        solution:
          "Removed the size cap on indexing and re-indexed the affected set; large documents now appear in results.",
      },
    ],
  },
  {
    match: "workflow approval stuck",
    reports: [
      {
        author: "engineer2",
        issue:
          "The approval step's notification webhook was disabled, so approvers were never told an item awaited them.",
        solution:
          "Re-enabled the webhook and added a health check that alerts if it is disabled again.",
      },
    ],
  },
  {
    match: "redirect loop",
    reports: [
      {
        author: "consultant1",
        issue:
          "Clock skew between the app server and the identity provider invalidated SSO tokens immediately, causing a redirect loop.",
        solution:
          "Enabled NTP time sync on the app servers and added a small token clock-skew tolerance.",
      },
    ],
  },
  {
    match: "permissions not applied",
    reports: [
      {
        author: "engineer1",
        issue:
          "ACL inheritance was only computed for the first nesting level, so subfolders kept stale permissions.",
        solution:
          "Made permission propagation recursive and back-filled inherited ACLs on existing subfolders.",
      },
    ],
  },
  {
    match: "report export is blank",
    reports: [
      {
        author: "engineer1",
        issue:
          "The PDF renderer timed out before the first page flushed, producing a zero-page file.",
        solution:
          "Increased the render timeout and now stream pages as they finish so the export is never blank.",
        attachments: ["logo-filled.png", "icon-128.png"],
      },
      {
        author: "reviewer1",
        issue:
          "Verified the fix against the largest report templates to confirm the timeout no longer triggers.",
        solution:
          "All templates export with content; closing the ticket once the change ships to production.",
      },
    ],
  },
];

// Seeds diagnostic reports (issue + solution) across the demo tickets so the
// ticket-details view (user surface and dashboard) shows realistic reports,
// including a ticket with more than one. Idempotent: skips if any reports exist.
export async function seedReports(
  prisma: PrismaClient,
  users: Record<string, User>,
): Promise<void> {
  const existing = await prisma.ticketReport.count();
  if (existing > 0) {
    console.log(
      `• Ticket reports already present (${existing}); skipping report seed.`,
    );
    return;
  }

  const tickets = await prisma.ticket.findMany({
    where: { deletedAt: null },
    select: { id: true, title: true },
    orderBy: { id: "asc" },
  });

  let reports = 0;
  let attachments = 0;
  let bound = 0;
  const used = new Set<number>();

  for (const set of REPORT_SETS) {
    // Bind each set to the first not-yet-used ticket whose title contains the
    // set's distinctive phrase (case-insensitive).
    const needle = set.match.toLowerCase();
    const ticket = tickets.find(
      (t) => !used.has(t.id) && t.title.toLowerCase().includes(needle),
    );
    if (!ticket) continue; // no matching ticket in this database; skip the set
    used.add(ticket.id);

    for (const report of set.reports) {
      const author = users[report.author];
      if (!author) continue;
      const created = await prisma.ticketReport.create({
        data: {
          ticketId: ticket.id,
          userId: author.id,
          issue: report.issue,
          solution: report.solution,
        },
      });
      reports++;

      // Attachments are polymorphic (entity_type "ticket_report"); copy the demo
      // images into the report's uploads folder and link them.
      const urls = await copyReportAttachments(created.id, report.attachments);
      if (urls.length > 0) {
        await prisma.attachment.createMany({
          data: urls.map((url) => ({
            url,
            entityType: "ticket_report" as const,
            entityId: created.id,
          })),
        });
        attachments += urls.length;
      }
    }
    bound++;
  }

  console.log(
    `✓ Seeded ${reports} ticket reports (${attachments} attachments) across ${bound} tickets.`,
  );
}

// Copies the given public/ images into uploads/reports/<reportId>/ (the same
// managed storage dir ticket/reply uploads use, served via /uploads/[...path])
// and returns their public urls. Returns [] when there are no sources.
async function copyReportAttachments(
  reportId: number,
  sources: string[] = [],
): Promise<string[]> {
  if (sources.length === 0) return [];
  const dir = path.join(process.cwd(), "uploads", "reports", String(reportId));
  await mkdir(dir, { recursive: true });

  const urls: string[] = [];
  for (const source of sources) {
    const ext = path.extname(source) || ".bin";
    const name = `${randomUUID()}${ext}`;
    await copyFile(path.join(process.cwd(), "public", source), path.join(dir, name));
    urls.push(`/uploads/reports/${reportId}/${name}`);
  }
  return urls;
}
