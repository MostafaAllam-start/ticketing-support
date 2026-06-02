"use client";

import { type ReactNode } from "react";
import Image from "next/image";
import { Briefcase, Building2, Globe, Mail, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon, LinkedInIcon } from "./brand-icons";
import {
  type ContactCard,
  initials,
  safeUrl,
  whatsappLink,
} from "./contact-card";

// Maps a fetched image's MIME type to a vCard PHOTO type token; unknown formats
// (e.g. image/svg+xml) are intentionally absent so the photo is skipped rather
// than mislabelled.
const PHOTO_TYPES: Record<string, string> = {
  "image/jpeg": "JPEG",
  "image/jpg": "JPEG",
  "image/png": "PNG",
  "image/gif": "GIF",
  "image/webp": "WEBP",
};

// Escapes a value for safe interpolation into a vCard line (RFC 6350 §3.4).
function escapeVCard(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/[,;]/g, (m) => `\\${m}`);
}

export function EmployeeCard({ contact }: { contact: ContactCard }) {
  const t = useTranslations("ContactCard");

  // External links come from free-form DB columns, so validate each to an
  // http(s) URL before it ever reaches an href (drops javascript:/data: etc.).
  const websiteHref = safeUrl(contact.website);
  const linkedinHref = safeUrl(contact.linkedin);
  const companyHref = safeUrl(contact.company?.websiteUrl);

  const social = [
    contact.whatsapp && {
      key: "whatsapp",
      href: whatsappLink(contact.whatsapp),
      label: t("card.whatsapp"),
      icon: <WhatsAppIcon className="size-6" />,
      cls: "bg-green-500/10 text-green-600 hover:bg-green-500/20 dark:text-green-400",
    },
    linkedinHref && {
      key: "linkedin",
      href: linkedinHref,
      label: t("card.linkedin"),
      icon: <LinkedInIcon className="size-6" />,
      cls: "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 dark:text-blue-400",
    },
    websiteHref && {
      key: "website",
      href: websiteHref,
      label: t("card.website"),
      icon: <Globe className="size-6" />,
      cls: "bg-primary/10 text-primary hover:bg-primary/20",
    },
    contact.company &&
      companyHref && {
        key: "company",
        href: companyHref,
        label: contact.company.name,
        icon: contact.company.logo ? (
          <Image
            src={contact.company.logo}
            alt=""
            width={24}
            height={24}
            unoptimized
            className="size-6 rounded object-contain"
          />
        ) : (
          <Building2 className="size-6" />
        ),
        cls: "bg-muted text-foreground hover:bg-muted/70",
      },
  ].filter(Boolean) as {
    key: string;
    href: string;
    label: string;
    icon: ReactNode;
    cls: string;
  }[];

  async function downloadVCard() {
    try {
      const esc = escapeVCard;
      const lines = ["BEGIN:VCARD", "VERSION:3.0"];

      // N (structured name) is required in vCard 3.0; derive it from the full
      // name (last token as family name) and keep FN for display.
      const parts = contact.name.trim().split(/\s+/);
      const family = parts.length > 1 ? parts[parts.length - 1] : "";
      const given = (parts.length > 1 ? parts.slice(0, -1) : parts).join(" ");
      lines.push(`N:${esc(family)};${esc(given)};;;`);
      lines.push(`FN:${esc(contact.name)}`);

      if (contact.position) lines.push(`TITLE:${esc(contact.position)}`);
      if (contact.company) lines.push(`ORG:${esc(contact.company.name)}`);
      if (contact.email) lines.push(`EMAIL;type=WORK:${esc(contact.email)}`);
      if (contact.whatsapp) {
        lines.push(`TEL;type=CELL:${esc(contact.whatsapp.replace(/[^\d+]/g, ""))}`);
      }
      if (websiteHref) lines.push(`URL:${esc(websiteHref)}`);
      if (linkedinHref) {
        // Standard URL (portable to Android/Outlook) plus the Apple-specific
        // social-profile extension for nicer labelling in Apple Contacts.
        lines.push(`URL;type=linkedin:${esc(linkedinHref)}`);
        lines.push(`X-SOCIALPROFILE;type=linkedin:${esc(linkedinHref)}`);
      }

      // Best-effort photo embed; skipped on CORS or an unsupported format.
      if (contact.image) {
        try {
          const blob = await (await fetch(contact.image)).blob();
          const token = PHOTO_TYPES[blob.type];
          if (token) {
            const dataUrl: string = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(String(reader.result));
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
            const base64 = dataUrl.split(",")[1];
            if (base64) lines.push(`PHOTO;ENCODING=b;TYPE=${token}:${base64}`);
          }
        } catch {
          // No photo in the vCard — continue without it.
        }
      }

      lines.push("END:VCARD");

      const url = URL.createObjectURL(
        new Blob([lines.join("\n")], { type: "text/vcard" }),
      );
      // Keep unicode letters in the filename; strip only path/control chars.
      const safeName =
        contact.name.replace(/[\\/:*?"<>|\r\n]+/g, "_").trim() || "contact";
      const link = document.createElement("a");
      link.href = url;
      link.download = `${safeName.replace(/\s+/g, "_")}.vcf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t("card.downloadError"));
    }
  }

  return (
    <div className="w-full space-y-8 rounded-2xl border bg-card/95 py-8 shadow-xl backdrop-blur-sm">
      {/* Profile header */}
      <div className="px-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="rounded-full bg-gradient-to-r from-primary to-primary/60 p-1 shadow-lg">
            <Avatar className="size-28 border-4 border-background">
              <AvatarImage src={contact.image} alt={contact.name} />
              <AvatarFallback className="text-2xl">
                {initials(contact.name)}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">{contact.name}</h1>
            <p className="font-medium text-primary">{contact.position}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto w-[95%] border-t-2 border-dashed border-border" />

      <div className="space-y-6 px-8">
        {/* Quick actions */}
        {(contact.email || contact.whatsapp) && (
          <div className="flex justify-center gap-6">
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                aria-label={t("card.email")}
                className="rounded-full bg-primary/10 p-3 text-primary transition-colors hover:bg-primary/20"
              >
                <Mail className="size-6" />
              </a>
            )}
            {contact.whatsapp && (
              <a
                href={whatsappLink(contact.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t("card.whatsapp")}
                className="rounded-full bg-green-500/10 p-3 text-green-600 transition-colors hover:bg-green-500/20 dark:text-green-400"
              >
                <WhatsAppIcon className="size-6" />
              </a>
            )}
          </div>
        )}

        {/* Contact details */}
        <div className="divide-y rounded-lg border">
          {contact.email && (
            <DetailRow icon={<Mail className="size-5 text-primary" />} label={t("card.email")}>
              <a
                href={`mailto:${contact.email}`}
                className="break-all text-foreground transition-colors hover:text-primary"
              >
                {contact.email}
              </a>
            </DetailRow>
          )}
          <DetailRow
            icon={<Briefcase className="size-5 text-primary" />}
            label={t("card.role")}
          >
            <span className="text-foreground">
              {contact.jobTitle ?? contact.position}
            </span>
          </DetailRow>
          {contact.company && (
            <DetailRow
              icon={<Building2 className="size-5 text-primary" />}
              label={t("card.company")}
            >
              <span className="text-foreground">{contact.company.name}</span>
            </DetailRow>
          )}
        </div>

        {/* Find me on */}
        {social.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-semibold">{t("card.findMe")}</p>
            {social.map((item) => (
              <a
                key={item.key}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-3 rounded-lg p-3 transition-colors ${item.cls}`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
                <ChevronEnd />
              </a>
            ))}
          </div>
        )}

        {/* Add to contacts (vCard download) */}
        <Button
          onClick={downloadVCard}
          size="lg"
          className="w-full bg-gradient-to-r from-primary to-primary/80 shadow-lg"
        >
          <UserPlus className="size-5" />
          {t("card.addContact")}
        </Button>
      </div>
    </div>
  );
}

// A chevron that points toward the inline end (flips automatically in RTL).
function ChevronEnd() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="ms-auto size-5 rtl:rotate-180"
      aria-hidden
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 p-3">
      <div className="rounded-lg bg-primary/10 p-2">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <div className="truncate text-sm">{children}</div>
      </div>
    </div>
  );
}
