import { z } from "zod";

export const loginSchema = z.object({
  // Accepts either the username or the email.
  identifier: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  name: z.string().min(1),
  username: z.string().min(3),
  email: z.email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  jobTitle: z.string().optional(),
  image: z.string().optional(),
});

// Form-level schema for the sign-up UI: the registration fields plus a password
// confirmation. Confirmation is purely a UI concern, so it lives here rather
// than in the service-facing registerSchema.
export const registerFormSchema = registerSchema
  .extend({
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  username: z.string().min(3).optional(),
  email: z.email().optional(),
  password: z.string().min(8).optional(),
  jobTitle: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  // Contact fields the user can manage from their own profile.
  website: z.string().nullable().optional(),
  whatsapp: z.string().nullable().optional(),
  linkedin: z.string().nullable().optional(),
  // Global admin flag (the only global role; every other role is per-project).
  isAdmin: z.boolean().optional(),
  // Whether the user may open the staff dashboard.
  canAccessDashboard: z.boolean().optional(),
  // The company the user belongs to (ECM/CTC). Chosen at registration.
  companyId: z.number().int().positive().nullable().optional(),
  // Whether the user is featured on their company's public landing-page team.
  isTeamMember: z.boolean().optional(),
  // Whether the user has a public contact card at /contact-info/[id].
  hasContactInfoCard: z.boolean().optional(),
});
