import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { AuthScreen } from "../_components/auth-screen";

export const metadata: Metadata = {
  title: "Sign in · ECM Support",
};

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AuthScreen initialMode="login" />;
}
