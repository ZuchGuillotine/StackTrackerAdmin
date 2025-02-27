import express, { type Request, Response, Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import cors from "cors";
import { storage } from "./storage";
import { insertBlogPostSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(cors({
    origin: process.env.MAIN_APP_URL,
    credentials: true
  }));

  setupAuth(app);

  const requireAuth = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Authentication required" });
    next();
  };

  const requireAdmin = (req: Request, res: Response, next: Function) => {
    if (!req.user?.isAdmin) return res.status(403).json({ error: "Admin access required" });
    next();
  };

  app.get("/api/blog", async (req, res) => {
    try {
      const posts = await storage.getBlogPosts();
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  });

  app.get("/api/blog/:id", async (req, res) => {
    try {
      const idParam = req.params.id;
      console.log(`Fetching blog post with param: ${idParam}`);

      const id = parseInt(idParam);
      if (!isNaN(id)) {
        const post = await storage.getBlogPostById(id); // Assuming storage.getBlogPostById is adapted to new DB structure

        if (!post) {
          console.log(`Post with ID ${id} not found`);
          return res.status(404).json({ error: "Post not found" });
        }

        console.log(`Found post:`, post);
        return res.json(post);
      }

      // If not a number, treat as slug
      const post = await storage.getBlogPostBySlug(idParam); // Assuming storage.getBlogPostBySlug is adapted to new DB structure

      if (!post) {
        console.log(`Post with slug ${idParam} not found`);
        return res.status(404).json({ error: "Post not found" });
      }

      console.log(`Found post:`, post);
      res.json(post);
    } catch (error) {
      console.error("Error fetching post:", error);
      res.status(500).json({ 
        error: "Failed to fetch post",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/admin/blog", requireAuth, requireAdmin, async (req, res) => {
    try {
      console.log("Creating new blog post with data:", req.body);
      
      // Add validation to ensure required fields
      if (!req.body.title) {
        return res.status(400).json({ error: "Title is required" });
      }
      if (!req.body.content) {
        return res.status(400).json({ error: "Content is required" });
      }
      
      // Ensure we have all required fields before validation
      const blogData = {
        title: req.body.title,
        content: req.body.content,
        slug: req.body.slug || req.body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        excerpt: req.body.excerpt || req.body.title.substring(0, 100),
        thumbnailUrl: req.body.thumbnailUrl || 'https://picsum.photos/seed/' + Math.floor(Math.random() * 1000) + '/800/400'
      };
      
      const post = await storage.createBlogPost(blogData);
      console.log("Created new blog post:", post);
      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ error: "Failed to create post", details: error.message });
    }
  });

  app.put("/api/admin/blog/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      console.log(`Updating blog post ${id} with data:`, req.body);
      
      // Add validation to ensure required fields
      if (!req.body.title) {
        return res.status(400).json({ error: "Title is required" });
      }
      if (!req.body.content) {
        return res.status(400).json({ error: "Content is required" });
      }
      
      const post = await storage.updateBlogPost(id, req.body);
      if (!post) {
        console.log(`Post with ID ${id} not found for update`);
        return res.status(404).json({ error: "Post not found" });
      }
      
      console.log(`Updated blog post ${id}:`, post);
      res.json(post);
    } catch (error) {
      console.error("Error updating post:", error);
      res.status(500).json({ error: "Failed to update post", details: error.message });
    }
  });

  app.delete("/api/admin/blog/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const success = await storage.deleteBlogPost(parseInt(req.params.id));
      if (!success) return res.status(404).json({ error: "Post not found" });
      res.json({ message: "Post deleted successfully" });
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ error: "Failed to delete post" });
    }
  });

  app.get("/api/config/tinymce", requireAuth, (req, res) => {
    res.json({ 
      apiKey: process.env.TINY_MCE_KEY || "" 
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}