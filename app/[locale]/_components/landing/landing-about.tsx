import { CheckCircle2 } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function LandingAbout() {
  const t = await getTranslations("Landing");
  const points = [t("about.point1"), t("about.point2"), t("about.point3")];

  return (
    <section id="about" className="scroll-mt-16 border-b py-20">
      <div className="mx-auto max-w-5xl px-4">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div className="space-y-4">
            <h2 className="text-3xl font-semibold tracking-tight">
              {t("about.title")}
            </h2>
            <p className="text-muted-foreground text-pretty">
              {t("about.body")}
            </p>
          </div>
          <ul className="space-y-3">
            {points.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
