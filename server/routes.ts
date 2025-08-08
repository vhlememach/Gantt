import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertReleaseGroupSchema, insertReleaseSchema, insertAppSettingsSchema, insertChecklistTaskSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Release Groups
  app.get("/api/release-groups", async (req, res) => {
    try {
      const groups = await storage.getReleaseGroups();
      res.json(groups);
    } catch (error) {
      res.status(500).json({ message: "Failed to get release groups" });
    }
  });

  app.post("/api/release-groups", async (req, res) => {
    try {
      const validatedData = insertReleaseGroupSchema.parse(req.body);
      const group = await storage.createReleaseGroup(validatedData);
      res.json(group);
    } catch (error) {
      res.status(400).json({ message: "Invalid release group data" });
    }
  });

  app.put("/api/release-groups/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertReleaseGroupSchema.partial().parse(req.body);
      const group = await storage.updateReleaseGroup(id, validatedData);
      if (!group) {
        return res.status(404).json({ message: "Release group not found" });
      }
      res.json(group);
    } catch (error) {
      res.status(400).json({ message: "Invalid release group data" });
    }
  });

  app.delete("/api/release-groups/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteReleaseGroup(id);
      if (!deleted) {
        return res.status(404).json({ message: "Release group not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete release group" });
    }
  });

  // Releases
  app.get("/api/releases", async (req, res) => {
    try {
      const releases = await storage.getReleases();
      res.json(releases);
    } catch (error) {
      res.status(500).json({ message: "Failed to get releases" });
    }
  });

  app.get("/api/releases/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const release = await storage.getRelease(id);
      if (!release) {
        return res.status(404).json({ message: "Release not found" });
      }
      res.json(release);
    } catch (error) {
      res.status(500).json({ message: "Failed to get release" });
    }
  });

  app.get("/api/releases/group/:groupId", async (req, res) => {
    try {
      const { groupId } = req.params;
      const releases = await storage.getReleasesByGroupId(groupId);
      res.json(releases);
    } catch (error) {
      res.status(500).json({ message: "Failed to get releases for group" });
    }
  });

  app.post("/api/releases", async (req, res) => {
    try {
      console.log('Creating release with data:', req.body);
      const validatedData = insertReleaseSchema.parse(req.body);
      console.log('Validated data:', validatedData);
      const release = await storage.createRelease(validatedData);
      res.json(release);
    } catch (error) {
      console.error('Release creation error:', error);
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({ message: "Validation failed", errors: (error as any).errors });
      } else if (error instanceof Error) {
        res.status(400).json({ message: "Invalid release data", error: error.message });
      } else {
        res.status(400).json({ message: "Invalid release data", error: String(error) });
      }
    }
  });

  app.put("/api/releases/:id", async (req, res) => {
    try {
      const { id } = req.params;
      console.log('Updating release', id, 'with data:', req.body);
      const validatedData = insertReleaseSchema.partial().parse(req.body);
      console.log('Validated data:', validatedData);
      const release = await storage.updateRelease(id, validatedData);
      if (!release) {
        return res.status(404).json({ message: "Release not found" });
      }
      res.json(release);
    } catch (error) {
      console.error('Release update error:', error);
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({ message: "Validation failed", errors: (error as any).errors });
      } else if (error instanceof Error) {
        res.status(400).json({ message: "Invalid release data", error: error.message });
      } else {
        res.status(400).json({ message: "Invalid release data", error: String(error) });
      }
    }
  });

  app.delete("/api/releases/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteRelease(id);
      if (!deleted) {
        return res.status(404).json({ message: "Release not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete release" });
    }
  });

  // App Settings
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getAppSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to get app settings" });
    }
  });

  app.put("/api/settings", async (req, res) => {
    try {
      const validatedData = insertAppSettingsSchema.partial().parse(req.body);
      const settings = await storage.updateAppSettings(validatedData);
      res.json(settings);
    } catch (error) {
      res.status(400).json({ message: "Invalid settings data" });
    }
  });

  // Checklist Tasks endpoints
  app.get("/api/checklist-tasks", async (req, res) => {
    try {
      const tasks = await storage.getChecklistTasks();
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching checklist tasks:", error);
      res.status(500).json({ error: "Failed to fetch checklist tasks" });
    }
  });

  app.get("/api/checklist-tasks/release/:releaseId", async (req, res) => {
    try {
      const tasks = await storage.getChecklistTasksByRelease(req.params.releaseId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching checklist tasks by release:", error);
      res.status(500).json({ error: "Failed to fetch checklist tasks" });
    }
  });

  app.get("/api/checklist-tasks/member/:member", async (req, res) => {
    try {
      const tasks = await storage.getChecklistTasksByMember(req.params.member);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching checklist tasks by member:", error);
      res.status(500).json({ error: "Failed to fetch checklist tasks" });
    }
  });

  app.post("/api/checklist-tasks", async (req, res) => {
    try {
      const validatedData = insertChecklistTaskSchema.parse(req.body);
      const newTask = await storage.createChecklistTask(validatedData);
      res.status(201).json(newTask);
    } catch (error) {
      console.error("Error creating checklist task:", error);
      res.status(400).json({ error: "Invalid task data" });
    }
  });

  app.put("/api/checklist-tasks/:id", async (req, res) => {
    try {
      const validatedData = insertChecklistTaskSchema.partial().parse(req.body);
      const updatedTask = await storage.updateChecklistTask(req.params.id, validatedData);
      if (!updatedTask) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(updatedTask);
    } catch (error) {
      console.error("Error updating checklist task:", error);
      res.status(400).json({ error: "Invalid task data" });
    }
  });

  app.delete("/api/checklist-tasks/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteChecklistTask(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting checklist task:", error);
      res.status(500).json({ error: "Failed to delete task" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
