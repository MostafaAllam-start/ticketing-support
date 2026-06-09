import { cookies } from "next/headers";

// The visitor's chosen company is remembered in a cookie so the public surfaces
// (landing + auth) can be shown under the right brand before the user logs in.
// For a signed-in user the company stored on their account takes precedence.
export const COMPANY_COOKIE = "company_id";
const ONE_YEAR = 60 * 60 * 24 * 365;

export async function getSelectedCompanyIdFromCookie(): Promise<number | null> {
  const raw = (await cookies()).get(COMPANY_COOKIE)?.value;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// Must be called from a Server Action or Route Handler so the cookie can be set.
export async function setSelectedCompanyCookie(companyId: number): Promise<void> {
  (await cookies()).set(COMPANY_COOKIE, String(companyId), {
    path: "/",
    maxAge: ONE_YEAR,
    sameSite: "lax",
  });
}
