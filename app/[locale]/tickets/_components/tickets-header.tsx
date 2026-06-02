import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { signOutAction } from "../actions";

// Top bar for the authenticated "user" surface (/tickets and ticket details).
export async function TicketsHeader() {
  const t = await getTranslations("Tickets");

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-4">
        <Link href="/" aria-label="ECM Support">
          <Logo imageClassName="h-7" />
        </Link>
        <div className="ms-auto flex items-center gap-2">
          <ThemeToggle />
          <LocaleSwitcher />
          <form action={signOutAction}>
            <Button variant="ghost" size="sm" type="submit">
              {t("signOut")}
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
