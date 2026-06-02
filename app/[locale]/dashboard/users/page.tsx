import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireRole } from "@/lib/auth/guards";
import { roleService, userService } from "@/services";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AddUserButton,
  UserRowActions,
} from "./_components/user-actions";

// Up to two uppercase initials from a display name, for the avatar fallback.
function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function UsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const admin = await requireRole("admin");
  const t = await getTranslations("Dashboard");

  const [users, roles] = await Promise.all([
    userService.list(),
    roleService.list(),
  ]);
  const roleNames = roles.map((role) => role.name);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("users.title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("users.subtitle")}</p>
        </div>
        <AddUserButton roles={roleNames} />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">{t("users.image")}</TableHead>
              <TableHead>{t("users.name")}</TableHead>
              <TableHead>{t("users.username")}</TableHead>
              <TableHead>{t("users.email")}</TableHead>
              <TableHead>{t("users.role")}</TableHead>
              <TableHead>{t("users.status")}</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Avatar className="size-9">
                    {user.image && (
                      <AvatarImage src={user.image} alt={user.name} />
                    )}
                    <AvatarFallback className="text-xs">
                      {initials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  @{user.username}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant="outline">{user.role.name}</Badge>
                </TableCell>
                <TableCell>
                  {user.isDisabled ? (
                    <Badge variant="destructive">{t("users.disabled")}</Badge>
                  ) : (
                    <Badge variant="secondary">{t("users.active")}</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <UserRowActions
                    user={{
                      id: user.id,
                      name: user.name,
                      username: user.username,
                      email: user.email,
                      jobTitle: user.jobTitle,
                      role: user.role.name,
                      image: user.image,
                      isDisabled: user.isDisabled,
                    }}
                    roles={roleNames}
                    isSelf={user.id === admin.id}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
