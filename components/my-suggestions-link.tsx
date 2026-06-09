import { getTranslations } from "next-intl/server";
import { Lightbulb, Ticket } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

// Header link toggling a signed-in user between their tickets and suggestions.
// On the suggestions page we point back to tickets (and vice versa) so the
// button always offers the surface the user isn't currently on.
export async function MySuggestionsLink({
  variant = "suggestions",
}: {
  variant?: "suggestions" | "tickets";
}) {
  const t = await getTranslations("Common");
  const toTickets = variant === "tickets";
  return (
    <Button asChild variant="outline" size="sm">
      <Link href={toTickets ? "/tickets" : "/suggestions"}>
        {toTickets ? <Ticket /> : <Lightbulb />}
        {toTickets ? t("myTickets") : t("mySuggestions")}
      </Link>
    </Button>
  );
}
