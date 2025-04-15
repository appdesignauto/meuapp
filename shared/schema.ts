import { pgTable, text, serial, integer, boolean, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("free"), // 'visitor', 'free', 'premium'
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
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

export type Testimonial = typeof testimonials.$inferSelect;
export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;
