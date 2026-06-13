"use client";

import type { ReactNode } from "react";
import { useRouter } from "@/i18n/navigation";
import { TableRow } from "@/components/ui/table";

// A dashboard complaint row that opens the complaint's detail page on
// double-click. Keyboard users can focus the row and press Enter/Space.
// Double-clicks (or key presses) that originate inside an interactive control —
// e.g. the #id/title/ticket links — are ignored so they don't also trigger
// navigation.
export function ComplaintRow({
  id,
  label,
  children,
}: {
  id: number;
  label?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const open = () => router.push(`/dashboard/complaints/${id}`);

  const fromControl = (target: EventTarget | null) =>
    target instanceof Element &&
    target.closest("button, a, input, select, [role='menu']") !== null;

  return (
    <TableRow
      role="link"
      tabIndex={0}
      aria-label={label}
      onDoubleClick={(event) => {
        if (fromControl(event.target)) return;
        open();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        if (fromControl(event.target)) return;
        event.preventDefault();
        open();
      }}
      className="cursor-pointer select-none"
    >
      {children}
    </TableRow>
  );
}
