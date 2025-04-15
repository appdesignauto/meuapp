CREATE TABLE "arts" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"imageUrl" text NOT NULL,
	"format" text NOT NULL,
	"fileType" text NOT NULL,
	"editUrl" text NOT NULL,
	"isPremium" boolean DEFAULT false NOT NULL,
	"categoryId" integer NOT NULL,
	"collectionId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"imageUrl" text NOT NULL,
	"artCount" integer DEFAULT 0 NOT NULL,
	"formats" text NOT NULL,
	"isPremium" boolean DEFAULT false NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "communityComments" (
	"id" serial PRIMARY KEY NOT NULL,
	"postId" integer NOT NULL,
	"userId" integer NOT NULL,
	"content" text NOT NULL,
	"isHidden" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "communityPosts" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"imageUrl" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "designerStats" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"artId" integer NOT NULL,
	"downloadCount" integer DEFAULT 0 NOT NULL,
	"viewCount" integer DEFAULT 0 NOT NULL,
	"favoriteCount" integer DEFAULT 0 NOT NULL,
	"conversionRate" integer DEFAULT 0 NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "downloads" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"artId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"artId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fileTypes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	CONSTRAINT "fileTypes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "formats" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	CONSTRAINT "formats_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"planType" text DEFAULT 'premium' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"startDate" timestamp DEFAULT now() NOT NULL,
	"endDate" timestamp,
	"webhookData" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "testimonials" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"company" text NOT NULL,
	"avatarUrl" text NOT NULL,
	"rating" integer NOT NULL,
	"quote" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "userPermissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"permission" text NOT NULL,
	"grantedBy" integer,
	"expiresAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "userPreferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"emailNotifications" boolean DEFAULT true NOT NULL,
	"darkMode" boolean DEFAULT false NOT NULL,
	"language" text DEFAULT 'pt-BR' NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "userPreferences_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "userStats" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"totalDownloads" integer DEFAULT 0 NOT NULL,
	"totalFavorites" integer DEFAULT 0 NOT NULL,
	"totalViews" integer DEFAULT 0 NOT NULL,
	"lastActivityDate" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "userStats_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"profileImageUrl" text,
	"bio" text,
	"role" text DEFAULT 'free' NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"lastLogin" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "views" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer,
	"artId" integer NOT NULL,
	"sourceIP" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "arts" ADD CONSTRAINT "arts_categoryId_categories_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "arts" ADD CONSTRAINT "arts_collectionId_collections_id_fk" FOREIGN KEY ("collectionId") REFERENCES "public"."collections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communityComments" ADD CONSTRAINT "communityComments_postId_communityPosts_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."communityPosts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communityComments" ADD CONSTRAINT "communityComments_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communityPosts" ADD CONSTRAINT "communityPosts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "designerStats" ADD CONSTRAINT "designerStats_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "designerStats" ADD CONSTRAINT "designerStats_artId_arts_id_fk" FOREIGN KEY ("artId") REFERENCES "public"."arts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "downloads" ADD CONSTRAINT "downloads_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "downloads" ADD CONSTRAINT "downloads_artId_arts_id_fk" FOREIGN KEY ("artId") REFERENCES "public"."arts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_artId_arts_id_fk" FOREIGN KEY ("artId") REFERENCES "public"."arts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userPermissions" ADD CONSTRAINT "userPermissions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userPermissions" ADD CONSTRAINT "userPermissions_grantedBy_users_id_fk" FOREIGN KEY ("grantedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userPreferences" ADD CONSTRAINT "userPreferences_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userStats" ADD CONSTRAINT "userStats_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "views" ADD CONSTRAINT "views_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "views" ADD CONSTRAINT "views_artId_arts_id_fk" FOREIGN KEY ("artId") REFERENCES "public"."arts"("id") ON DELETE no action ON UPDATE no action;