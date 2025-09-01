// api/[...route].ts
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

// Health check with environment debugging
app.get("/api/health", (req, res) => {
  const envInfo = {
    status: "ok",
    timestamp: new Date().toISOString(),
    node_env: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL,
    database_url_exists: !!process.env.DATABASE_URL,
    database_url_format: process.env.DATABASE_URL ? 
      process.env.DATABASE_URL.startsWith('postgresql://') || process.env.DATABASE_URL.startsWith('postgres://') 
      : false
  };
  
  console.log("Health check called:", envInfo);
  res.json(envInfo);
});

// Database connection test endpoint
app.get("/api/test-db", async (req, res) => {
  try {
    console.log("Testing database connection...");
    
    // Test database import and connection
    const { Pool, neonConfig } = await import("@neondatabase/serverless");
    const ws = await import("ws");
    
    neonConfig.webSocketConstructor = ws.default;
    neonConfig.poolQueryViaFetch = true;
    neonConfig.useSecureWebSocket = true;
    
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL not found");
    }
    
    const testPool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      max: 1,
      connectionTimeoutMillis: 3000,
    });
    
    const client = await testPool.connect();
    const result = await client.query('SELECT NOW() as time');
    client.release();
    await testPool.end();
    
    console.log("Database test successful:", result.rows[0]);
    res.json({ 
      status: "success", 
      message: "Database connection successful",
      timestamp: result.rows[0].time
    });
  } catch (error) {
    console.error("Database test failed:", error);
    res.status(500).json({ 
      status: "error", 
      message: "Database connection failed",
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
});

// Initialize storage with lazy loading
let storage: any = null;
const getStorage = async () => {
  if (!storage) {
    try {
      const { storage: storageInstance } = await import("../server/storage");
      storage = storageInstance;
      console.log("Storage initialized successfully");
    } catch (error) {
      console.error("Failed to initialize storage:", error);
      throw new Error("Storage initialization failed: " + error);
    }
  }
  return storage;
};

// Release Groups
app.get("/api/release-groups", async (req, res) => {
  try {
    const storageInstance = await getStorage();
    const groups = await storageInstance.getReleaseGroups();
    res.json(groups);
  } catch (error) {
    console.error("Error getting release groups:", error);
    res.status(500).json({ 
      message: "Failed to get release groups",
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    });
  }
});

app.post("/api/release-groups", async (req, res) => {
  try {
    const storageInstance = await getStorage();
    const { insertReleaseGroupSchema } = await import("../shared/schema");
    const validatedData = insertReleaseGroupSchema.parse(req.body);
    const group = await storageInstance.createReleaseGroup(validatedData);
    res.json(group);
  } catch (error) {
    console.error("Error creating release group:", error);
    res.status(400).json({ 
      message: "Invalid release group data",
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    });
  }
});

// Add a few more essential routes for testing
app.get("/api/releases", async (req, res) => {
  try {
    const storageInstance = await getStorage();
    const releases = await storageInstance.getReleases();
    res.json(releases);
  } catch (error) {
    console.error("Error getting releases:", error);
    res.status(500).json({ 
      message: "Failed to get releases",
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    });
  }
});

app.get("/api/settings", async (req, res) => {
  try {
    const storageInstance = await getStorage();
    const settings = await storageInstance.getAppSettings();
    res.json(settings);
  } catch (error) {
    console.error("Error getting settings:", error);
    res.status(500).json({ 
      message: "Failed to get settings",
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined
    });
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