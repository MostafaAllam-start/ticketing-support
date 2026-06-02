import type { z } from "zod";
import type { Role, User } from "@/app/generated/prisma/client";
import type { loginSchema, registerSchema, updateUserSchema } from "./schemas";

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// A user with the password field stripped — the shape returned by every service
// method that exposes a user.
export type SafeUser = Omit<User, "password">;

// A safe user with its role relation loaded — used for auth/role gating.
export type AuthUser = SafeUser & { role: Role };
