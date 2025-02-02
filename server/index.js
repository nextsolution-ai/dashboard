const express = require('express');
const cors = require('cors');
const bigQueryService = require('./services/bigQueryService');
const config = require('./config');
const conversationsRouter = require('./routes/conversations');
const authRoutes = require('./routes/auth');
const connectDB = require('./config/db');
const voiceflowService = require('./services/voiceflowService');
const projectsRouter = require('./routes/projects');
const authMiddleware = require('./middleware/auth');
const adminRoutes = require('./routes/admin');

// Connect to MongoDB
connectDB();

const app = express();

// Updated CORS setup
app.use(cors({
  origin: [
    'https://chatlabs-alpha.vercel.app',
    'http://localhost:3000'  // For local development
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/conversations', conversationsRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/admin', adminRoutes);

// Analytics endpoint (now part of home/performance)
app.get('/api/analytics', authMiddleware, async (req, res) => {
  try {
    const data = await bigQueryService.getTableData(req.user.userId);
    res.json(data);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
});

// Knowledge base endpoint (used for training section)
app.get('/api/knowledge-base', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 100 } = req.query;
    const data = await voiceflowService.getKnowledgeBaseDocs(req.user.userId, page, limit);
    res.json(data);
  } catch (error) {
    console.error('Error fetching knowledge base:', error);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to fetch knowledge base data',
      details: error.message 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Log all registered routes
console.log('Registered routes:');
app._router.stack.forEach(function(r){
  if (r.route && r.route.path){
    console.log(r.route.method, r.route.path);
  }
});

app.listen(config.port, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`- Health check: http://localhost:${config.port}/health`);
  console.log(`- API endpoint: http://localhost:${config.port}/api/analytics`);
  console.log(`Server running on port ${config.port}`);
}); 