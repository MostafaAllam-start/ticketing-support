import { setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { userService } from "@/services";
import { isPrivileged } from "@/lib/auth/guards";
import { LandingHeader } from "./_components/landing/landing-header";
import { LandingHero } from "./_components/landing/landing-hero";
import { LandingAbout } from "./_components/landing/landing-about";
import { LandingTeam } from "./_components/landing/landing-team";
import { LandingPartners } from "./_components/landing/landing-partners";
import { LandingContact } from "./_components/landing/landing-contact";
import { LandingFooter } from "./_components/landing/landing-footer";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Privileged roles get the dashboard; anonymous visitors and the "user" role
  // see the public landing page.
  const user = await userService.currentUser();
  if (user && isPrivileged(user.role.name)) {
    redirect({ href: "/dashboard", locale });
  }

  return (
    <div className="flex min-h-screen flex-col">
      <LandingHeader />
      <main className="flex-1">
        <LandingHero />
        <LandingAbout />
        <LandingTeam />
        <LandingPartners />
        <LandingContact />
      </main>
      <LandingFooter />
    </div>
  );
}
