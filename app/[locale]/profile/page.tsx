import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireUser } from "@/lib/auth/guards";
import { TicketsHeader } from "../tickets/_components/tickets-header";
import { ProfileForm } from "./_components/profile-form";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser();
  const t = await getTranslations("Profile");

  return (
    <div className="flex min-h-dvh flex-col">
      <TicketsHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        <div className="mb-6 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <ProfileForm
          user={{
            name: user.name,
            username: user.username,
            email: user.email,
            jobTitle: user.jobTitle,
            image: user.image,
            website: user.website,
            whatsapp: user.whatsapp,
            linkedin: user.linkedin,
          }}
        />
      </main>
    </div>
  );
}
