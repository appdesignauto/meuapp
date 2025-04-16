import { pgTable, text, serial, integer, boolean, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  name: text("name"),
  profileimageurl: text("profileimageurl"),
  bio: text("bio"),
  role: text("role").notNull().default("free"), // 'visitor', 'free', 'premium', 'designer', 'designer_adm', 'support', 'admin'
  isactive: boolean("isactive").notNull().default(true),
  lastLogin: timestamp("lastlogin"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  name: true,
  profileimageurl: true,
  bio: true,
  role: true,
  isactive: true,
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
  categoryId: integer("categoryId").notNull().references(() => categories.id),
  collectionId: integer("collectionId").notNull().references(() => collections.id),
  designerid: integer("designerid").references(() => users.id),
  viewcount: integer("viewcount").notNull().default(0),
  width: integer("width"),
  height: integer("height"),
  aspectratio: text("aspectratio"),
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
export type UserRole = 'visitor' | 'free' | 'premium' | 'designer' | 'designer_adm' | 'support' | 'admin';

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
