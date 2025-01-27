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
  origin: function(origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://chatlabs-alpha.vercel.app',
      'https://chatlabs-maulzz814-randompenna68-gmailcoms-projects.vercel.app'
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      console.log('Origin not allowed by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
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

// Log available routes
app._router.stack.forEach(function(r){
  if (r.route && r.route.path){
    console.log(r.route.path)
  }
});

app.listen(config.port, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`- Health check: http://localhost:${config.port}/health`);
  console.log(`- API endpoint: http://localhost:${config.port}/api/analytics`);
}); 