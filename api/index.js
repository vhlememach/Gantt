// Simple CommonJS serverless function for maximum Vercel compatibility
const express = require('express');
const serverless = require('serverless-http');

const app = express();
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    vercel: !!process.env.VERCEL,
    node_version: process.version
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Serverless function working with CommonJS',
    timestamp: new Date().toISOString()
  });
});

// Basic API routes
app.get('/api/release-groups', (req, res) => {
  res.json([]);
});

app.get('/api/releases', (req, res) => {
  res.json([]);
});

app.get('/api/settings', (req, res) => {
  res.json({
    id: 'static',
    theme: 'light'
  });
});

app.get('/api/checklist-tasks', (req, res) => {
  res.json([]);
});

// Catch all
app.use('*', (req, res) => {
  res.status(404).json({ 
    message: 'Not found',
    path: req.originalUrl 
  });
});

module.exports = serverless(app);