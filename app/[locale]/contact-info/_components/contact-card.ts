// Shared types + helpers for the /contact-info/[user_id] business card page.

// A fully serializable contact, flattened from the user + (optionally) the first
// company the person belongs to.
export type ContactCard = {
  id: number;
  name: string;
  /** Job title / role shown under the name. */
  position: string;
  /** Avatar URL (the user's image). May be empty. */
  image: string;
  email: string | null;
  jobTitle: string | null;
  website: string | null;
  whatsapp: string | null;
  linkedin: string | null;
  company: ContactCompany | null;
};

export type ContactCompany = {
  name: string;
  logo: string;
  websiteUrl: string;
};

// The stored whatsapp value may be a phone number (+20100…) or a full wa.me URL.
export function whatsappLink(value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  return `https://wa.me/${value.replace(/[^\d]/g, "")}`;
}

// Returns the value only if it is (or can be normalized to) an http(s) URL, else
// null. These links come from free-form DB columns rendered into anchor hrefs on
// a public page, so a `javascript:`/`data:` value must never reach an href.
export function safeUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  // If there's already a scheme (e.g. "javascript:", "http:"), keep it so the
  // protocol check below can reject non-http(s); otherwise assume https.
  const candidate = /^[a-z][\w+.-]*:/i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(candidate);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
