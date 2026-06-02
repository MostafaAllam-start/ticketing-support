import Image from "next/image";
import logo from "@/public/logo-filled.png";
import { cn } from "@/lib/utils";

// The ECM logo. By default it sits in a white "badge" so the metallic wordmark
// stays legible on any surface (invisible on white, a clean chip on dark/colored
// backgrounds). Pass `badge={false}` to render the bare image.
export function Logo({
  className,
  imageClassName,
  badge = true,
}: {
  className?: string;
  imageClassName?: string;
  badge?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center",
        badge && "rounded-md bg-white p-1.5",
        className,
      )}
    >
      <Image
        src={logo}
        alt="ECM + Business Suite"
        priority
        className={cn("h-8 w-auto", imageClassName)}
      />
    </span>
  );
}
