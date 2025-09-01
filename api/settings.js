// Simple settings endpoint  
module.exports = (req, res) => {
  res.json({
    id: 'static',
    theme: 'light'
  });
};