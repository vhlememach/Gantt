import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import { loginSchema, insertUserSchema } from "@shared/schema";

const PgSession = connectPgSimple(session);

export function setupAuth(app: express.Express) {
  // Session configuration
  app.use(session({
    store: new PgSession({
      pool: pool,
      createTableIfMissing: true,
      tableName: 'sessions'
    }),
    secret: process.env.SESSION_SECRET || 'dev-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    }
  }));
}

export async function authenticateUser(email: string, password: string) {
  try {
    const user = await storage.getUserByEmail(email);
    if (!user) return null;
    
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return null;
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    console.error("Authentication error:", error);
    return null;
  }
}

// Middleware to check if user is authenticated
export function requireAuth(req: any, res: any, next: any) {
  if (req.session?.userId) {
    return next();
  }
  return res.status(401).json({ error: 'Authentication required' });
}

// Middleware to check if user is admin
export function requireAdmin(req: any, res: any, next: any) {
  if (req.session?.userId && req.session?.isAdmin) {
    return next();
  }
  return res.status(403).json({ error: 'Admin access required' });
}

// Add user to request object
export async function addUserToRequest(req: any, res: any, next: any) {
  if (req.session?.userId) {
    try {
      const user = await storage.getUser(req.session.userId);
      if (user) {
        const { password: _, ...userWithoutPassword } = user;
        req.user = userWithoutPassword;
      }
    } catch (error) {
      console.error("Error loading user:", error);
    }
  }
  next();
}