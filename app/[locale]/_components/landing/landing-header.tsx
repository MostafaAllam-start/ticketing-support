import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { userService } from "@/services";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleSwitcher } from "@/components/locale-switcher";

export async function LandingHeader() {
  const t = await getTranslations("Landing");
  // Signed-in "user" visitors (privileged roles are redirected to the dashboard
  // before reaching the landing page) get a link to their tickets instead of the
  // sign-in / sign-up CTAs.
  const me = await userService.currentUser();
  const nav = [
    { href: "#about", label: t("nav.about") },
    { href: "#team", label: t("nav.team") },
    { href: "#partners", label: t("nav.partners") },
    { href: "#contact", label: t("nav.contact") },
  ];

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Logo badge={false} imageClassName="h-7" />
        <nav className="ms-6 hidden items-center gap-6 text-sm md:flex">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="ms-auto flex items-center gap-2">
          <ThemeToggle />
          <LocaleSwitcher />
          {me ? (
            <Button asChild size="sm">
              <Link href="/tickets">{t("cta.myTickets")}</Link>
            </Button>
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="hidden sm:inline-flex"
              >
                <Link href="/login">{t("cta.signIn")}</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">{t("cta.getStarted")}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
