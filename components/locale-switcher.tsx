"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export function LocaleSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("LocaleSwitcher");

  function switchLocale(next: string) {
    if (next === locale) return;
    // Re-renders the current page in the chosen locale (keeps the same route).
    router.replace(pathname, { locale: next });
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border bg-background p-0.5 text-xs font-medium",
        className,
      )}
    >
      {routing.locales.map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => switchLocale(loc)}
          aria-current={loc === locale}
          className={cn(
            "rounded-full px-3 py-1 transition-colors",
            loc === locale
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t(loc)}
        </button>
      ))}
    </div>
  );
}
