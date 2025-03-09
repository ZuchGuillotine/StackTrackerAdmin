import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").unique(),
  name: text("name"),
  isAdmin: boolean("is_admin").notNull().default(false),
  isPro: boolean("is_pro").default(false),
});

export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").unique().notNull(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  thumbnailUrl: text("thumbnail_url").notNull(),
  publishedAt: timestamp("published_at").default(sql`CURRENT_TIMESTAMP`),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertBlogPostSchema = createInsertSchema(blogPosts);
export const selectBlogPostSchema = createSelectSchema(blogPosts);

export const referenceData = pgTable("reference_data", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(),
  key: text("key").notNull(),
  value: jsonb("value").notNull(),
});

export const insertReferenceDataSchema = createInsertSchema(referenceData);

// Supplement reference table
export const supplementReference = pgTable("supplement_reference", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = typeof blogPosts.$inferInsert;
export type ReferenceData = typeof referenceData.$inferSelect;
export type SupplementReference = typeof supplementReference.$inferSelect;
import { InferSelectModel, relations } from "drizzle-orm";
import { jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

// Research documents schema
export const researchDocuments = pgTable("research_documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  summary: text("summary").notNull(),
  content: text("content").notNull(),
  imageUrls: jsonb("image_urls").default([]),
  publishedAt: timestamp("published_at", { withTimezone: true }).defaultNow(),
  authors: text("authors"), // Removed .notNull() to make it optional
  tags: jsonb("tags").default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});

export type ResearchDocument = InferSelectModel<typeof researchDocuments>;
export type InsertResearchDocument = Omit<ResearchDocument, "id" | "createdAt" | "updatedAt" | "publishedAt">;
