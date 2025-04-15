import { relations } from "drizzle-orm/relations";
import { users, downloads, arts, categories, collections, favorites, views, subscriptions, communityPosts, communityComments, designerStats, userPreferences, userStats, userPermissions } from "./schema";

export const downloadsRelations = relations(downloads, ({one}) => ({
	user: one(users, {
		fields: [downloads.userId],
		references: [users.id]
	}),
	art: one(arts, {
		fields: [downloads.artId],
		references: [arts.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	downloads: many(downloads),
	favorites: many(favorites),
	views: many(views),
	subscriptions: many(subscriptions),
	communityPosts: many(communityPosts),
	communityComments: many(communityComments),
	designerStats: many(designerStats),
	userPreferences: many(userPreferences),
	userStats: many(userStats),
	userPermissions_userId: many(userPermissions, {
		relationName: "userPermissions_userId_users_id"
	}),
	userPermissions_grantedBy: many(userPermissions, {
		relationName: "userPermissions_grantedBy_users_id"
	}),
}));

export const artsRelations = relations(arts, ({one, many}) => ({
	downloads: many(downloads),
	category: one(categories, {
		fields: [arts.categoryId],
		references: [categories.id]
	}),
	collection: one(collections, {
		fields: [arts.collectionId],
		references: [collections.id]
	}),
	favorites: many(favorites),
	views: many(views),
	designerStats: many(designerStats),
}));

export const categoriesRelations = relations(categories, ({many}) => ({
	arts: many(arts),
}));

export const collectionsRelations = relations(collections, ({many}) => ({
	arts: many(arts),
}));

export const favoritesRelations = relations(favorites, ({one}) => ({
	user: one(users, {
		fields: [favorites.userId],
		references: [users.id]
	}),
	art: one(arts, {
		fields: [favorites.artId],
		references: [arts.id]
	}),
}));

export const viewsRelations = relations(views, ({one}) => ({
	user: one(users, {
		fields: [views.userId],
		references: [users.id]
	}),
	art: one(arts, {
		fields: [views.artId],
		references: [arts.id]
	}),
}));

export const subscriptionsRelations = relations(subscriptions, ({one}) => ({
	user: one(users, {
		fields: [subscriptions.userId],
		references: [users.id]
	}),
}));

export const communityPostsRelations = relations(communityPosts, ({one, many}) => ({
	user: one(users, {
		fields: [communityPosts.userId],
		references: [users.id]
	}),
	communityComments: many(communityComments),
}));

export const communityCommentsRelations = relations(communityComments, ({one}) => ({
	communityPost: one(communityPosts, {
		fields: [communityComments.postId],
		references: [communityPosts.id]
	}),
	user: one(users, {
		fields: [communityComments.userId],
		references: [users.id]
	}),
}));

export const designerStatsRelations = relations(designerStats, ({one}) => ({
	user: one(users, {
		fields: [designerStats.userId],
		references: [users.id]
	}),
	art: one(arts, {
		fields: [designerStats.artId],
		references: [arts.id]
	}),
}));

export const userPreferencesRelations = relations(userPreferences, ({one}) => ({
	user: one(users, {
		fields: [userPreferences.userId],
		references: [users.id]
	}),
}));

export const userStatsRelations = relations(userStats, ({one}) => ({
	user: one(users, {
		fields: [userStats.userId],
		references: [users.id]
	}),
}));

export const userPermissionsRelations = relations(userPermissions, ({one}) => ({
	user_userId: one(users, {
		fields: [userPermissions.userId],
		references: [users.id],
		relationName: "userPermissions_userId_users_id"
	}),
	user_grantedBy: one(users, {
		fields: [userPermissions.grantedBy],
		references: [users.id],
		relationName: "userPermissions_grantedBy_users_id"
	}),
}));