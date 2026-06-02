import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/logo";

export async function LandingFooter() {
  const t = await getTranslations("Landing");

  return (
    <footer className="border-t py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-center sm:flex-row sm:text-start">
        <div className="flex items-center gap-3">
          <Logo badge={false} imageClassName="h-6" />
          <span className="text-sm text-muted-foreground">
            {t("footer.tagline")}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{t("footer.rights")}</p>
      </div>
    </footer>
  );
}
