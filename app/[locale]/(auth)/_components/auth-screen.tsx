"use client";

import { useActionState, useState, type ComponentProps } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  AtSign,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
  Zap,
} from "lucide-react";
import { cn, keepInputOnError } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import type { BrandKey } from "@/lib/companies";
import { loginAction, registerAction } from "../actions";

type AuthMode = "login" | "register";

export function AuthScreen({
  initialMode = "login",
  brand = "ctc",
}: {
  initialMode?: AuthMode;
  brand?: BrandKey;
}) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const isLogin = mode === "login";
  const locale = useLocale();
  const t = useTranslations("Auth");
  const tBrand = useTranslations("Brand");

  function switchMode(next: AuthMode) {
    if (next === mode) return;
    setMode(next);
    // Keep the URL in sync (locale-prefixed) without a full client navigation,
    // so typed input and the toggle animation are preserved.
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `/${locale}/${next}`);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex">
        <div className="pointer-events-none absolute -top-24 -start-24 size-72 rounded-full bg-primary-foreground/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 end-0 size-80 translate-y-1/3 rounded-full bg-primary-foreground/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 text-primary-foreground opacity-[0.15] [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:36px_36px]" />

        <Logo
          className="relative self-center"
          imageClassName="h-16"
          brand={brand}
        />

        <div className="relative space-y-6">
          <h1 className="text-4xl leading-tight font-semibold tracking-tight text-balance">
            {tBrand(`${brand}.headline`)}
          </h1>
          <p className="max-w-sm text-primary-foreground/80">
            {tBrand(`${brand}.tagline`)}
          </p>
          <ul className="space-y-3 text-sm text-primary-foreground/90">
            <li className="flex items-center gap-3">
              <span className="flex size-7 items-center justify-center rounded-full bg-primary-foreground/10">
                <Zap className="size-4" />
              </span>
              {tBrand(`${brand}.feature1`)}
            </li>
            <li className="flex items-center gap-3">
              <span className="flex size-7 items-center justify-center rounded-full bg-primary-foreground/10">
                <ShieldCheck className="size-4" />
              </span>
              {tBrand(`${brand}.feature2`)}
            </li>
            <li className="flex items-center gap-3">
              <span className="flex size-7 items-center justify-center rounded-full bg-primary-foreground/10">
                <Sparkles className="size-4" />
              </span>
              {tBrand(`${brand}.feature3`)}
            </li>
          </ul>
        </div>

        <p className="relative text-sm text-primary-foreground/60">
          {tBrand(`${brand}.rights`)}
        </p>
      </aside>

      {/* Form panel */}
      <main className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center justify-between gap-3">
            <Logo className="lg:hidden" brand={brand} />
            <div className="flex items-center gap-2 ms-auto">
              <ThemeToggle />
              <LocaleSwitcher />
            </div>
          </div>

          {/* Segmented toggle */}
          <div className="relative mb-8 grid grid-cols-2 rounded-lg bg-muted p-1 text-sm font-medium">
            <span
              className={cn(
                "pointer-events-none absolute top-1 bottom-1 start-1 w-[calc(50%-0.25rem)] rounded-md bg-background shadow-sm transition-transform duration-300 ease-out",
                isLogin
                  ? "translate-x-0"
                  : "translate-x-full rtl:-translate-x-full",
              )}
            />
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={cn(
                "relative z-10 rounded-md py-2 transition-colors",
                isLogin
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t("signIn")}
            </button>
            <button
              type="button"
              onClick={() => switchMode("register")}
              className={cn(
                "relative z-10 rounded-md py-2 transition-colors",
                !isLogin
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t("signUp")}
            </button>
          </div>

          {/* Heading */}
          <div className="mb-6 space-y-1.5">
            <h2 className="text-2xl font-semibold tracking-tight">
              {isLogin ? t("welcomeBack") : t("createAccount")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isLogin ? t("welcomeBackDesc") : t("createAccountDesc")}
            </p>
          </div>

          {/* Animated form swap (key remounts → re-triggers the enter animation) */}
          <div
            key={mode}
            className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300"
          >
            {isLogin ? <LoginForm /> : <RegisterForm />}
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isLogin ? `${t("noAccount")} ` : `${t("haveAccount")} `}
            <button
              type="button"
              onClick={() => switchMode(isLogin ? "register" : "login")}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              {isLogin ? t("signUp") : t("signIn")}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}

function LoginForm() {
  const t = useTranslations("Auth");
  const [state, formAction, pending] = useActionState(loginAction, {});

  return (
    <form action={formAction} onReset={keepInputOnError(state)} className="space-y-4">
      <FormError message={state.error} />

      <div className="space-y-2">
        <Label htmlFor="login-identifier">{t("usernameOrEmail")}</Label>
        <div className="relative">
          <AtSign className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="login-identifier"
            name="identifier"
            placeholder={t("emailPlaceholder")}
            autoComplete="username"
            className="ps-9"
            aria-invalid={Boolean(state.fieldErrors?.identifier)}
          />
        </div>
        <FieldError message={state.fieldErrors?.identifier} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="login-password">{t("password")}</Label>
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {t("forgotPassword")}
          </button>
        </div>
        <PasswordInput
          id="login-password"
          name="password"
          placeholder="••••••••"
          autoComplete="current-password"
          aria-invalid={Boolean(state.fieldErrors?.password)}
        />
        <FieldError message={state.fieldErrors?.password} />
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />}
        {t("submitSignIn")}
      </Button>
    </form>
  );
}

function RegisterForm() {
  const t = useTranslations("Auth");
  const [state, formAction, pending] = useActionState(registerAction, {});

  return (
    <form action={formAction} onReset={keepInputOnError(state)} className="space-y-4">
      <FormError message={state.error} />

      <div className="space-y-2">
        <Label htmlFor="reg-name">{t("fullName")}</Label>
        <div className="relative">
          <User className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="reg-name"
            name="name"
            placeholder={t("namePlaceholder")}
            autoComplete="name"
            className="ps-9"
            aria-invalid={Boolean(state.fieldErrors?.name)}
          />
        </div>
        <FieldError message={state.fieldErrors?.name} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reg-username">{t("username")}</Label>
        <div className="relative">
          <AtSign className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="reg-username"
            name="username"
            placeholder={t("usernamePlaceholder")}
            autoComplete="username"
            className="ps-9"
            aria-invalid={Boolean(state.fieldErrors?.username)}
          />
        </div>
        <FieldError message={state.fieldErrors?.username} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reg-email">{t("email")}</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="reg-email"
            name="email"
            type="email"
            placeholder={t("emailPlaceholder")}
            autoComplete="email"
            className="ps-9"
            aria-invalid={Boolean(state.fieldErrors?.email)}
          />
        </div>
        <FieldError message={state.fieldErrors?.email} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reg-password">{t("password")}</Label>
        <PasswordInput
          id="reg-password"
          name="password"
          placeholder={t("passwordHint")}
          autoComplete="new-password"
          aria-invalid={Boolean(state.fieldErrors?.password)}
        />
        <FieldError message={state.fieldErrors?.password} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reg-confirm-password">{t("confirmPassword")}</Label>
        <PasswordInput
          id="reg-confirm-password"
          name="confirmPassword"
          placeholder={t("confirmPasswordPlaceholder")}
          autoComplete="new-password"
          aria-invalid={Boolean(state.fieldErrors?.confirmPassword)}
        />
        <FieldError message={state.fieldErrors?.confirmPassword} />
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />}
        {t("submitCreate")}
      </Button>
    </form>
  );
}

function PasswordInput(props: ComponentProps<typeof Input>) {
  const t = useTranslations("Auth");
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <Lock className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input type={show ? "text" : "password"} className="px-9" {...props} />
      <button
        type="button"
        onClick={() => setShow((value) => !value)}
        className="absolute top-1/2 end-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        aria-label={show ? t("hidePassword") : t("showPassword")}
        tabIndex={-1}
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}

function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {message}
    </div>
  );
}
