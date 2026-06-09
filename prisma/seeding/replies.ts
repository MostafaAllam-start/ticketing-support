import type { PrismaClient, User } from "../../app/generated/prisma/client";

// One message in a seeded thread. `author` is a sample-user key (e.g. "reviewer1")
// and `replyTo`, when set, is the 0-based index of an earlier message in the same
// thread — turning this message into a nested (threaded) reply to it.
type Message = { author: string; text: string; replyTo?: number };

// An authored support conversation plus a distinctive, case-insensitive substring
// used to find its ticket by title. Matching on a phrase (rather than the exact
// title) keeps threads bound to the right ticket even if wording drifts — e.g.
// "Cannot upload documents to ECM" vs "...to SAP". Threads stay one level deep
// (every `replyTo` points at a top-level message), mirroring the app's own
// reply-threading rule.
type Thread = { match: string; messages: Message[] };

const THREADS: Thread[] = [
  {
    match: "upload documents",
    messages: [
      {
        author: "reviewer1",
        text: "Thanks for reporting this. We've reproduced the issue and are investigating.",
      },
      {
        author: "user1",
        text: "Appreciate the quick response — let me know if you need any more details from my side.",
      },
      {
        author: "engineer1",
        text: "The 500 is coming from the gateway's upload size limit. A fix is being rolled out — please try again and let us know how it goes.",
      },
      {
        author: "user1",
        text: "Confirmed working on my end now. Thank you!",
        replyTo: 2,
      },
    ],
  },
  {
    match: "search returns no results",
    messages: [
      {
        author: "engineer1",
        text: "Could you share the exact document title that isn't showing up? It will help us narrow it down.",
      },
      {
        author: "user2",
        text: "Sure — 'Q2 Vendor Agreement'. It was indexed last week but never appears in results.",
        replyTo: 0,
      },
      {
        author: "engineer2",
        text: "Found it: the search index was skipping documents above 10 MB. Re-indexing the affected set now.",
      },
      {
        author: "user2",
        text: "It's back in the results. Much appreciated!",
      },
    ],
  },
  {
    match: "workflow approval stuck",
    messages: [
      {
        author: "reviewer1",
        text: "Marking this as resolved — the approval step's notification was misconfigured.",
      },
      {
        author: "engineer2",
        text: "Root cause was a disabled webhook on the approval step; re-enabled it and verified the flow end to end.",
      },
      {
        author: "user1",
        text: "Great, approvals are sending notifications again. Thanks for the fix!",
        replyTo: 1,
      },
    ],
  },
  {
    match: "redirect loop",
    messages: [
      {
        author: "reviewer1",
        text: "Which browser and identity provider are you using when the loop happens?",
      },
      {
        author: "user2",
        text: "Chrome with Azure AD. It loops right after I enter my password.",
        replyTo: 0,
      },
      {
        author: "reviewer1",
        text: "Thanks — that points to a clock-skew issue on the token. We're applying a tolerance fix.",
      },
    ],
  },
  {
    match: "permissions not applied",
    messages: [
      {
        author: "reviewer1",
        text: "Thanks for the report — we're checking how ACL inheritance is applied to subfolders.",
      },
      {
        author: "user1",
        text: "For context, it only happens on folders nested two or more levels deep.",
        replyTo: 0,
      },
    ],
  },
  {
    match: "report export is blank",
    messages: [
      {
        author: "reviewer1",
        text: "Does the blank export happen for every report or just one template?",
      },
      {
        author: "user2",
        text: "Every template so far — the file downloads but has no pages.",
        replyTo: 0,
      },
      {
        author: "engineer1",
        text: "Reproduced. The PDF renderer is timing out before the first page flushes; raising the timeout.",
      },
    ],
  },
];

// Seeds the conversations above across user1/user2's tickets so the ticket-details
// view (both the user surface and the dashboard) shows realistic two-/three-party
// threads — reporter, reviewer, and the assigned engineer — including nested
// replies. Idempotent: skips if any replies already exist.
export async function seedReplies(
  prisma: PrismaClient,
  users: Record<string, User>,
): Promise<void> {
  const existing = await prisma.reply.count();
  if (existing > 0) {
    console.log(
      `• Replies already present (${existing}); skipping reply seed.`,
    );
    return;
  }

  const tickets = await prisma.ticket.findMany({
    where: { deletedAt: null },
    select: { id: true, title: true },
    orderBy: { id: "asc" },
  });

  let replies = 0;
  let threads = 0;
  const used = new Set<number>();

  for (const thread of THREADS) {
    // Bind each thread to the first not-yet-used ticket whose title contains the
    // thread's distinctive phrase (case-insensitive).
    const needle = thread.match.toLowerCase();
    const ticket = tickets.find(
      (t) => !used.has(t.id) && t.title.toLowerCase().includes(needle),
    );
    if (!ticket) continue; // no matching ticket in this database; skip the thread
    used.add(ticket.id);

    // Replies are created one at a time so a nested reply can reference the
    // generated id of an earlier message in the same thread.
    const createdIds: number[] = [];
    for (const message of thread.messages) {
      const author = users[message.author];
      if (!author) {
        createdIds.push(0); // keep indexes aligned for `replyTo`
        continue;
      }
      const parentReplyId =
        message.replyTo != null ? createdIds[message.replyTo] : undefined;
      const created = await prisma.reply.create({
        data: {
          entityType: "ticket",
          entityId: ticket.id,
          userId: author.id,
          description: message.text,
          parentReplyId: parentReplyId || undefined,
        },
      });
      createdIds.push(created.id);
      replies++;
    }
    threads++;
  }

  console.log(`✓ Seeded ${replies} sample replies across ${threads} ticket threads.`);
}
