import { Link } from "@/i18n/navigation";
import { companyService, userService } from "@/services";
import { brandCompanyId } from "@/lib/auth/guards";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { UserMenu } from "@/components/user-menu";
import { CompanySwitcher } from "@/components/company-switcher";
import { MySuggestionsLink } from "@/components/my-suggestions-link";

// Top bar for the authenticated "user" surface (/tickets and ticket details).
// `nav` controls the cross-link button: on the suggestions page we point back
// to tickets instead of repeating the page the user is already on.
export async function TicketsHeader({
  nav = "suggestions",
}: {
  nav?: "suggestions" | "tickets";
} = {}) {
  const me = await userService.currentUser();
  const companies = await companyService.list();
  const currentCompanyId = await brandCompanyId();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-4">
        <Link href="/" aria-label="CTC Support">
          <Logo imageClassName="h-7" />
        </Link>
        <div className="ms-auto flex items-center gap-2">
          <CompanySwitcher
            companies={companies.map((c) => ({ id: c.id, name: c.name }))}
            currentCompanyId={currentCompanyId}
          />
          {me && <MySuggestionsLink variant={nav} />}
          <ThemeToggle />
          <LocaleSwitcher />
          {me && (
            <UserMenu
              name={me.name}
              username={me.username}
              image={me.image}
            />
          )}
        </div>
      </div>
    </header>
  );
}
