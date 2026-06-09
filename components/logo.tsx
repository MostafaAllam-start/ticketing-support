import Image from "next/image";
import ctcLogo from "@/public/CTC.webp";
import ecmLogo from "@/public/logo-filled.png";
import { cn } from "@/lib/utils";
import type { BrandKey } from "@/lib/companies";

const LOGOS: Record<BrandKey, typeof ctcLogo> = {
  ctc: ctcLogo,
  ecm: ecmLogo,
};

// The brand logo. Defaults to CTC (the primary brand); pass `brand="ecm"` to show
// the ECM logo (used on the landing page for ECM users). The image has a
// transparent background, so it sits directly on any surface.
export function Logo({
  className,
  imageClassName,
  brand = "ctc",
}: {
  className?: string;
  imageClassName?: string;
  brand?: BrandKey;
}) {
  return (
    <span className={cn("inline-flex items-center", className)}>
      <Image
        src={LOGOS[brand]}
        alt={brand === "ecm" ? "ECM" : "CTC"}
        priority
        className={cn("h-8 w-auto", imageClassName)}
      />
    </span>
  );
}
