// schemas/campaign.ts
import { z } from 'zod'

export const campaignSchema = z.object({
  title: z.string().min(3, 'El título es muy corto'),
  system: z.string().min(2, 'Especifica el sistema (ej: Fabula Ultima)'),
  description: z.string().min(10, 'Cuéntanos un poco más de la trama'),
  play_mode: z.enum(['remote', 'in_person', 'hybrid']),
  contact: z.string().min(3, '¿Cómo te contactan los jugadores?'),
  project_id: z.string().uuid('Debes seleccionar un proyecto'),
  image: z.any().optional() // Para el manejo del archivo antes de subirlo
})

export type CampaignForm = z.output<typeof campaignSchema>