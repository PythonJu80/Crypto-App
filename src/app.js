const express = require('express');
const path = require('path');
require('dotenv').config();

// Import routes
const tradingRoutes = require('./routes/trading');
const alertRoutes = require('./routes/alerts');
const portfolioRoutes = require('./routes/portfolio');

// Initialize express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/trades', tradingRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/portfolio', portfolioRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error'
  });
});

module.exports = app;