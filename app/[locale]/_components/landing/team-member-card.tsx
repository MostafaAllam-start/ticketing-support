"use client";

import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { type ContactCard } from "../../contact-info/_components/contact-card";
import { EmployeeCard } from "../../contact-info/_components/employee-card";

export type TeamContact = {
  id: number;
  name: string;
  position: string;
  image: string;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function TeamMemberCard({
  member,
  contact,
}: {
  member: TeamContact;
  // When null, the member has no public contact card → static (non-clickable).
  contact: ContactCard | null;
}) {
  const t = useTranslations("Landing");
  const tc = useTranslations("ContactCard");

  const inner = (
    <>
      <Avatar className="size-16 ring-2 ring-transparent transition-all group-hover:ring-primary/40">
        <AvatarImage src={member.image} alt={member.name} />
        <AvatarFallback className="text-lg">
          {initials(member.name)}
        </AvatarFallback>
      </Avatar>
      <div>
        <div className="font-medium">{member.name}</div>
        <div className="text-sm text-muted-foreground">{member.position}</div>
      </div>
    </>
  );

  // No contact card → render a static card.
  if (!contact) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-6 text-center shadow-sm">
        {inner}
      </div>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="group flex cursor-pointer flex-col items-center gap-3 rounded-xl border bg-card p-6 text-center shadow-sm transition-colors hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {inner}
          <span className="inline-flex items-center gap-1 text-xs text-primary opacity-0 transition-opacity group-hover:opacity-100">
            {t("team.card.view")}
            <ChevronRight className="size-3 rtl:rotate-180" />
          </span>
        </button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto border-0 bg-transparent p-0 shadow-none sm:max-w-md">
        <DialogTitle className="sr-only">{member.name}</DialogTitle>
        <DialogDescription className="sr-only">
          {tc("card.dialogDescription", { name: member.name })}
        </DialogDescription>
        <EmployeeCard contact={contact} />
      </DialogContent>
    </Dialog>
  );
}
