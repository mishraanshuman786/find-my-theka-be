const dns = require('dns');

dns.setDefaultResultOrder('ipv4first');


const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const placesRoutes = require('./routes/places');
const healthRoutes = require('./routes/health');
const { initDatabase } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/places', placesRoutes);
app.use('/api', healthRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Find My Theka API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      auth_register: 'POST /api/auth/register',
      auth_login: 'POST /api/auth/login',
      nearby_places: 'GET /api/places/nearby?lat={lat}&lng={lng}',
      search_places: 'POST /api/places/search'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
async function startServer() {
  try {
    await initDatabase();
    console.log('Database initialized successfully');
    
    app.listen(PORT, () => {
      console.log(`🚀 Find My Theka Server running on port ${PORT}`);
      console.log(`📍 API Base URL: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
