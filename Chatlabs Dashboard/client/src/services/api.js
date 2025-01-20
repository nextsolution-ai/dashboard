import axios from 'axios';

// Force production URL when deployed
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

console.log('API Base URL:', API_BASE_URL);
console.log('Current hostname:', window.location.hostname); // Additional debug

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor with logging
api.interceptors.request.use((config) => {
  console.log('Request config:', {
    url: config.url,
    baseURL: config.baseURL,
    fullURL: config.baseURL + config.url,
    method: config.method,
    headers: config.headers
  });
  
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['x-auth-token'] = token;
  }
  return config;
}, (error) => {
  console.error('Request interceptor error:', error);
  return Promise.reject(error);
});

// Add response interceptor with logging
api.interceptors.response.use((response) => {
  console.log('Response:', {
    status: response.status,
    data: response.data,
    headers: response.headers
  });
  return response;
}, (error) => {
  console.error('Response interceptor error:', {
    message: error.message,
    response: error.response?.data,
    status: error.response?.status
  });
  return Promise.reject(error);
});

export const login = async (email, password) => {
  console.log('Making login request to:', API_BASE_URL + '/api/auth/login');
  console.log('Request payload:', { email, password: '***' });
  
  try {
    const response = await api.post('/api/auth/login', { email, password });
    console.log('Login success:', {
      status: response.status,
      hasToken: !!response.data.token,
      hasUser: !!response.data.user
    });
    return response.data;
  } catch (error) {
    console.error('Login error details:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      config: {
        baseURL: error.config?.baseURL,
        url: error.config?.url,
        method: error.config?.method
      }
    });
    throw error.response?.data || error.message;
  }
};

export const fetchAnalyticsData = async () => {
  try {
    const response = await api.get('/api/analytics');
    return response.data;
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    throw error;
  }
};

export const fetchConversations = async () => {
  try {
    const response = await api.get('/api/conversations');
    return response.data;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
};

export const fetchTranscripts = async () => {
  try {
    const response = await api.get('/api/conversations/transcripts');
    return response.data;
  } catch (error) {
    console.error('Error fetching transcripts:', error);
    throw error;
  }
};

export const fetchKnowledgeBase = async (page = 1, limit = 100) => {
  try {
    const response = await api.get('/api/conversations/knowledge-base', {
      params: { page, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching knowledge base:', error);
    throw error;
  }
};

export const fetchTranscriptDialog = async (transcriptId) => {
  try {
    const response = await api.get(`/api/conversations/transcripts/${transcriptId}/dialog`);
    return response.data;
  } catch (error) {
    console.error('Error fetching transcript dialog:', error);
    throw error;
  }
};

export const fetchDocumentContent = async (documentId) => {
  try {
    const response = await api.get(`/api/conversations/knowledge-base/docs/${documentId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching document content:', error);
    throw error;
  }
};

export default api; 