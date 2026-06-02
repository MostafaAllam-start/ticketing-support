import { Skeleton } from "@/components/ui/skeleton";

// Placeholder for the tickets table while the server component fetches the
// user's tickets. Mirrors the column layout of MyTicketsTable.
export function TicketsTableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="rounded-lg border">
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-full max-w-64" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="ms-auto h-4 w-6" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-4" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Placeholder for a single ticket's details + replies while it loads.
export function TicketDetailSkeleton() {
  return (
    <>
      <article className="rounded-xl border p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-6 w-64" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="mt-5 grid gap-y-2 sm:grid-cols-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="mt-5 space-y-2 border-t pt-5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </article>

      <section className="mt-8">
        <Skeleton className="mb-3 h-6 w-28" />
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </section>
    </>
  );
}
