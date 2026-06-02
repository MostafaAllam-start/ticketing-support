import { getTranslations } from "next-intl/server";
import { teamMemberService } from "@/services";
import { type ContactCard } from "../../contact-info/_components/contact-card";
import { TeamMemberCard, type TeamContact } from "./team-member-card";

export async function LandingTeam() {
  const t = await getTranslations("Landing");
  const members = await teamMemberService.listWithContacts();

  // For each member, the always-shown display info and — only when the linked
  // user opted in (hasContactInfoCard) — a full contact object that powers the
  // click-to-open contact modal.
  const cards = members.map((member) => {
    const user = member.user;
    const display: TeamContact = {
      id: member.id,
      name: member.name,
      position: member.position,
      image: member.image,
    };
    const company = user?.projectMemberships[0]?.project.company ?? null;
    const contact: ContactCard | null =
      user && user.hasContactInfoCard
        ? {
            id: user.id,
            name: member.name,
            position: member.position,
            image: member.image,
            email: user.email,
            jobTitle: user.jobTitle,
            website: user.website,
            whatsapp: user.whatsapp,
            linkedin: user.linkedin,
            company: company
              ? {
                  name: company.name,
                  logo: company.logo,
                  websiteUrl: company.websiteUrl,
                }
              : null,
          }
        : null;
    return { display, contact };
  });

  return (
    <section id="team" className="scroll-mt-16 border-b py-20">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
            {t("team.title")}
          </h2>
          <p className="mt-2 text-muted-foreground">{t("team.subtitle")}</p>
        </div>

        {cards.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            {t("team.empty")}
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map(({ display, contact }) => (
              <TeamMemberCard
                key={display.id}
                member={display}
                contact={contact}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
