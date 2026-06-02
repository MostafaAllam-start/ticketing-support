"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/logo";

// A brief, branded intro (the original design's "welcome card"): a spinning ring
// around the logo, a loader, and a short auto-advancing countdown that the user
// can skip. Calls `onContinue` when the countdown reaches zero or on click.
export function WelcomeSplash({
  onContinue,
  seconds = 5,
}: {
  onContinue: () => void;
  seconds?: number;
}) {
  const t = useTranslations("ContactCard");
  const [counter, setCounter] = useState(seconds);

  useEffect(() => {
    if (counter <= 0) {
      onContinue();
      return;
    }
    const id = setInterval(() => setCounter((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [counter, onContinue]);

  return (
    <div className="w-full space-y-6 rounded-2xl border bg-card/95 px-8 py-10 text-center shadow-xl backdrop-blur-sm">
      {/* Spinning ring around a static, legible logo */}
      <div className="relative mx-auto flex size-36 items-center justify-center">
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-dashed border-primary/40 [animation-duration:6s]" />
        <span className="absolute inset-2 rounded-full border border-primary/15" />
        <Logo badge imageClassName="h-10" />
      </div>

      <div className="space-y-1">
        <h1 className="text-lg font-bold tracking-tight">
          {t("welcome.platformName")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("welcome.tagline")}</p>
      </div>

      {/* Loader (CSS dots — no Lottie dependency) */}
      <div className="flex items-center justify-center gap-1.5" aria-hidden>
        <span className="size-2 animate-bounce rounded-full bg-primary/60 [animation-delay:-0.3s]" />
        <span className="size-2 animate-bounce rounded-full bg-primary/60 [animation-delay:-0.15s]" />
        <span className="size-2 animate-bounce rounded-full bg-primary/60" />
      </div>

      <p className="mx-auto max-w-xs text-sm font-medium text-foreground/80">
        {t("welcome.intro")}
      </p>

      <button
        type="button"
        onClick={onContinue}
        className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg bg-gradient-to-r from-primary to-primary/80 px-4 py-3 font-medium text-primary-foreground shadow-lg transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <span className="inline-flex items-center gap-2">
          {t("welcome.getStarted")}
          <ArrowRight className="size-4 rtl:rotate-180" />
        </span>
        <span
          className="flex size-7 items-center justify-center rounded-full bg-background text-sm font-semibold text-primary tabular-nums"
          aria-hidden
        >
          {counter}
        </span>
      </button>
    </div>
  );
}
