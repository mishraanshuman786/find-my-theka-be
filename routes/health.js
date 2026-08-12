const express = require('express');

const router = express.Router();

// GET /api/health
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    service: 'Find My Theka API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;
