import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Locale-aware navigation APIs. Use these instead of next/navigation so links
// and redirects keep the active locale prefix (/en, /ar).
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
