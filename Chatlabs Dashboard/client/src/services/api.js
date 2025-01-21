import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://chatlabs-backend.onrender.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Redirect to login if token is invalid
        window.location.href = '/login';
        return Promise.reject(error);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const fetchAnalytics = async () => {
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