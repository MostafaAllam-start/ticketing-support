import { Skeleton } from "@/components/ui/skeleton";

// Shown in the content area (the sidebar + header in the layout stay put) while
// the next dashboard page's data loads during navigation. Mirrors the common
// page shape: a header (title + subtitle + action) above a list/table panel.
export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      <div className="rounded-lg border">
        {/* Header row */}
        <div className="border-b px-4 py-3">
          <Skeleton className="h-4 w-40" />
        </div>
        {/* Body rows */}
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center justify-between gap-4 border-b px-4 py-3.5 last:border-0"
          >
            <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="hidden h-4 w-1/5 sm:block" />
            <Skeleton className="hidden h-4 w-20 md:block" />
            <Skeleton className="ms-auto h-8 w-8 shrink-0 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
