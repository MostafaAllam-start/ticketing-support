"use client";

import type { ReactNode } from "react";
import { useRouter } from "@/i18n/navigation";
import { TableRow } from "@/components/ui/table";

// A row in the user's "My suggestions" list that opens the suggestion's detail
// page on double-click. Keyboard users can focus the row and press Enter/Space.
// Mirrors the dashboard SuggestionRow but links to the user-facing detail route.
export function SuggestionRow({
  id,
  label,
  children,
}: {
  id: number;
  label?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const open = () => router.push(`/suggestions/${id}`);

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
