// Simple health check endpoint for Vercel
module.exports = (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    vercel: !!process.env.VERCEL,
    node_version: process.version
  });
};