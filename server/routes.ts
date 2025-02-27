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

  // Get blog post by ID or slug
  app.get("/api/blog/:id", async (req, res) => {
    try {
      const idParam = req.params.id;
      let post;

      // First try to parse as number for ID lookup
      const numericId = parseInt(idParam);
      if (!isNaN(numericId)) {
        post = await storage.getBlogPostById(numericId);
      }

      // If no post found by ID, try slug lookup
      if (!post) {
        post = await storage.getBlogPostBySlug(idParam);
      }

      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

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
      const postData = {
        title: req.body.title,
        content: req.body.content,
        excerpt: req.body.excerpt,
        thumbnailUrl: req.body.thumbnailUrl,
        slug: req.body.slug || req.body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      };

      const post = await storage.createBlogPost(postData);
      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ 
        error: "Failed to create post",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.put("/api/admin/blog/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      const postData = {
        title: req.body.title,
        content: req.body.content,
        excerpt: req.body.excerpt,
        thumbnailUrl: req.body.thumbnailUrl,
        slug: req.body.slug || req.body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      };

      const post = await storage.updateBlogPost(id, postData);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      res.json(post);
    } catch (error) {
      console.error("Error updating post:", error);
      res.status(500).json({ 
        error: "Failed to update post",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.delete("/api/admin/blog/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      const success = await storage.deleteBlogPost(id);
      if (!success) {
        return res.status(404).json({ error: "Post not found" });
      }

      res.json({ message: "Post deleted successfully" });
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ 
        error: "Failed to delete post",
        details: error instanceof Error ? error.message : "Unknown error"
      });
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