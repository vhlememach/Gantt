// api/[...route].ts
import serverless from "serverless-http";
import express from "express";
import { storage } from "../server/storage";
import { 
  insertReleaseGroupSchema, insertReleaseSchema, insertAppSettingsSchema, insertChecklistTaskSchema,
  insertWaterfallCycleSchema, insertContentFormatAssignmentSchema, insertEvergreenBoxSchema,
  insertTaskSocialMediaSchema, insertCustomDividerSchema
} from "../shared/schema";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Basic logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      console.log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
    }
  });
  next();
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Release Groups
app.get("/api/release-groups", async (req, res) => {
  try {
    const groups = await storage.getReleaseGroups();
    res.json(groups);
  } catch (error) {
    console.error("Error getting release groups:", error);
    res.status(500).json({ message: "Failed to get release groups" });
  }
});

app.post("/api/release-groups", async (req, res) => {
  try {
    const validatedData = insertReleaseGroupSchema.parse(req.body);
    const group = await storage.createReleaseGroup(validatedData);
    res.json(group);
  } catch (error) {
    console.error("Error creating release group:", error);
    res.status(400).json({ message: "Invalid release group data" });
  }
});

// Add a few more essential routes for testing
app.get("/api/releases", async (req, res) => {
  try {
    const releases = await storage.getReleases();
    res.json(releases);
  } catch (error) {
    console.error("Error getting releases:", error);
    res.status(500).json({ message: "Failed to get releases" });
  }
});

app.get("/api/settings", async (req, res) => {
  try {
    const settings = await storage.getAppSettings();
    res.json(settings);
  } catch (error) {
    console.error("Error getting settings:", error);
    res.status(500).json({ message: "Failed to get settings" });
  }
});

// Error handling
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ 
    message: "Internal server error",
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

export default serverless(app);