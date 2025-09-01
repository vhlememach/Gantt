import serverless from "serverless-http";
import express from "express";

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

// Simple health check - no external dependencies
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    vercel: !!process.env.VERCEL,
    database_configured: !!process.env.DATABASE_URL
  });
});

// Minimal test endpoint
app.get("/api/test", (req, res) => {
  res.json({
    message: "Serverless function working",
    timestamp: new Date().toISOString()
  });
});

// Just return static data for now to test basic functionality
app.get("/api/release-groups", (req, res) => {
  res.json([]);
});

app.get("/api/releases", (req, res) => {
  res.json([]);
});

app.get("/api/settings", (req, res) => {
  res.json({
    id: "static",
    theme: "light"
  });
});

app.get("/api/checklist-tasks", (req, res) => {
  res.json([]);
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