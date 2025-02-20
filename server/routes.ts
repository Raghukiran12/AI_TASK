import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { WebSocketServer } from "ws";
import { insertTaskSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  app.get("/api/tasks", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const tasks = storage.getTasks(req.user!.id);
    res.json(tasks);
  });

  app.post("/api/tasks", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const result = insertTaskSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json(result.error);
    }
    const task = storage.createTask(req.user!.id, result.data);
    res.status(201).json(task);
  });

  app.patch("/api/tasks/:id", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const task = storage.updateTask(
      parseInt(req.params.id),
      req.user!.id,
      req.body
    );
    if (!task) return res.sendStatus(404);
    res.json(task);
  });

  app.delete("/api/tasks/:id", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const success = storage.deleteTask(parseInt(req.params.id), req.user!.id);
    if (!success) return res.sendStatus(404);
    res.sendStatus(204);
  });

  const httpServer = createServer(app);

  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  wss.on("connection", (ws) => {
    ws.on("message", (data) => {
      // Echo back for now
      ws.send(data);
    });
  });

  return httpServer;
}
