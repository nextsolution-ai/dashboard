const express = require('express');
const cors = require('cors');
const bigQueryService = require('./services/bigQueryService');
const voiceflowService = require('./services/voiceflowService');
const config = require('./config');
const conversationsRouter = require('./routes/conversations');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');

// Connect to MongoDB
connectDB();

const app = express();

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'https://chatlabs-alpha.vercel.app',
  'https://chatlabs.vercel.app'
];

// Add any domain that matches the pattern
if (process.env.NODE_ENV === 'production') {
  allowedOrigins.push(/^https:\/\/chatlabs-[a-z0-9-]+-randompenna68-gmailcoms-projects\.vercel\.app$/);
}

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Check if the origin is in our allowedOrigins array
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return allowedOrigin === origin;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('Origin not allowed:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'Access-Control-Allow-Origin'],
  exposedHeaders: ['Access-Control-Allow-Origin']
}));
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Origin:', req.headers.origin);
  console.log('Headers:', req.headers);
  next();
});

// API Routes
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

app.get('/api/analytics', async (req, res) => {
  try {
    console.log('Analytics request received');
    
    // Get the data from BigQuery
    const data = await bigQueryService.getTableData();
    
    if (!data) {
      throw new Error('No data received from BigQuery');
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error in analytics endpoint:', error);
    
    // Send appropriate error response based on the type of error
    if (error.response?.status === 401) {
      res.status(401).json({ 
        error: 'Authentication failed',
        details: 'Failed to authenticate with BigQuery'
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to fetch analytics data',
        details: error.message
      });
    }
  }
});

app.get('/api/knowledge-base', async (req, res) => {
  try {
    const { page = 1, limit = 100 } = req.query;
    const data = await voiceflowService.getKnowledgeBaseDocs(page, limit);
    res.json(data);
  } catch (error) {
    console.error('Error fetching knowledge base:', error);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to fetch knowledge base data',
      details: error.message 
    });
  }
});

app.use('/api/conversations', conversationsRouter);
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(config.port, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`- Health check: http://localhost:${config.port}/health`);
  console.log(`- API endpoint: http://localhost:${config.port}/api/analytics`);
}); 