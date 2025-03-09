import express, { type Request, Response, Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import cors from "cors";
import multer from "multer";
import { storage } from "./storage";
import { insertBlogPostSchema } from "@shared/schema";
import passport from "passport";
import { hashPassword } from "./utils";


// Set up multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

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
        console.log(`Fetched post by ID ${numericId}:`, post);
      }

      // If no post found by ID, try slug lookup
      if (!post) {
        post = await storage.getBlogPostBySlug(idParam);
        console.log(`Fetched post by slug ${idParam}:`, post);
      }

      if (!post) {
        console.log(`Post not found with ID/slug: ${idParam}`);
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

  // User Management API endpoints
  app.get("/api/admin/users", requireAuth, requireAdmin, async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ 
        error: "Failed to fetch users",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get("/api/admin/users/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ 
        error: "Failed to fetch user",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/admin/users", requireAuth, requireAdmin, async (req, res) => {
    try {
      // Filter out sensitive or auto-generated fields
      const userData = {
        username: req.body.username,
        password: await hashPassword(req.body.password),
        isAdmin: req.body.isAdmin || false,
      };

      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ 
        error: "Failed to create user",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.put("/api/admin/users/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      // Filter out sensitive or auto-generated fields
      const userData = {
        username: req.body.username,
        isAdmin: req.body.isAdmin,
      };

      // Add password only if it's provided
      if (req.body.password) {
        userData.password = await hashPassword(req.body.password);
      }

      const user = await storage.updateUser(id, userData);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ 
        error: "Failed to update user",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.delete("/api/admin/users/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ 
        error: "Failed to delete user",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Research Documents API endpoints
  app.get("/api/research", async (req, res) => {
    try {
      const documents = await storage.getResearchDocuments();
      res.json(documents);
    } catch (error) {
      console.error("Error fetching research documents:", error);
      res.status(500).json({ 
        error: "Failed to fetch research documents",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get("/api/research/:id", async (req, res) => {
    try {
      const idParam = req.params.id;
      let document;

      // First try to parse as number for ID lookup
      const numericId = parseInt(idParam);
      if (!isNaN(numericId)) {
        document = await storage.getResearchDocumentById(numericId);
        console.log(`Fetched research document by ID ${numericId}:`, document);
      }

      // If no document found by ID, try slug lookup
      if (!document) {
        document = await storage.getResearchDocumentBySlug(idParam);
        console.log(`Fetched research document by slug ${idParam}:`, document);
      }

      if (!document) {
        console.log(`Research document not found with ID/slug: ${idParam}`);
        return res.status(404).json({ error: "Research document not found" });
      }

      res.json(document);
    } catch (error) {
      console.error("Error fetching research document:", error);
      res.status(500).json({ 
        error: "Failed to fetch research document",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/admin/research", requireAuth, requireAdmin, async (req, res) => {
    try {
      const documentData = {
        title: req.body.title,
        content: req.body.content,
        summary: req.body.summary,
        authors: req.body.authors,
        imageUrls: req.body.imageUrls || [],
        tags: req.body.tags || [],
        slug: req.body.slug || req.body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      };

      const document = await storage.createResearchDocument(documentData);
      res.status(201).json(document);
    } catch (error) {
      console.error("Error creating research document:", error);
      res.status(500).json({ 
        error: "Failed to create research document",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.put("/api/admin/research/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      const documentData = {
        title: req.body.title,
        content: req.body.content,
        summary: req.body.summary,
        authors: req.body.authors,
        imageUrls: req.body.imageUrls || [],
        tags: req.body.tags || [],
        slug: req.body.slug || req.body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      };

      const document = await storage.updateResearchDocument(id, documentData);
      if (!document) {
        return res.status(404).json({ error: "Research document not found" });
      }

      res.json(document);
    } catch (error) {
      console.error("Error updating research document:", error);
      res.status(500).json({ 
        error: "Failed to update research document",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.delete("/api/admin/research/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      const success = await storage.deleteResearchDocument(id);
      if (!success) {
        return res.status(404).json({ error: "Research document not found" });
      }

      res.json({ message: "Research document deleted successfully" });
    } catch (error) {
      console.error("Error deleting research document:", error);
      res.status(500).json({ 
        error: "Failed to delete research document",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.error('Login error:', err);
        return res.status(500).json({ error: 'Authentication failed', details: err.message });
      }

      if (!user) {
        console.log('Login failed:', info?.message || 'Invalid credentials');
        return res.status(401).json({ error: info?.message || 'Invalid credentials' });
      }

      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error('Session creation error:', loginErr);
          return res.status(500).json({ error: 'Failed to create session' });
        }

        console.log(`User ${user.username} logged in successfully with isAdmin=${user.isAdmin}`);
        return res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      console.log('User not authenticated when accessing /api/user');
      return res.status(401).json({ error: 'Not authenticated' });
    }

    console.log(`Current authenticated user: ${req.user?.username} (isAdmin=${req.user?.isAdmin})`);
    res.json(req.user);
  });


  const httpServer = createServer(app);
  return httpServer;
}