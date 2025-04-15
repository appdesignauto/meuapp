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
  profileImageUrl: text("profileImageUrl"),
  bio: text("bio"),
  role: text("role").notNull().default("free"), // 'visitor', 'free', 'premium', 'designer', 'designer_adm', 'support', 'admin'
  isActive: boolean("isActive").notNull().default(true),
  lastLogin: timestamp("lastLogin"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  name: true,
  profileImageUrl: true,
  bio: true,
  role: true,
  isActive: true,
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

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

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
