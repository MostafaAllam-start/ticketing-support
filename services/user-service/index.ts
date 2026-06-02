import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { Service } from "../service";
import {
  AUTH_COOKIE,
  TOKEN_MAX_AGE,
  signToken,
  verifyToken,
} from "@/lib/auth/jwt";
import { loginSchema, registerSchema, updateUserSchema } from "./schemas";
import type {
  LoginInput,
  RegisterInput,
  UpdateUserInput,
  SafeUser,
  AuthUser,
} from "./types";

const BCRYPT_ROUNDS = 12;
const DEFAULT_ROLE = "user";
const ENGINEER_ROLE = "software-engineer";

export class UserService extends Service {
  // Verifies credentials, sets the JWT as an httpOnly cookie, and returns both
  // the token and the (password-stripped) user. Must be called from a Server
  // Action or Route Handler so the cookie can be written.
  async login(input: LoginInput): Promise<{ token: string; user: SafeUser }> {
    const { identifier, password } = loginSchema.parse(input);

    const user = await this.prisma.user.findFirst({
      where: {
        deletedAt: null,
        OR: [{ username: identifier }, { email: identifier }],
      },
      include: { role: true },
    });

    // Use a single generic error for all failure modes so the response does not
    // reveal whether the account exists or is disabled.
    if (
      !user ||
      user.isDisabled ||
      !(await bcrypt.compare(password, user.password))
    ) {
      throw new Error("Invalid credentials");
    }

    const token = await signToken({
      sub: String(user.id),
      username: user.username,
      role: user.role.name,
    });

    await this.setAuthCookie(token);
    return { token, user: this.sanitize(user) };
  }

  // Expires the auth cookie. Must be called from a Server Action or Route Handler.
  async logout(): Promise<void> {
    const store = await cookies();
    store.set(AUTH_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });
  }

  // Resolves the authenticated user from the auth cookie. Unlike the stateless
  // verifyToken(), this re-reads the user from the database, so an account that
  // was disabled or soft-deleted after its token was issued is rejected
  // immediately instead of staying valid until the token expires. Returns null
  // when there is no valid session.
  async currentUser(): Promise<AuthUser | null> {
    const store = await cookies();
    const token = store.get(AUTH_COOKIE)?.value;
    if (!token) return null;

    let sub: string;
    try {
      sub = (await verifyToken(token)).sub;
    } catch {
      return null;
    }

    const user = await this.prisma.user.findFirst({
      where: { id: Number(sub), deletedAt: null, isDisabled: false },
      include: { role: true },
    });
    return user ? this.sanitize(user) : null;
  }

  // Active software-engineers, for ticket-assignment pickers. Returns just the
  // fields a selector needs.
  async engineers(): Promise<{ id: number; name: string; username: string }[]> {
    return this.prisma.user.findMany({
      where: {
        deletedAt: null,
        isDisabled: false,
        role: { name: ENGINEER_ROLE },
      },
      select: { id: true, name: true, username: true },
      orderBy: { name: "asc" },
    });
  }

  // Public-facing contact details for a single person, for the
  // /contact-info/[user_id] business card page.
  //
  // SECURITY/PRIVACY: limited to users who have explicitly opted in via
  // `hasContactInfoCard`, so an arbitrary account's email/contact info can't be
  // harvested by walking ids — anyone without the flag 404s. Returns the linked
  // team member's photo/position (if any) and the first company the user belongs
  // to (via project membership) for the card's company section.
  async contactCard(id: number) {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        deletedAt: null,
        isDisabled: false,
        hasContactInfoCard: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        jobTitle: true,
        website: true,
        whatsapp: true,
        linkedin: true,
        teamMember: { select: { image: true, position: true } },
        projectMemberships: {
          take: 1,
          select: {
            project: {
              select: {
                company: {
                  select: {
                    id: true,
                    name: true,
                    logo: true,
                    websiteUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Null when the id doesn't exist or hasn't opted in (the WHERE filters it
    // out) — the page turns this into a 404 either way, so the flag isn't leaked.
    return user;
  }

  // Active users with their role, for the admin Users table.
  async list(): Promise<AuthUser[]> {
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null },
      include: { role: true },
      orderBy: { id: "asc" },
    });
    return users.map((user) => this.sanitize(user));
  }

  // Creates a new user with a hashed password. `role` is optional and defaults
  // to "user".
  //
  // SECURITY: `role` is privileged. Only pass a non-default role from an already
  // authorized (e.g. admin-only) caller; never forward a client-supplied role
  // from a public registration endpoint, or users could grant themselves
  // elevated roles. The service does not enforce this — authorization is the
  // caller's responsibility.
  async register(
    input: RegisterInput,
    role: string = DEFAULT_ROLE,
  ): Promise<SafeUser> {
    const data = registerSchema.parse(input);
    const roleId = await this.resolveRoleId(role);
    await this.assertUnique(data.username, data.email);

    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        username: data.username,
        email: data.email,
        password: await bcrypt.hash(data.password, BCRYPT_ROUNDS),
        jobTitle: data.jobTitle,
        image: data.image,
        roleId,
      },
    });
    return this.sanitize(user);
  }

  // Updates user data. Any field is optional; password is re-hashed when given
  // and `role` (a role name) is resolved to its id.
  //
  // SECURITY: changing `role` is privileged — gate this call behind an
  // authorization check in the caller; the service does not enforce who may
  // change roles.
  async update(id: number, input: UpdateUserInput): Promise<SafeUser> {
    const { role, password, ...rest } = updateUserSchema.parse(input);
    await this.assertExists(id);

    if (rest.username || rest.email) {
      await this.assertUnique(rest.username, rest.email, id);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...rest,
        ...(password
          ? { password: await bcrypt.hash(password, BCRYPT_ROUNDS) }
          : {}),
        ...(role ? { roleId: await this.resolveRoleId(role) } : {}),
      },
    });
    return this.sanitize(user);
  }

  // Disables (or re-enables) a user account.
  async disable(id: number, isDisabled = true): Promise<SafeUser> {
    await this.assertExists(id);
    const user = await this.prisma.user.update({
      where: { id },
      data: { isDisabled },
    });
    return this.sanitize(user);
  }

  enable(id: number): Promise<SafeUser> {
    return this.disable(id, false);
  }

  // Soft-deletes a user: stamps `deletedAt` and disables the account so it can no
  // longer authenticate, while preserving the row for referential integrity.
  async softDelete(id: number): Promise<SafeUser> {
    await this.assertExists(id);
    const user = await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isDisabled: true },
    });
    return this.sanitize(user);
  }

  // --- helpers ---

  private async resolveRoleId(name: string): Promise<number> {
    const role = await this.prisma.role.findUnique({ where: { name } });
    if (!role) {
      throw new Error(`Role "${name}" does not exist`);
    }
    return role.id;
  }

  private async assertExists(id: number): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!user) {
      throw new Error(`User ${id} not found`);
    }
  }

  // Enforces the username/email unique constraints (which apply across all rows,
  // including soft-deleted ones) with a friendly error before hitting the DB.
  private async assertUnique(
    username?: string,
    email?: string,
    excludeId?: number,
  ): Promise<void> {
    const conditions: Array<{ username: string } | { email: string }> = [];
    if (username) conditions.push({ username });
    if (email) conditions.push({ email });
    if (conditions.length === 0) return;

    const existing = await this.prisma.user.findFirst({
      where: {
        OR: conditions,
        ...(excludeId !== undefined ? { NOT: { id: excludeId } } : {}),
      },
      select: { username: true, email: true },
    });
    if (existing) {
      const field =
        username && existing.username === username ? "username" : "email";
      throw new Error(`A user with this ${field} already exists`);
    }
  }

  private async setAuthCookie(token: string): Promise<void> {
    const store = await cookies();
    store.set(AUTH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: TOKEN_MAX_AGE,
    });
  }

  private sanitize<T extends { password: string }>(
    user: T,
  ): Omit<T, "password"> {
    const { password: _password, ...safe } = user;
    return safe;
  }
}

export const userService = new UserService();

export * from "./schemas";
export * from "./types";
