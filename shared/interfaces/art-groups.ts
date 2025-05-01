import { z } from 'zod';

// Esquema para validar um formato de arte individual
export const ArtFormatSchema = z.object({
  format: z.string().min(1, "Formato é obrigatório"),
  fileType: z.string().min(1, "Tipo de arquivo é obrigatório"),
  title: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
  description: z.string().optional(),
  imageUrl: z.string().min(5, "URL da imagem é obrigatória"),
  previewUrl: z.string().optional().nullable(),
  editUrl: z.string().min(5, "URL de edição é obrigatória"),
});

// Esquema para validar um grupo de artes (múltiplos formatos)
export const ArtGroupSchema = z.object({
  categoryId: z.number().positive("ID da categoria deve ser um número positivo"),
  isPremium: z.boolean().default(false),
  formats: z.array(ArtFormatSchema).min(1, "Adicione pelo menos um formato")
});

// Tipos derivados dos esquemas
export type ArtFormat = z.infer<typeof ArtFormatSchema>;
export type ArtGroup = z.infer<typeof ArtGroupSchema>;