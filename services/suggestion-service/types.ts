import type { z } from "zod";
import type { Suggestion } from "@/app/generated/prisma/client";
import type { createSuggestionSchema } from "./schemas";

export type CreateSuggestionInput = z.infer<typeof createSuggestionSchema>;

export type { Suggestion };
