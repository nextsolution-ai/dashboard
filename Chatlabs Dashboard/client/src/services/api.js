import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

export const fetchAnalyticsData = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/analytics`);
    return response.data;
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    throw error;
  }
};

export const fetchConversations = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/conversations`);
    return response.data;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
};

export const fetchTranscripts = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/conversations/transcripts`);
    return response.data;
  } catch (error) {
    console.error('Error fetching transcripts:', error);
    throw error;
  }
};

export const fetchKnowledgeBase = async (page = 1, limit = 100) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/conversations/knowledge-base`, {
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
    const response = await axios.get(`${API_BASE_URL}/api/conversations/transcripts/${transcriptId}/dialog`);
    return response.data;
  } catch (error) {
    console.error('Error fetching transcript dialog:', error);
    throw error;
  }
};

export const fetchDocumentContent = async (documentId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/conversations/knowledge-base/docs/${documentId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching document content:', error);
    throw error;
  }
}; 