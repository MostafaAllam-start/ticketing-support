import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { AuthScreen } from "../_components/auth-screen";

export const metadata: Metadata = {
  title: "Create account · ECM Support",
};

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AuthScreen initialMode="register" />;
}
