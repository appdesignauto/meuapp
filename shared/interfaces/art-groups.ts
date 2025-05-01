import { z } from 'zod';

// Esquema para um formato individual
export const ArtFormatSchema = z.object({
  format: z.string(),
  imageUrl: z.string(),
  previewUrl: z.string().optional(),
  editUrl: z.string().optional(),
  title: z.string(),
  description: z.string(),
  fileType: z.string(),
});

// Esquema para o grupo de arte com múltiplos formatos
export const ArtGroupSchema = z.object({
  categoryId: z.number(),
  isPremium: z.boolean().default(false),
  formats: z.array(ArtFormatSchema),
});

// Tipo para formato individual
export type ArtFormat = z.infer<typeof ArtFormatSchema>;

// Tipo para grupo de arte
export type ArtGroup = z.infer<typeof ArtGroupSchema>;