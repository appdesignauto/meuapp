import { pgTable, text, serial, integer, boolean, timestamp, primaryKey, date, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  name: text("name"),
  profileimageurl: text("profileimageurl"),
  bio: text("bio"),
  // Campo de nível de acesso com todos os tipos de usuários
  // 'visitante', 'usuario', 'premium', 'designer', 'designer_adm', 'suporte', 'admin'
  nivelacesso: text("nivelacesso").notNull().default("usuario"),
  
  // Campos para gerenciamento de assinatura
  origemassinatura: text("origemassinatura"), // 'hotmart', 'manual', 'auto', 'nenhuma'
  tipoplano: text("tipoplano"), // 'mensal', 'anual', 'personalizado', 'vitalicio'
  dataassinatura: timestamp("dataassinatura"),
  dataexpiracao: timestamp("dataexpiracao"),
  acessovitalicio: boolean("acessovitalicio").default(false),
  
  // Campos administrativos e de controle
  observacaoadmin: text("observacaoadmin"),
  isactive: boolean("isactive").notNull().default(true),
  ultimologin: timestamp("ultimologin"),
  criadoem: timestamp("criadoem").notNull().defaultNow(),
  atualizadoem: timestamp("atualizadoem").notNull().defaultNow(),
  
  // Campos para informações de perfil adicional
  website: text("website"),
  location: text("location"),
  phone: text("phone"), // Novo campo para número de telefone
  
  // Campo para compatibilidade com o código existente - será descontinuado gradualmente
  role: text("role"),
  
  // ID do usuário no Supabase Auth
  supabaseId: text("supabaseId").unique(),
  
  // Campos para redefinição de senha
  resetpasswordtoken: text("resetpasswordtoken"),
  resetpasswordexpires: timestamp("resetpasswordexpires"),
  lastresetrequest: timestamp("lastresetrequest"), // Última vez que o usuário solicitou redefinição de senha
  
  // Campo para controlar status de confirmação de email
  emailconfirmed: boolean("emailconfirmed").default(true), // Alterado para true por padrão
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  criadoem: true,
  atualizadoem: true,
});

// Category schema
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
});

export const insertCategorySchema = createInsertSchema(categories);

// Format schema
export const formats = pgTable("formats", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
});

export const insertFormatSchema = createInsertSchema(formats);

// File type schema
export const fileTypes = pgTable("fileTypes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
});

export const insertFileTypeSchema = createInsertSchema(fileTypes);

// Collection schema
export const collections = pgTable("collections", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("imageUrl").notNull(),
  artCount: integer("artCount").notNull().default(0),
  formats: text("formats").notNull(),
  isPremium: boolean("isPremium").notNull().default(false),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const insertCollectionSchema = createInsertSchema(collections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Art schema
export const arts = pgTable("arts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  imageUrl: text("imageUrl").notNull(),
  format: text("format").notNull(),
  fileType: text("fileType").notNull(),
  editUrl: text("editUrl").notNull(),
  isPremium: boolean("isPremium").notNull().default(false),
  isVisible: boolean("isVisible").notNull().default(true),
  categoryId: integer("categoryId").notNull().references(() => categories.id),
  collectionId: integer("collectionId").notNull().references(() => collections.id),
  designerid: integer("designerid").references(() => users.id),
  viewcount: integer("viewcount").notNull().default(0),
  width: integer("width"),
  height: integer("height"),
  aspectratio: text("aspectratio"),
  groupId: text("groupId"), // ID para agrupar artes relacionadas em diferentes formatos
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const insertArtSchema = createInsertSchema(arts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Testimonial schema
export const testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  company: text("company").notNull(),
  avatarUrl: text("avatarUrl").notNull(),
  rating: integer("rating").notNull(),
  quote: text("quote").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const insertTestimonialSchema = createInsertSchema(testimonials).omit({
  id: true,
  createdAt: true,
});

// Preferências de Usuário
export const userPreferences = pgTable("userPreferences", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id).unique(),
  emailNotifications: boolean("emailNotifications").notNull().default(true),
  darkMode: boolean("darkMode").notNull().default(false),
  language: text("language").notNull().default("pt-BR"),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  updatedAt: true,
});

// Estatísticas de usuário
export const userStats = pgTable("userStats", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id).unique(),
  totalDownloads: integer("totalDownloads").notNull().default(0),
  totalFavorites: integer("totalFavorites").notNull().default(0),
  totalViews: integer("totalViews").notNull().default(0),
  lastActivityDate: timestamp("lastActivityDate").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const insertUserStatsSchema = createInsertSchema(userStats).omit({
  id: true,
  updatedAt: true,
});

// Types
export type NivelAcesso = 'visitante' | 'usuario' | 'premium' | 'designer' | 'designer_adm' | 'suporte' | 'admin';
export type OrigemAssinatura = 'hotmart' | 'manual' | 'auto' | 'nenhuma';
export type TipoPlano = 'mensal' | 'anual' | 'personalizado' | 'vitalicio';

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type UserStats = typeof userStats.$inferSelect;
export type InsertUserStats = z.infer<typeof insertUserStatsSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Format = typeof formats.$inferSelect;
export type InsertFormat = z.infer<typeof insertFormatSchema>;

export type FileType = typeof fileTypes.$inferSelect;
export type InsertFileType = z.infer<typeof insertFileTypeSchema>;

export type Collection = typeof collections.$inferSelect;
export type InsertCollection = z.infer<typeof insertCollectionSchema>;

export type Art = typeof arts.$inferSelect;
export type InsertArt = z.infer<typeof insertArtSchema>;

// Favorites schema
export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id),
  artId: integer("artId").notNull().references(() => arts.id),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true,
});

// Views schema
export const views = pgTable("views", {
  id: serial("id").primaryKey(),
  userId: integer("userId").references(() => users.id),
  artId: integer("artId").notNull().references(() => arts.id),
  sourceIP: text("sourceIP"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const insertViewSchema = createInsertSchema(views).omit({
  id: true,
  createdAt: true,
});

// Downloads schema
export const downloads = pgTable("downloads", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id),
  artId: integer("artId").notNull().references(() => arts.id),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const insertDownloadSchema = createInsertSchema(downloads).omit({
  id: true,
  createdAt: true,
});

// Subscriptions schema
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id).unique(),
  planType: text("planType").notNull().default("premium"),
  status: text("status").notNull().default("active"), // active, canceled, pending
  startDate: timestamp("startDate").notNull().defaultNow(),
  endDate: timestamp("endDate"),
  webhookData: text("webhookData"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Community posts schema
export const communityPosts = pgTable("communityPosts", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  imageUrl: text("imageUrl").notNull(),
  editLink: text("editLink"), // Link para o Canva ou Google Slides para edição
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  viewCount: integer("viewCount").default(0).notNull(), // Renomeado de views para viewCount para consistência
  featuredUntil: timestamp("featuredUntil"),
  isWeeklyFeatured: boolean("isWeeklyFeatured").default(false).notNull(),
  isPinned: boolean("isPinned").default(false).notNull(), // Indica se o post está fixado no topo
});

export const insertCommunityPostSchema = createInsertSchema(communityPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  viewCount: true,
  featuredUntil: true,
  isWeeklyFeatured: true,
  isPinned: true,
});

export type Testimonial = typeof testimonials.$inferSelect;
export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;

export type View = typeof views.$inferSelect;
export type InsertView = z.infer<typeof insertViewSchema>;

export type Download = typeof downloads.$inferSelect;
export type InsertDownload = z.infer<typeof insertDownloadSchema>;

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

export type CommunityPost = typeof communityPosts.$inferSelect;
export type InsertCommunityPost = z.infer<typeof insertCommunityPostSchema>;

// Comentários da comunidade
export const communityComments = pgTable("communityComments", {
  id: serial("id").primaryKey(),
  postId: integer("postId").notNull().references(() => communityPosts.id),
  userId: integer("userId").notNull().references(() => users.id),
  content: text("content").notNull(),
  isHidden: boolean("isHidden").notNull().default(false),
  parentId: integer("parentId").references(() => communityComments.id), // Para respostas a comentários
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const insertCommunityCommentSchema = createInsertSchema(communityComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CommunityComment = typeof communityComments.$inferSelect;
export type InsertCommunityComment = z.infer<typeof insertCommunityCommentSchema>;

// Comentários em vídeos/videoaulas
export const videoComments = pgTable("videoComments", {
  id: serial("id").primaryKey(),
  lessonId: integer("lessonId").notNull().references(() => courseLessons.id),
  userId: integer("userId").notNull().references(() => users.id),
  content: text("content").notNull(),
  isHidden: boolean("isHidden").notNull().default(false),
  likes: integer("likes").notNull().default(0),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const insertVideoCommentSchema = createInsertSchema(videoComments).omit({
  id: true,
  likes: true,
  createdAt: true,
  updatedAt: true,
});

export type VideoComment = typeof videoComments.$inferSelect;
export type InsertVideoComment = z.infer<typeof insertVideoCommentSchema>;

// Designer Stats para artes
export const designerStats = pgTable("designerStats", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id),
  artId: integer("artId").notNull().references(() => arts.id),
  downloadCount: integer("downloadCount").notNull().default(0),
  viewCount: integer("viewCount").notNull().default(0),
  favoriteCount: integer("favoriteCount").notNull().default(0),
  conversionRate: integer("conversionRate").notNull().default(0), // em percentual x100 (ex: 2550 = 25.5%)
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const insertDesignerStatsSchema = createInsertSchema(designerStats).omit({
  id: true,
  updatedAt: true,
});

export type DesignerStat = typeof designerStats.$inferSelect;
export type InsertDesignerStat = z.infer<typeof insertDesignerStatsSchema>;

// Permissões de acesso explícitas (usadas em cenários especiais)
export const userPermissions = pgTable("userPermissions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id),
  permission: text("permission").notNull(), // formato "recurso:ação" (ex: "arts:edit", "users:view")
  grantedBy: integer("grantedBy").references(() => users.id),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const insertUserPermissionSchema = createInsertSchema(userPermissions).omit({
  id: true,
  createdAt: true,
});

export type UserPermission = typeof userPermissions.$inferSelect;
export type InsertUserPermission = z.infer<typeof insertUserPermissionSchema>;

// Categorias de Ferramentas Úteis
export const ferramentasCategorias = pgTable("ferramentasCategorias", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  slug: text("slug").notNull().unique(),
  descricao: text("descricao"),
  icone: text("icone"), // nome do ícone do Lucide React
  ordem: integer("ordem").default(0),
  criadoEm: timestamp("criadoEm").notNull().defaultNow(),
  atualizadoEm: timestamp("atualizadoEm").notNull().defaultNow(),
  ativo: boolean("ativo").default(true),
});

export const insertFerramentaCategoriaSchema = createInsertSchema(ferramentasCategorias, {
  nome: z.string().min(2, "Nome precisa ter pelo menos 2 caracteres"),
  slug: z.string().min(2, "Slug precisa ter pelo menos 2 caracteres"),
  descricao: z.string().optional(),
  icone: z.string().optional(),
  ordem: z.number().int().optional(),
  ativo: z.boolean().optional(),
}).omit({
  id: true,
  criadoEm: true,
  atualizadoEm: true,
});

// Ferramentas Úteis
export const ferramentas = pgTable("ferramentas", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  descricao: text("descricao"),
  imageUrl: text("imageUrl"),
  websiteUrl: text("websiteUrl").notNull(),
  isExterno: boolean("isExterno").default(true),
  isNovo: boolean("isNovo").default(false),
  isPopular: boolean("isPopular").default(false),
  categoriaId: integer("categoriaId").notNull().references(() => ferramentasCategorias.id),
  ordem: integer("ordem").default(0),
  criadoEm: timestamp("criadoEm").notNull().defaultNow(),
  atualizadoEm: timestamp("atualizadoEm").notNull().defaultNow(),
  ativo: boolean("ativo").default(true),
});

export const insertFerramentaSchema = createInsertSchema(ferramentas, {
  nome: z.string().min(2, "Nome precisa ter pelo menos 2 caracteres"),
  descricao: z.string().optional(),
  imageUrl: z.string().optional(),
  websiteUrl: z.string().url("URL inválida"),
  isExterno: z.boolean().optional(),
  isNovo: z.boolean().optional(),
  isPopular: z.boolean().optional(),
  categoriaId: z.number().int().positive(),
  ordem: z.number().int().optional(),
  ativo: z.boolean().optional(),
}).omit({
  id: true,
  criadoEm: true,
  atualizadoEm: true,
});

// Relações
export const ferramentasCategoriasRelations = relations(ferramentasCategorias, ({ many }) => ({
  ferramentas: many(ferramentas),
}));

export const ferramentasRelations = relations(ferramentas, ({ one }) => ({
  categoria: one(ferramentasCategorias, {
    fields: [ferramentas.categoriaId],
    references: [ferramentasCategorias.id],
  }),
}));

// User Follow (relação seguidor-seguido)
export const userFollows = pgTable("userFollows", {
  id: serial("id").primaryKey(),
  followerId: integer("followerId").notNull().references(() => users.id),
  followingId: integer("followingId").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
}, (table) => {
  return {
    userFollowsUnique: primaryKey({ columns: [table.followerId, table.followingId] }),
  };
});

export const insertUserFollowSchema = createInsertSchema(userFollows).omit({
  id: true,
  createdAt: true,
});

export type UserFollow = typeof userFollows.$inferSelect;
export type InsertUserFollow = z.infer<typeof insertUserFollowSchema>;

// Site settings schema
export const siteSettings = pgTable("siteSettings", {
  id: serial("id").primaryKey(),
  logoUrl: text("logoUrl").notNull().default("/images/logo.png"),
  faviconUrl: text("faviconUrl").notNull().default("/favicon.ico"),
  siteName: text("siteName").notNull().default("DesignAuto"),
  primaryColor: text("primaryColor").notNull().default("#1e40af"),
  footerText: text("footerText").notNull().default("© DesignAuto App. Todos os direitos reservados."),
  metaDescription: text("metaDescription").notNull().default("Plataforma de designs automotivos personalizáveis"),
  contactEmail: text("contactEmail").notNull().default("contato@designauto.app"),
  // Configurações da página de videoaulas
  courseHeroTitle: text("courseHeroTitle").default("DesignAuto Videoaulas"),
  courseHeroSubtitle: text("courseHeroSubtitle").default("A formação completa para você criar designs profissionais para seu negócio automotivo"),
  courseHeroImageUrl: text("courseHeroImageUrl").default("https://images.unsplash.com/photo-1617651823081-270acchia626?q=80&w=1970&auto=format&fit=crop"),
  courseRating: text("courseRating").default("4.8"),
  courseReviewCount: integer("courseReviewCount").default(287),
  courseTotalHours: text("courseTotalHours").default("42 horas"),
  courseTotalModules: integer("courseTotalModules").default(18),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  updatedBy: integer("updatedBy").references(() => users.id),
});

export const siteSettingsRelations = relations(siteSettings, ({ one }) => ({
  updatedByUser: one(users, {
    fields: [siteSettings.updatedBy],
    references: [users.id],
  }),
}));

export const insertSiteSettingsSchema = createInsertSchema(siteSettings).omit({
  id: true,
  updatedAt: true,
});

export type SiteSettings = typeof siteSettings.$inferSelect;
export type InsertSiteSettings = z.infer<typeof insertSiteSettingsSchema>;

// Nota: A configuração do PWA já está definida no final do arquivo

// Tabela para armazenar códigos de verificação de e-mail
export const emailVerificationCodes = pgTable("emailVerificationCodes", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id),
  email: text("email").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  usedAt: timestamp("usedAt"),
  isUsed: boolean("isUsed").notNull().default(false),
});

export const emailVerificationCodesRelations = relations(emailVerificationCodes, ({ one }) => ({
  user: one(users, {
    fields: [emailVerificationCodes.userId],
    references: [users.id],
  }),
}));

export const insertEmailVerificationCodeSchema = createInsertSchema(emailVerificationCodes).omit({
  id: true,
  createdAt: true,
});

export type EmailVerificationCode = typeof emailVerificationCodes.$inferSelect;
export type InsertEmailVerificationCode = z.infer<typeof insertEmailVerificationCodeSchema>;

// Tabela para armazenar tokens de redefinição de senha
export const passwordResetTokens = pgTable("passwordResetTokens", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  usedAt: timestamp("usedAt"),
  isUsed: boolean("isUsed").notNull().default(false),
});

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id],
  }),
}));

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  createdAt: true,
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;

// Videoaulas: Módulos
// Videoaulas: Cursos 
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnailUrl"),
  featuredImage: text("featuredImage"),
  level: text("level").notNull().default("iniciante"), // iniciante, intermediario, avancado
  status: text("status").notNull().default("active"), // active, draft, archived
  isPublished: boolean("isPublished").notNull().default(true),
  isPremium: boolean("isPremium").notNull().default(false),
  createdBy: integer("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const courseModules = pgTable("courseModules", {
  id: serial("id").primaryKey(),
  courseId: integer("courseId").references(() => courses.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  thumbnailUrl: text("thumbnailUrl").notNull(),
  level: text("level").notNull().default("iniciante"), // iniciante, intermediario, avancado
  order: integer("order").notNull(),
  isActive: boolean("isActive").notNull().default(true),
  isPremium: boolean("isPremium").notNull().default(false),
  createdBy: integer("createdBy").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// Videoaulas: Aulas
export const courseLessons = pgTable("courseLessons", {
  id: serial("id").primaryKey(),
  moduleId: integer("moduleId").notNull().references(() => courseModules.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  videoUrl: text("videoUrl").notNull(),
  videoProvider: text("videoProvider").notNull(), // youtube, vimeo, vturb, panda
  duration: integer("duration"), // em segundos
  thumbnailUrl: text("thumbnailUrl"),
  order: integer("order").notNull(),
  isPremium: boolean("isPremium").notNull().default(false),
  showLessonNumber: boolean("showLessonNumber").notNull().default(true), // Controla se o número da aula aparece na thumb
  additionalMaterialsUrl: text("additionalMaterialsUrl"),
  viewCount: integer("viewCount").default(0), // Contador de visualizações
  createdBy: integer("createdBy").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// Videoaulas: Progresso do usuário
export const courseProgress = pgTable("courseProgress", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id),
  lessonId: integer("lessonId").notNull().references(() => courseLessons.id),
  progress: integer("progress").notNull().default(0), // 0-100 (porcentagem)
  isCompleted: boolean("isCompleted").notNull().default(false),
  lastWatchedAt: timestamp("lastWatchedAt").notNull().defaultNow(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
}, (table) => {
  return {
    uniqueUserLesson: primaryKey({ columns: [table.userId, table.lessonId] }),
  };
});

// Videoaulas: Avaliações
export const courseRatings = pgTable("courseRatings", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id),
  lessonId: integer("lessonId").references(() => courseLessons.id),
  courseId: integer("courseId").references(() => courses.id),
  rating: integer("rating").notNull(), // 1-5 estrelas
  comment: text("comment"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// Videoaulas: Configurações
export const courseSettings = pgTable("courseSettings", {
  id: serial("id").primaryKey(),
  bannerTitle: text("bannerTitle"),
  bannerDescription: text("bannerDescription"),
  bannerImageUrl: text("bannerImageUrl"),
  welcomeMessage: text("welcomeMessage"),
  showModuleNumbers: boolean("showModuleNumbers").default(true),
  useCustomPlayerColors: boolean("useCustomPlayerColors").default(false),
  enableComments: boolean("enableComments").default(true),
  allowNonPremiumEnrollment: boolean("allowNonPremiumEnrollment").default(false),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  updatedBy: integer("updatedBy").references(() => users.id),
});

// Definindo relações após todas as tabelas estarem criadas
export const coursesRelations = relations(courses, ({ one, many }) => ({
  creator: one(users, {
    fields: [courses.createdBy],
    references: [users.id],
  }),
  modules: many(courseModules),
  ratings: many(courseRatings, { relationName: 'courseRatings' }),
}));

export const courseModulesRelations = relations(courseModules, ({ one, many }) => ({
  course: one(courses, {
    fields: [courseModules.courseId],
    references: [courses.id],
  }),
  creator: one(users, {
    fields: [courseModules.createdBy],
    references: [users.id],
  }),
  lessons: many(courseLessons),
}));

export const courseLessonsRelations = relations(courseLessons, ({ one, many }) => ({
  module: one(courseModules, {
    fields: [courseLessons.moduleId],
    references: [courseModules.id],
  }),
  creator: one(users, {
    fields: [courseLessons.createdBy],
    references: [users.id],
  }),
  progress: many(courseProgress),
  ratings: many(courseRatings),
  comments: many(videoComments),
}));

export const courseProgressRelations = relations(courseProgress, ({ one }) => ({
  user: one(users, {
    fields: [courseProgress.userId],
    references: [users.id],
  }),
  lesson: one(courseLessons, {
    fields: [courseProgress.lessonId],
    references: [courseLessons.id],
  }),
}));

export const courseRatingsRelations = relations(courseRatings, ({ one }) => ({
  user: one(users, {
    fields: [courseRatings.userId],
    references: [users.id],
  }),
  lesson: one(courseLessons, {
    fields: [courseRatings.lessonId],
    references: [courseLessons.id],
    relationName: 'lessonRatings',
  }),
  course: one(courses, {
    fields: [courseRatings.courseId],
    references: [courses.id],
    relationName: 'courseRatings',
  }),
}));

// Schemas de inserção
export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCourseModuleSchema = createInsertSchema(courseModules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCourseLessonSchema = createInsertSchema(courseLessons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCourseProgressSchema = createInsertSchema(courseProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCourseRatingSchema = createInsertSchema(courseRatings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Tipos para videoaulas
export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;

export type CourseModule = typeof courseModules.$inferSelect;
export type InsertCourseModule = z.infer<typeof insertCourseModuleSchema>;

export type CourseLesson = typeof courseLessons.$inferSelect;
export type InsertCourseLesson = z.infer<typeof insertCourseLessonSchema>;

export type CourseProgress = typeof courseProgress.$inferSelect;
export type InsertCourseProgress = z.infer<typeof insertCourseProgressSchema>;

export type CourseRating = typeof courseRatings.$inferSelect;
export type InsertCourseRating = z.infer<typeof insertCourseRatingSchema>;

// Popups promocionais
export const popups = pgTable("popups", {
  id: serial("id").primaryKey(),
  title: text("title"),
  content: text("content"),
  imageUrl: text("imageUrl"),
  buttonText: text("buttonText"),
  buttonUrl: text("buttonUrl"),
  backgroundColor: text("backgroundColor").default("#FFFFFF"),
  textColor: text("textColor").default("#000000"),
  buttonColor: text("buttonColor").default("#4F46E5"),
  buttonTextColor: text("buttonTextColor").default("#FFFFFF"),
  buttonRadius: integer("buttonradius").default(4), // Raio de arredondamento do botão em pixels
  buttonWidth: text("buttonwidth").default("auto"), // Largura do botão: auto, 100%, 75%, 50%, 25%
  position: text("position").default("center"), // center, top-left, top-right, bottom-left, bottom-right
  size: text("size").default("medium"), // small, medium, large
  animation: text("animation").default("fade"), // fade, slide, zoom
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  showOnce: boolean("showOnce").default(false),
  showToLoggedUsers: boolean("showToLoggedUsers").default(true),
  showToGuestUsers: boolean("showToGuestUsers").default(true),
  showToPremiumUsers: boolean("showToPremiumUsers").default(true),
  frequency: integer("frequency").default(1), // 1 = show every time, 2 = show every 2 times, etc.
  delay: integer("delay").default(2), // delay in seconds before showing the popup
  isActive: boolean("isActive").default(true),
  createdBy: integer("createdBy").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  pages: text("pages").array(), // Lista de IDs das páginas onde o popup será exibido
  userRoles: text("userroles").array(), // Lista de roles que podem ver o popup
});

export const insertPopupSchema = createInsertSchema(popups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Registro de visualizações de popups
export const popupViews = pgTable("popupViews", {
  id: serial("id").primaryKey(),
  popupId: integer("popupId").notNull().references(() => popups.id),
  userId: integer("userId").references(() => users.id),
  sessionId: text("sessionId"),
  action: text("action").default("view"), // view, click, dismiss
  viewedAt: timestamp("viewedAt").notNull().defaultNow(),
});

export const insertPopupViewSchema = createInsertSchema(popupViews).omit({
  id: true,
  viewedAt: true,
});

export type Popup = typeof popups.$inferSelect;
export type InsertPopup = z.infer<typeof insertPopupSchema>;
export type PopupView = typeof popupViews.$inferSelect;
export type InsertPopupView = z.infer<typeof insertPopupViewSchema>;

// Relations para popups
export const popupsRelations = relations(popups, ({ one, many }) => ({
  creator: one(users, {
    fields: [popups.createdBy],
    references: [users.id],
  }),
  views: many(popupViews),
}));

export const popupViewsRelations = relations(popupViews, ({ one }) => ({
  popup: one(popups, {
    fields: [popupViews.popupId],
    references: [popups.id],
  }),
  user: one(users, {
    fields: [popupViews.userId],
    references: [users.id],
  }),
}));

// Community Likes (Curtidas em posts da comunidade)
export const communityLikes = pgTable("communityLikes", {
  id: serial("id").primaryKey(),
  postId: integer("postId").notNull().references(() => communityPosts.id, { onDelete: "cascade" }),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
}, (table) => {
  return {
    postUserUnique: primaryKey({ columns: [table.postId, table.userId] }),
  };
});

export const insertCommunityLikeSchema = createInsertSchema(communityLikes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Community Comment Likes (Curtidas em comentários)
export const communityCommentLikes = pgTable("communityCommentLikes", {
  id: serial("id").primaryKey(),
  commentId: integer("commentId").notNull().references(() => communityComments.id, { onDelete: "cascade" }),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
}, (table) => {
  return {
    commentUserUnique: primaryKey({ columns: [table.commentId, table.userId] }),
  };
});

export const insertCommunityCommentLikeSchema = createInsertSchema(communityCommentLikes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CommunityCommentLike = typeof communityCommentLikes.$inferSelect;
export type InsertCommunityCommentLike = z.infer<typeof insertCommunityCommentLikeSchema>;

// Community Saves (Salvamentos em posts da comunidade)
export const communitySaves = pgTable("communitySaves", {
  id: serial("id").primaryKey(),
  postId: integer("postId").notNull().references(() => communityPosts.id, { onDelete: "cascade" }),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
}, (table) => {
  return {
    postUserUnique: primaryKey({ columns: [table.postId, table.userId] }),
  };
});

export const insertCommunitySaveSchema = createInsertSchema(communitySaves).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Community Points (Sistema de pontos para gamificação)
export const communityPoints = pgTable("communityPoints", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  points: integer("points").notNull(),
  reason: text("reason").notNull(), // post, like, save, weekly_featured
  sourceId: integer("sourceId"), // ID relacionado (post, comment, etc)
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  period: text("period").notNull(), // Formato: YYYY-MM (ano-mês)
});

export const insertCommunityPointSchema = createInsertSchema(communityPoints).omit({
  id: true,
  createdAt: true,
});

// Community Leaderboard (Ranking de usuários por pontos)
export const communityLeaderboard = pgTable("communityLeaderboard", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  totalPoints: integer("totalPoints").default(0).notNull(),
  postCount: integer("postCount").default(0).notNull(),
  likesReceived: integer("likesReceived").default(0).notNull(),
  savesReceived: integer("savesReceived").default(0).notNull(),
  featuredCount: integer("featuredCount").default(0).notNull(),
  period: text("period").notNull(), // all_time, YYYY (ano), YYYY-MM (ano-mês), YYYY-WW (ano-semana)
  rank: integer("rank").default(0).notNull(),
  level: text("level").default("Iniciante KDG").notNull(),
  lastUpdated: timestamp("lastUpdated").defaultNow().notNull(),
}, (table) => {
  return {
    userPeriodUnique: primaryKey({ columns: [table.userId, table.period] }),
  };
});

export const insertCommunityLeaderboardSchema = createInsertSchema(communityLeaderboard).omit({
  id: true,
  lastUpdated: true,
});

// Community Settings (Configurações do sistema de comunidade e gamificação)
export const communitySettings = pgTable("communitySettings", {
  id: serial("id").primaryKey(),
  pointsForPost: integer("pointsForPost").default(5).notNull(),
  pointsForLike: integer("pointsForLike").default(1).notNull(),
  pointsForSave: integer("pointsForSave").default(2).notNull(),
  pointsForWeeklyFeatured: integer("pointsForWeeklyFeatured").default(5).notNull(),
  prize1stPlace: text("prize1stPlace").default("R$ 0").notNull(),
  prize2ndPlace: text("prize2ndPlace").default("R$ 0").notNull(),
  prize3rdPlace: text("prize3rdPlace").default("R$ 0").notNull(),
  levelThresholds: jsonb("levelThresholds").default({
    "Iniciante KDG": 0,
    "Colaborador KDG": 501,
    "Destaque KDG": 2001,
    "Elite KDG": 5001,
    "Lenda KDG": 10001
  }).notNull(),
  requireApproval: boolean("requireApproval").default(true).notNull(),
  allowComments: boolean("allowComments").default(true).notNull(),
  showRanking: boolean("showRanking").default(true).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  updatedBy: integer("updatedBy").references(() => users.id),
});

export const insertCommunitySettingsSchema = createInsertSchema(communitySettings).omit({
  id: true,
  updatedAt: true,
});

// Adicionando relações entre as tabelas
export const communityPostsRelations = relations(communityPosts, ({ one, many }) => ({
  user: one(users, {
    fields: [communityPosts.userId],
    references: [users.id],
  }),
  likes: many(communityLikes),
  saves: many(communitySaves),
  comments: many(communityComments),
}));

export const communityLikesRelations = relations(communityLikes, ({ one }) => ({
  post: one(communityPosts, {
    fields: [communityLikes.postId],
    references: [communityPosts.id],
  }),
  user: one(users, {
    fields: [communityLikes.userId],
    references: [users.id],
  }),
}));

export const communitySavesRelations = relations(communitySaves, ({ one }) => ({
  post: one(communityPosts, {
    fields: [communitySaves.postId],
    references: [communityPosts.id],
  }),
  user: one(users, {
    fields: [communitySaves.userId],
    references: [users.id],
  }),
}));

export const communityCommentsRelations = relations(communityComments, ({ one, many }) => ({
  post: one(communityPosts, {
    fields: [communityComments.postId],
    references: [communityPosts.id],
  }),
  user: one(users, {
    fields: [communityComments.userId],
    references: [users.id],
  }),
  parent: one(communityComments, {
    fields: [communityComments.parentId],
    references: [communityComments.id],
  }),
  likes: many(communityCommentLikes),
}));

// Relações para curtidas em comentários
export const communityCommentLikesRelations = relations(communityCommentLikes, ({ one }) => ({
  comment: one(communityComments, {
    fields: [communityCommentLikes.commentId],
    references: [communityComments.id],
  }),
  user: one(users, {
    fields: [communityCommentLikes.userId],
    references: [users.id],
  }),
}));

export const communityPointsRelations = relations(communityPoints, ({ one }) => ({
  user: one(users, {
    fields: [communityPoints.userId],
    references: [users.id],
  }),
}));

export const communityLeaderboardRelations = relations(communityLeaderboard, ({ one }) => ({
  user: one(users, {
    fields: [communityLeaderboard.userId],
    references: [users.id],
  }),
}));

export const communitySettingsRelations = relations(communitySettings, ({ one }) => ({
  updatedByUser: one(users, {
    fields: [communitySettings.updatedBy],
    references: [users.id],
  }),
}));

// Tipos para o sistema de comunidade
export type CommunityLike = typeof communityLikes.$inferSelect;
export type InsertCommunityLike = z.infer<typeof insertCommunityLikeSchema>;

export type CommunitySave = typeof communitySaves.$inferSelect;
export type InsertCommunitySave = z.infer<typeof insertCommunitySaveSchema>;

export type CommunityPoint = typeof communityPoints.$inferSelect;
export type InsertCommunityPoint = z.infer<typeof insertCommunityPointSchema>;

export type CommunityLeaderboard = typeof communityLeaderboard.$inferSelect;
export type InsertCommunityLeaderboard = z.infer<typeof insertCommunityLeaderboardSchema>;

export type CommunitySettings = typeof communitySettings.$inferSelect;
export type InsertCommunitySettings = z.infer<typeof insertCommunitySettingsSchema>;

// Tipos para Ferramentas Úteis
export type FerramentaCategoria = typeof ferramentasCategorias.$inferSelect;
export type InsertFerramentaCategoria = z.infer<typeof insertFerramentaCategoriaSchema>;

export type Ferramenta = typeof ferramentas.$inferSelect;
export type InsertFerramenta = z.infer<typeof insertFerramentaSchema>;

// Tabela para armazenar as configurações de analytics
export const analyticsSettings = pgTable('analyticsSettings', {
  id: serial('id').primaryKey(),
  
  // Meta Pixel (Facebook Pixel)
  metaPixelId: text('metaPixelId'),
  metaAdsEnabled: boolean('metaAdsEnabled').default(false),
  metaAdsAccessToken: text('metaAdsAccessToken'),
  
  // Google Analytics 4
  ga4MeasurementId: text('ga4MeasurementId'),
  ga4ApiSecret: text('ga4ApiSecret'),
  
  // Google Tag Manager
  gtmContainerId: text('gtmContainerId'),
  
  // Microsoft Clarity
  clarityProjectId: text('clarityProjectId'),
  
  // Hotjar
  hotjarSiteId: text('hotjarSiteId'),
  
  // LinkedIn Insight Tag
  linkedinPartnerId: text('linkedinPartnerId'),
  
  // TikTok Pixel
  tiktokPixelId: text('tiktokPixelId'),
  
  // Amplitude ou Mixpanel
  amplitudeApiKey: text('amplitudeApiKey'),
  mixpanelToken: text('mixpanelToken'),
  
  // Status de ativação para cada serviço
  metaPixelEnabled: boolean('metaPixelEnabled').default(false),
  ga4Enabled: boolean('ga4Enabled').default(false),
  gtmEnabled: boolean('gtmEnabled').default(false),
  clarityEnabled: boolean('clarityEnabled').default(false),
  hotjarEnabled: boolean('hotjarEnabled').default(false),
  linkedinEnabled: boolean('linkedinEnabled').default(false),
  tiktokEnabled: boolean('tiktokEnabled').default(false),
  amplitudeEnabled: boolean('amplitudeEnabled').default(false),
  mixpanelEnabled: boolean('mixpanelEnabled').default(false),
  
  // Configurações de eventos
  trackPageviews: boolean('trackPageviews').default(true),
  trackClicks: boolean('trackClicks').default(false),
  trackFormSubmissions: boolean('trackFormSubmissions').default(false),
  trackArtsViewed: boolean('trackArtsViewed').default(true),
  trackArtsDownloaded: boolean('trackArtsDownloaded').default(true),
  
  // Scripts personalizados
  customScriptHead: text('customScriptHead'),
  customScriptBody: text('customScriptBody'),
  customScriptEnabled: boolean('customScriptEnabled').default(false),
  
  // Metadados 
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  updatedBy: integer('updatedBy')
});

// Schema para inserção
export const insertAnalyticsSettingsSchema = createInsertSchema(analyticsSettings, {
  metaPixelId: z.string().trim().optional(),
  metaAdsAccessToken: z.string().trim().optional(),
  ga4MeasurementId: z.string().trim().optional(),
  ga4ApiSecret: z.string().trim().optional(), 
  gtmContainerId: z.string().trim().optional(),
  clarityProjectId: z.string().trim().optional(),
  hotjarSiteId: z.string().trim().optional(),
  linkedinPartnerId: z.string().trim().optional(),
  tiktokPixelId: z.string().trim().optional(),
  amplitudeApiKey: z.string().trim().optional(),
  mixpanelToken: z.string().trim().optional(),
  customScriptHead: z.string().trim().optional(),
  customScriptBody: z.string().trim().optional()
}).omit({ id: true });

// Tipos derivados
export type AnalyticsSettings = typeof analyticsSettings.$inferSelect;
export type InsertAnalyticsSettings = z.infer<typeof insertAnalyticsSettingsSchema>;

// Sistema de denúncias
export const reportTypes = pgTable("reportTypes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  userId: integer("userId").references(() => users.id),
  artId: integer("artId").references(() => arts.id),
  reportTypeId: integer("reportTypeId").references(() => reportTypes.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  evidence: text("evidence"),
  status: text("status").notNull().default('pendente'),
  adminResponse: text("adminResponse"),
  respondedBy: integer("respondedBy").references(() => users.id),
  respondedAt: timestamp("respondedAt"),
  isResolved: boolean("isResolved").default(false).notNull(),
  resolvedAt: timestamp("resolvedat"), // Mantendo a coluna do banco como "resolvedat" mas usando "resolvedAt" no código
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const reportRelations = relations(reports, ({ one }) => ({
  user: one(users, {
    fields: [reports.userId],
    references: [users.id],
  }),
  art: one(arts, {
    fields: [reports.artId],
    references: [arts.id],
  }),
  reportType: one(reportTypes, {
    fields: [reports.reportTypeId],
    references: [reportTypes.id],
  }),
  admin: one(users, {
    fields: [reports.respondedBy],
    references: [users.id],
  }),
}));

export const insertReportTypeSchema = createInsertSchema(reportTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  respondedAt: true,
  status: true,
  adminResponse: true,
  respondedBy: true,
  isResolved: true,
});

// Tabela para configurações do PWA
export const appConfig = pgTable("app_config", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().default("DesignAuto"),
  short_name: text("short_name").notNull().default("DesignAuto"),
  theme_color: text("theme_color").notNull().default("#1e40af"),
  background_color: text("background_color").notNull().default("#ffffff"),
  icon_192: text("icon_192").notNull().default("/icons/icon-192.png"),
  icon_512: text("icon_512").notNull().default("/icons/icon-512.png"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
  updated_by: integer("updated_by").references(() => users.id),
});

export const appConfigRelations = relations(appConfig, ({ one }) => ({
  updatedByUser: one(users, {
    fields: [appConfig.updated_by],
    references: [users.id],
  }),
}));

export const insertAppConfigSchema = createInsertSchema(appConfig).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type AppConfig = typeof appConfig.$inferSelect;
export type InsertAppConfig = z.infer<typeof insertAppConfigSchema>;

export type ReportType = typeof reportTypes.$inferSelect;
export type InsertReportType = z.infer<typeof insertReportTypeSchema>;
export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;

// Schema para logs de webhooks
export const webhookLogs = pgTable("webhookLogs", {
  id: serial("id").primaryKey(),
  eventType: text("eventType").notNull(),
  payloadData: text("payloadData"),
  status: text("status").notNull(),
  errorMessage: text("errorMessage"),
  userId: integer("userId").references(() => users.id),
  sourceIp: text("sourceIp"),
  retryCount: integer("retryCount").default(0),
  transactionId: text("transactionId"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const insertWebhookLogSchema = createInsertSchema(webhookLogs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type WebhookLog = typeof webhookLogs.$inferSelect;
export type InsertWebhookLog = z.infer<typeof insertWebhookLogSchema>;

// Schema para configurações de assinaturas
export const subscriptionSettings = pgTable("subscriptionSettings", {
  id: serial("id").primaryKey(),
  // Campos para integração da Hotmart
  webhookUrl: text("webhookUrl"),
  webhookSecretKey: text("webhookSecretKey"),
  hotmartEnvironment: text("hotmartEnvironment").default("sandbox").notNull(),
  hotmartClientId: text("hotmartClientId"),
  hotmartClientSecret: text("hotmartClientSecret"),
  hotmartBasicPlanId: text("hotmartBasicPlanId"),
  hotmartProPlanId: text("hotmartProPlanId"),
  
  // Campos para configurações de comportamento
  defaultSubscriptionDuration: integer("defaultSubscriptionDuration").default(12).notNull(),
  graceHoursAfterExpiration: integer("graceHoursAfterExpiration").default(48).notNull(),
  autoDowngradeAfterExpiration: boolean("autoDowngradeAfterExpiration").default(true).notNull(),
  autoMapProductCodes: boolean("autoMapProductCodes").default(true).notNull(),
  
  // Campos para configurações de notificações
  sendExpirationWarningDays: integer("sendExpirationWarningDays").default(3).notNull(),
  sendExpirationWarningEmails: boolean("sendExpirationWarningEmails").default(true).notNull(),
  notificationEmailSubject: text("notificationEmailSubject"),
  notificationEmailTemplate: text("notificationEmailTemplate"),
  
  // Campos de controle
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const insertSubscriptionSettingsSchema = createInsertSchema(subscriptionSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type SubscriptionSetting = typeof subscriptionSettings.$inferSelect;
export type InsertSubscriptionSetting = z.infer<typeof insertSubscriptionSettingsSchema>;

// Interfaces para estatísticas e tendências de assinaturas
export interface SubscriptionTrendData {
  date: string;
  total: number;
  active: number;
  expired: number;
  growth: number;
}

export interface SubscriptionStats {
  total: number;
  active: number;
  expired: number;
  trial: number;
  expiringIn7Days: number;
  expiringIn30Days: number;
  byOrigin: Record<string, number>;
}
