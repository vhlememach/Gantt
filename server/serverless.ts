import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic, log } from "./vite";

// Test database connection
const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    // Try importing the database connection
    const { db } = await import("./db");
    // Try a simple query to test connection
    await db.query.releaseGroups.findMany({ limit: 1 });
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
};

// Create Express app for serverless
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

// Serve static files
serveStatic(app);

// Routes initialization state
let routesInitialized = false;
let initializationPromise: Promise<void> | null = null;

const initializeRoutes = async () => {
  if (routesInitialized) return;
  
  if (initializationPromise) {
    await initializationPromise;
    return;
  }

  initializationPromise = (async () => {
    try {
      await registerRoutes(app);
      routesInitialized = true;
    } catch (error) {
      console.error('Failed to initialize routes:', error);
      throw error;
    }
  })();

  await initializationPromise;
};

// Middleware to ensure routes are initialized before handling requests
app.use(async (req, res, next) => {
  try {
    // First test database connection
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      return res.status(500).json({ 
        message: "Database connection failed. Please check DATABASE_URL environment variable.",
        hint: "Make sure your DATABASE_URL is properly set in Vercel environment variables."
      });
    }
    
    await initializeRoutes();
    next();
  } catch (error) {
    console.error('Route initialization failed:', error);
    res.status(500).json({ 
      message: "Server initialization failed",
      error: process.env.NODE_ENV === 'development' ? String(error) : "Internal server error"
    });
  }
});

export default app;