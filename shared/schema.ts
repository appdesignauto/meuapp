import { pgTable, text, serial, integer, boolean, timestamp, primaryKey, date } from "drizzle-orm/pg-core";
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
  imageUrl: text("imageUrl"),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const insertCommunityPostSchema = createInsertSchema(communityPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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
export const courseModules = pgTable("courseModules", {
  id: serial("id").primaryKey(),
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
  additionalMaterialsUrl: text("additionalMaterialsUrl"),
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
  lessonId: integer("lessonId").notNull().references(() => courseLessons.id),
  rating: integer("rating").notNull(), // 1-5 estrelas
  comment: text("comment"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
}, (table) => {
  return {
    uniqueUserLessonRating: primaryKey({ columns: [table.userId, table.lessonId] }),
  };
});

// Definindo relações após todas as tabelas estarem criadas
export const courseModulesRelations = relations(courseModules, ({ one, many }) => ({
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
  }),
}));

// Schemas de inserção
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
export type CourseModule = typeof courseModules.$inferSelect;
export type InsertCourseModule = z.infer<typeof insertCourseModuleSchema>;

export type CourseLesson = typeof courseLessons.$inferSelect;
export type InsertCourseLesson = z.infer<typeof insertCourseLessonSchema>;

export type CourseProgress = typeof courseProgress.$inferSelect;
export type InsertCourseProgress = z.infer<typeof insertCourseProgressSchema>;

export type CourseRating = typeof courseRatings.$inferSelect;
export type InsertCourseRating = z.infer<typeof insertCourseRatingSchema>;
