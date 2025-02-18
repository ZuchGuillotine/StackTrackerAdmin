import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import cors from "cors";
import { storage } from "./storage";
import { insertBlogPostSchema, insertReferenceDataSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Enable CORS with credentials
  app.use(cors({
    origin: process.env.MAIN_APP_URL,
    credentials: true
  }));

  // Set up authentication routes
  setupAuth(app);

  // Blog management routes
  app.get("/api/blog-posts", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const posts = await storage.getBlogPosts();
    res.json(posts);
  });

  app.post("/api/blog-posts", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const parsed = insertBlogPostSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);
    
    const post = await storage.createBlogPost({
      ...parsed.data,
      authorId: req.user.id
    });
    res.status(201).json(post);
  });

  // Reference data management routes
  app.get("/api/reference-data", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const data = await storage.getReferenceData();
    res.json(data);
  });

  app.post("/api/reference-data", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const parsed = insertReferenceDataSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);
    
    const refData = await storage.createReferenceData(parsed.data);
    res.status(201).json(refData);
  });

  // User management routes
  app.get("/api/users", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const users = await storage.getUsers();
    res.json(users);
  });

  const httpServer = createServer(app);
  return httpServer;
}
