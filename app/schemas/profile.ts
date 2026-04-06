import { z } from "zod";

// ─── Schema ───────────────────────────────────────────────────────────────────
export const profileSchema = z.object({
  full_name: z.string().min(2, "El nombre es muy corto").max(100),
  username: z
    .string()
    .min(3, "El username es muy corto")
    .max(50)
    .regex(/^[a-zA-Z0-9_]+$/, "Solo letras, números y guión bajo")
    .optional()
    .or(z.literal("")),
  bio: z
    .string()
    .max(300, "Máximo 300 caracteres")
    .optional()
    .or(z.literal("")),
  discord: z.string().max(100).optional().or(z.literal("")),
  whatsapp: z.string().max(20).optional().or(z.literal("")),
  twitter: z.string().max(100).optional().or(z.literal("")),
  instagram: z.string().max(100).optional().or(z.literal("")),
  website: z.string().url("URL inválida").optional().or(z.literal("")),
});

export type ProfileForm = z.output<typeof profileSchema>;
