import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure Neon for serverless
neonConfig.webSocketConstructor = ws;
neonConfig.poolQueryViaFetch = true; // Enable query via fetch for serverless
neonConfig.useSecureWebSocket = true;

// Validate DATABASE_URL
if (!process.env.DATABASE_URL) {
  const error = new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
  console.error(error.message);
  throw error;
}

// Validate DATABASE_URL format
if (!process.env.DATABASE_URL.startsWith('postgresql://') && !process.env.DATABASE_URL.startsWith('postgres://')) {
  const error = new Error(
    "DATABASE_URL must be a valid PostgreSQL connection string starting with postgresql:// or postgres://"
  );
  console.error(error.message);
  throw error;
}

console.log('Database URL configured:', process.env.DATABASE_URL.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));

// Create pool with serverless-optimized settings
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 1, // Limit connections for serverless
  idleTimeoutMillis: 0, // Disable idle timeout for serverless
  connectionTimeoutMillis: 5000, // 5 second timeout
});

export const db = drizzle({ client: pool, schema });