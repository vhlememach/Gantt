import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertReleaseGroupSchema, insertReleaseSchema, insertAppSettingsSchema } from "@shared/schema";

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
      res.status(400).json({ message: "Invalid release data", error: error.message });
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
      res.status(400).json({ message: "Invalid release data", error: error.message });
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

  const httpServer = createServer(app);
  return httpServer;
}
