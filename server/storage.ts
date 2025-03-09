import { users, type User, type InsertUser } from "@shared/schema";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import postgres from "postgres";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUserByAdminStatus(isAdmin: boolean): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
}

import { blogPosts, type BlogPost, researchDocuments, type ResearchDocument } from "@shared/schema";
import { desc } from "drizzle-orm";

export class DbStorage implements IStorage {
  private db;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is required");
    }
    const client = postgres(connectionString);
    this.db = drizzle(client);
  }

  async getBlogPosts(): Promise<BlogPost[]> {
    return await this.db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt));
  }

  async getUser(id: number): Promise<User | undefined> {
    const results = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return results[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const results = await this.db.select().from(users).where(eq(users.username, username)).limit(1);

      if (results.length === 0) {
        console.log(`User '${username}' not found in database`);
        return undefined;
      }

      console.log(`User '${username}' found in database with isAdmin=${results[0].isAdmin}`);
      return results[0];
    } catch (error) {
      console.error(`Error fetching user '${username}' from database:`, error);
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    return await this.db.select().from(users).orderBy(users.username);
  }

  async getUserByAdminStatus(isAdmin: boolean): Promise<User[]> {
    return await this.db.select().from(users).where(eq(users.isAdmin, isAdmin));
  }

  async createUser(user: InsertUser): Promise<User> {
    const results = await this.db.insert(users).values(user).returning();
    return results[0];
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const results = await this.db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return results[0];
  }

  async deleteUser(id: number): Promise<boolean> {
    const results = await this.db
      .delete(users)
      .where(eq(users.id, id))
      .returning({ id: users.id });
    return results.length > 0;
  }

  async getBlogPostById(id: number): Promise<BlogPost | undefined> {
    console.log(`Storage: Fetching blog post with ID: ${id}`);

    try {
      const result = await this.db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);

      if (result.length === 0) {
        console.log(`Storage: No blog post found with ID: ${id}`);
        return undefined;
      }

      console.log(`Storage: Successfully fetched blog post:`, result[0]);
      return result[0];
    } catch (error) {
      console.error(`Storage: Error fetching blog post with ID ${id}:`, error);
      throw error;
    }
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const result = await this.db.select().from(blogPosts).where(eq(blogPosts.slug, slug));
    return result[0];
  }

  async createBlogPost(data: any): Promise<BlogPost> {
    // Generate slug from title if not provided
    if (!data.slug && data.title) {
      data.slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }

    const result = await this.db.insert(blogPosts).values(data).returning();
    return result[0];
  }

  async updateBlogPost(id: number, data: any): Promise<BlogPost | undefined> {
    // Generate slug from title if title is provided
    if (data.title && !data.slug) {
      data.slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }

    const result = await this.db.update(blogPosts)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(blogPosts.id, id))
      .returning();

    return result[0];
  }

  async deleteBlogPost(id: number): Promise<boolean> {
    const result = await this.db.delete(blogPosts)
      .where(eq(blogPosts.id, id))
      .returning();

    return result.length > 0;
  }

  async getUser(id: number): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result[0];
  }


  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async getUserByAdminStatus(isAdmin: boolean): Promise<User[]> { 
    const result = await this.db.select().from(users).where(users.isAdmin.eq(isAdmin));
    return result;
  }

  // Research Documents methods
  async getResearchDocuments(): Promise<ResearchDocument[]> {
    return await this.db.select().from(researchDocuments).orderBy(desc(researchDocuments.createdAt));
  }

  async getResearchDocumentById(id: number): Promise<ResearchDocument | undefined> {
    console.log(`Storage: Fetching research document with ID: ${id}`);

    try {
      const result = await this.db.select().from(researchDocuments).where(eq(researchDocuments.id, id)).limit(1);

      if (result.length === 0) {
        console.log(`Storage: No research document found with ID: ${id}`);
        return undefined;
      }

      console.log(`Storage: Successfully fetched research document:`, result[0]);
      return result[0];
    } catch (error) {
      console.error(`Storage: Error fetching research document with ID ${id}:`, error);
      throw error;
    }
  }

  async getResearchDocumentBySlug(slug: string): Promise<ResearchDocument | undefined> {
    const result = await this.db.select().from(researchDocuments).where(eq(researchDocuments.slug, slug));
    return result[0];
  }

  async createResearchDocument(data: any): Promise<ResearchDocument> {
    // Generate slug from title if not provided
    if (!data.slug && data.title) {
      data.slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }

    const result = await this.db.insert(researchDocuments).values(data).returning();
    return result[0];
  }

  async updateResearchDocument(id: number, data: any): Promise<ResearchDocument | undefined> {
    // Generate slug from title if title is provided
    if (data.title && !data.slug) {
      data.slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }

    const result = await this.db.update(researchDocuments)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(researchDocuments.id, id))
      .returning();

    return result[0];
  }

  async deleteResearchDocument(id: number): Promise<boolean> {
    const result = await this.db.delete(researchDocuments)
      .where(eq(researchDocuments.id, id))
      .returning();

    return result.length > 0;
  }
}

export const storage = new DbStorage();