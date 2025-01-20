const express = require('express');
const cors = require('cors');
const path = require('path');
const bigQueryService = require('./services/bigQueryService');
const voiceflowService = require('./services/voiceflowService');
const config = require('./config');
const conversationsRouter = require('./routes/conversations');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://chatlabs-fjmgflrgs-randompenna68-gmailcoms-projects.vercel.app']
    : 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// API Routes
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

app.get('/api/analytics', async (req, res) => {
  try {
    const data = await bigQueryService.getTableData();
    res.json(data);
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch analytics data',
      details: error.message 
    });
  }
});

app.get('/api/knowledge-base', async (req, res) => {
  try {
    console.log('Received knowledge base request');
    const { page = 1, limit = 100 } = req.query;
    const data = await voiceflowService.getKnowledgeBaseDocs(page, limit);
    console.log('Knowledge base data retrieved successfully');
    res.json(data);
  } catch (error) {
    console.error('Error fetching knowledge base:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to fetch knowledge base data',
      details: error.message,
      status: error.response?.status
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/conversations', conversationsRouter);
app.use('/api/auth', authRoutes);

app.listen(config.port, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`- Health check: http://localhost:${config.port}/health`);
  console.log(`- API endpoint: http://localhost:${config.port}/api/analytics`);
  console.log(`- Knowledge Base endpoint: http://localhost:${config.port}/api/knowledge-base`);
}); 