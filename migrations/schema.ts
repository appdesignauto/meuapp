import { pgTable, serial, text, integer, boolean, timestamp, unique, foreignKey, index, varchar, json } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const collections = pgTable("collections", {
        id: serial().primaryKey().notNull(),
        title: text().notNull(),
        description: text().notNull(),
        imageUrl: text().notNull(),
        artCount: integer().default(0).notNull(),
        formats: text().notNull(),
        isPremium: boolean().default(false).notNull(),
        updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
        createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const categories = pgTable("categories", {
        id: serial().primaryKey().notNull(),
        name: text().notNull(),
        slug: text().notNull(),
}, (table) => [
        unique("categories_slug_unique").on(table.slug),
]);

export const fileTypes = pgTable("fileTypes", {
        id: serial().primaryKey().notNull(),
        name: text().notNull(),
        slug: text().notNull(),
}, (table) => [
        unique("fileTypes_slug_unique").on(table.slug),
]);

export const formats = pgTable("formats", {
        id: serial().primaryKey().notNull(),
        name: text().notNull(),
        slug: text().notNull(),
}, (table) => [
        unique("formats_slug_unique").on(table.slug),
]);

export const testimonials = pgTable("testimonials", {
        id: serial().primaryKey().notNull(),
        name: text().notNull(),
        role: text().notNull(),
        company: text().notNull(),
        avatarUrl: text().notNull(),
        rating: integer().notNull(),
        quote: text().notNull(),
        createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const downloads = pgTable("downloads", {
        id: serial().primaryKey().notNull(),
        userId: integer().notNull(),
        artId: integer().notNull(),
        createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
        foreignKey({
                        columns: [table.userId],
                        foreignColumns: [users.id],
                        name: "downloads_userId_users_id_fk"
                }),
        foreignKey({
                        columns: [table.artId],
                        foreignColumns: [arts.id],
                        name: "downloads_artId_arts_id_fk"
                }),
]);

export const arts = pgTable("arts", {
        id: serial().primaryKey().notNull(),
        title: text().notNull(),
        description: text().default('').notNull(),
        imageUrl: text().notNull(),
        format: text().notNull(),
        fileType: text().notNull(),
        editUrl: text().notNull(),
        isPremium: boolean().default(false).notNull(),
        status: text().default('approved').notNull(), // 'pending', 'approved', 'rejected'
        designerId: integer(),
        categoryId: integer().notNull(),
        collectionId: integer().notNull(),
        downloadCount: integer().default(0).notNull(),
        viewCount: integer().default(0).notNull(),
        likeCount: integer().default(0).notNull(),
        createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
        updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
        foreignKey({
                        columns: [table.categoryId],
                        foreignColumns: [categories.id],
                        name: "arts_categoryId_categories_id_fk"
                }),
        foreignKey({
                        columns: [table.collectionId],
                        foreignColumns: [collections.id],
                        name: "arts_collectionId_collections_id_fk"
                }),
        foreignKey({
                        columns: [table.designerId],
                        foreignColumns: [users.id],
                        name: "arts_designerId_users_id_fk"
                }),
]);

export const favorites = pgTable("favorites", {
        id: serial().primaryKey().notNull(),
        userId: integer().notNull(),
        artId: integer().notNull(),
        createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
        foreignKey({
                        columns: [table.userId],
                        foreignColumns: [users.id],
                        name: "favorites_userId_users_id_fk"
                }),
        foreignKey({
                        columns: [table.artId],
                        foreignColumns: [arts.id],
                        name: "favorites_artId_arts_id_fk"
                }),
]);

export const views = pgTable("views", {
        id: serial().primaryKey().notNull(),
        userId: integer(),
        artId: integer().notNull(),
        sourceIp: text(),
        createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
        foreignKey({
                        columns: [table.userId],
                        foreignColumns: [users.id],
                        name: "views_userId_users_id_fk"
                }),
        foreignKey({
                        columns: [table.artId],
                        foreignColumns: [arts.id],
                        name: "views_artId_arts_id_fk"
                }),
]);

export const users = pgTable("users", {
        id: serial().primaryKey().notNull(),
        username: text().notNull(),
        email: text().notNull(),
        password: text().notNull(),
        name: text(),
        profileImageUrl: text(),
        bio: text(),
        role: text().default('free').notNull(), // 'free', 'premium', 'designer', 'designer_adm', 'support', 'admin'
        isVerified: boolean().default(false).notNull(),
        isActive: boolean().default(true).notNull(),
        following: integer().default(0).notNull(),
        followers: integer().default(0).notNull(),
        lastLogin: timestamp({ mode: 'string' }),
        createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
        updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
        unique("users_username_unique").on(table.username),
        unique("users_email_unique").on(table.email),
]);

export const subscriptions = pgTable("subscriptions", {
        id: serial().primaryKey().notNull(),
        userId: integer().notNull(),
        planType: text().default('premium').notNull(),
        status: text().default('active').notNull(),
        startDate: timestamp({ mode: 'string' }).defaultNow().notNull(),
        endDate: timestamp({ mode: 'string' }),
        webhookData: text(),
        createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
        updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
        foreignKey({
                        columns: [table.userId],
                        foreignColumns: [users.id],
                        name: "subscriptions_userId_users_id_fk"
                }),
        unique("subscriptions_userId_unique").on(table.userId),
]);

export const communityPosts = pgTable("communityPosts", {
        id: serial().primaryKey().notNull(),
        userId: integer().notNull(),
        title: text().notNull(),
        content: text().notNull(),
        imageUrl: text(),
        status: text().default('pending').notNull(),
        createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
        updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
        foreignKey({
                        columns: [table.userId],
                        foreignColumns: [users.id],
                        name: "communityPosts_userId_users_id_fk"
                }),
]);

export const session = pgTable("session", {
        sid: varchar().primaryKey().notNull(),
        sess: json().notNull(),
        expire: timestamp({ precision: 6, mode: 'string' }).notNull(),
}, (table) => [
        index("IDX_session_expire").using("btree", table.expire.asc().nullsLast().op("timestamp_ops")),
]);

export const communityComments = pgTable("communityComments", {
        id: serial().primaryKey().notNull(),
        postId: integer().notNull(),
        userId: integer().notNull(),
        content: text().notNull(),
        isHidden: boolean().default(false).notNull(),
        createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
        updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
        foreignKey({
                        columns: [table.postId],
                        foreignColumns: [communityPosts.id],
                        name: "communityComments_postId_communityPosts_id_fk"
                }),
        foreignKey({
                        columns: [table.userId],
                        foreignColumns: [users.id],
                        name: "communityComments_userId_users_id_fk"
                }),
]);

export const designerStats = pgTable("designerStats", {
        id: serial().primaryKey().notNull(),
        userId: integer().notNull(),
        artId: integer().notNull(),
        downloadCount: integer().default(0).notNull(),
        viewCount: integer().default(0).notNull(),
        favoriteCount: integer().default(0).notNull(),
        conversionRate: integer().default(0).notNull(),
        updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
        foreignKey({
                        columns: [table.userId],
                        foreignColumns: [users.id],
                        name: "designerStats_userId_users_id_fk"
                }),
        foreignKey({
                        columns: [table.artId],
                        foreignColumns: [arts.id],
                        name: "designerStats_artId_arts_id_fk"
                }),
]);

export const userPreferences = pgTable("userPreferences", {
        id: serial().primaryKey().notNull(),
        userId: integer().notNull(),
        emailNotifications: boolean().default(true).notNull(),
        darkMode: boolean().default(false).notNull(),
        language: text().default('pt-BR').notNull(),
        updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
        foreignKey({
                        columns: [table.userId],
                        foreignColumns: [users.id],
                        name: "userPreferences_userId_users_id_fk"
                }),
        unique("userPreferences_userId_unique").on(table.userId),
]);

export const userStats = pgTable("userStats", {
        id: serial().primaryKey().notNull(),
        userId: integer().notNull(),
        totalDownloads: integer().default(0).notNull(),
        totalFavorites: integer().default(0).notNull(),
        totalViews: integer().default(0).notNull(),
        lastActivityDate: timestamp({ mode: 'string' }).defaultNow().notNull(),
        updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
        foreignKey({
                        columns: [table.userId],
                        foreignColumns: [users.id],
                        name: "userStats_userId_users_id_fk"
                }),
        unique("userStats_userId_unique").on(table.userId),
]);

export const userPermissions = pgTable("userPermissions", {
        id: serial().primaryKey().notNull(),
        userId: integer().notNull(),
        permission: text().notNull(),
        grantedBy: integer(),
        expiresAt: timestamp({ mode: 'string' }),
        createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
        foreignKey({
                        columns: [table.userId],
                        foreignColumns: [users.id],
                        name: "userPermissions_userId_users_id_fk"
                }),
        foreignKey({
                        columns: [table.grantedBy],
                        foreignColumns: [users.id],
                        name: "userPermissions_grantedBy_users_id_fk"
                }),
]);

export const userFollows = pgTable("userFollows", {
        id: serial().primaryKey().notNull(),
        followerId: integer().notNull(),
        followingId: integer().notNull(),
        createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
        foreignKey({
                columns: [table.followerId],
                foreignColumns: [users.id],
                name: "userFollows_followerId_users_id_fk"
        }),
        foreignKey({
                columns: [table.followingId],
                foreignColumns: [users.id],
                name: "userFollows_followingId_users_id_fk"
        }),
        unique("userFollows_unique").on(table.followerId, table.followingId),
]);
