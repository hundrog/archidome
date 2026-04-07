// schemas/campaign.ts
import { z } from "zod";

export const campaignSchema = z.object({
  // Hook
  title: z.string().min(3, "El título es muy corto").max(200),
  system: z.string().min(2, "Especifica el sistema").max(100),
  hook: z.string().min(10, "Describe el hook de la campaña").max(300),
  description: z.string().min(10, "Cuéntanos más de la trama").max(5000),

  // Portal
  play_mode: z.enum(["remote", "in_person", "hybrid"]),
  virtual_platform: z
    .string()
    .min(2, "Especifica la plataforma virtual")
    .max(100)
    .optional(),
  frequency: z.enum(["weekly", "biweekly", "monthly", "irregular"]).optional(),
  language: z.string().default("Español"),
  timezone: z.string().optional(),
  duration: z.string().optional(),
  location_name: z.string().optional(),
  lat: z.number().nullable().default(null),
  lng: z.number().nullable().default(null),

  // Rules
  max_players: z.number().int().min(1).max(20).default(4),
  current_players: z.number().int().min(1).max(20).default(0),
  start_level: z.number().int().min(1).max(20).default(1),
  style_tags: z.array(z.string()).default([]),
  house_rules: z
    .array(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
      }),
    )
    .default([]),

  // Meta
  project_id: z.string().uuid("Debes seleccionar un proyecto"),
  image: z.any().optional(),
});

export const hookSchema = z.object({
  title: z.string().min(3, "El título es muy corto").max(200),
  system: z.string().min(2, "Especifica el sistema").max(100),
  hook: z.string().min(10, "Describe el hook de la campaña").max(300),
  description: z.string().min(10, "Cuéntanos más de la trama").max(5000),
});

export const portalSchema = z.object({
  play_mode: z.enum(["remote", "in_person", "hybrid"]),
  virtual_platform: z
    .string()
    .min(2, "Especifica la plataforma virtual")
    .max(100)
    .optional(),
  frequency: z.enum(["weekly", "biweekly", "monthly", "irregular"]).optional(),
  language: z.string().default("Español"),
  timezone: z.string().optional(),
  duration: z.string().optional(),
  location_name: z.string().optional(),
  lat: z.number().nullable().default(null),
  lng: z.number().nullable().default(null),
});

export const rulesSchema = z.object({
  max_players: z.number().int().min(1).max(20).default(4),
  current_players: z.number().int().min(1).max(20).default(0),
  start_level: z.number().int().min(1).max(20).default(1),
  style_tags: z.array(z.string()).default([]),
  house_rules: z
    .array(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
      }),
    )
    .default([]),
});

export type CampaignForm = z.output<typeof campaignSchema>;
