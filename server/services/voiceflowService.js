const axios = require('axios');
require('dotenv').config();

class VoiceflowService {
  constructor() {
    this.apiKey = process.env.VOICEFLOW_API_KEY;
    this.projectId = process.env.VOICEFLOW_PROJECT_ID;
    this.v1BaseUrl = 'https://api.voiceflow.com/v1';
    this.v2BaseUrl = 'https://api.voiceflow.com/v2';
    console.log('VoiceflowService initialized with API key:', this.apiKey ? 'Present' : 'Missing');
  }

  async getKnowledgeBaseDocs(page = 1, limit = 100) {
    try {
      console.log('Fetching knowledge base docs with API key:', this.apiKey);
      const response = await axios.get(
        `${this.v1BaseUrl}/knowledge-base/docs`,
        {
          params: { 
            page, 
            limit 
          },
          headers: {
            'Authorization': this.apiKey,
            'accept': 'application/json'
          }
        }
      );

      console.log('Raw knowledge base response:', response.data);

      const { total, data } = response.data;
      const documents = data.map(doc => ({
        id: doc.documentID,
        name: doc.data.name,
        type: doc.data.type,
        rowsCount: doc.data.rowsCount,
        tags: doc.tags || [],
        updatedAt: doc.updatedAt,
        status: doc.status.type
      }));

      console.log('Transformed documents:', documents);
      return { total, documents };

    } catch (error) {
      console.error('Error fetching knowledge base:', error);
      throw error;
    }
  }

  async getTranscripts() {
    try {
      const response = await axios.get(
        `${this.v2BaseUrl}/transcripts/${this.projectId}`,
        {
          headers: {
            'Authorization': this.apiKey,
            'accept': 'application/json'
          }
        }
      );

      // Transform the data to match our needs
      const transcripts = response.data.map(transcript => ({
        id: transcript._id,
        projectId: transcript.projectID,
        sessionId: transcript.sessionID,
        browser: transcript.browser,
        device: transcript.device,
        os: transcript.os,
        createdAt: transcript.createdAt,
        updatedAt: transcript.updatedAt,
        reportTags: transcript.reportTags || [],
        name: transcript.name || '',
        image: transcript.image || ''
      }));

      console.log(`Fetched ${transcripts.length} transcripts`);
      return transcripts;

    } catch (error) {
      console.error('Error fetching transcripts:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  }

  async getTranscriptDialog(transcriptId) {
    try {
      console.log('Fetching dialog with:', {
        projectId: this.projectId,
        transcriptId: transcriptId,
        url: `${this.v2BaseUrl}/transcripts/${this.projectId}/${transcriptId}`
      });

      const response = await axios.get(
        `${this.v2BaseUrl}/transcripts/${this.projectId}/${transcriptId}`,
        {
          headers: {
            'Authorization': this.apiKey,
            'accept': 'application/json'
          }
        }
      );

      console.log('Dialog response status:', response.status);
      return response.data;

    } catch (error) {
      console.error('Error fetching transcript dialog:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: `${this.v2BaseUrl}/transcripts/${this.projectId}/${transcriptId}`,
        headers: error.response?.headers
      });
      throw error;
    }
  }

  async getDocumentContent(documentId) {
    try {
      console.log('Fetching document content:', {
        documentId,
        url: `${this.v1BaseUrl}/knowledge-base/docs/${documentId}`,
        apiKey: this.apiKey ? 'Present' : 'Missing'
      });

      const response = await axios.get(
        `${this.v1BaseUrl}/knowledge-base/docs/${documentId}`,
        {
          headers: {
            'Authorization': this.apiKey,
            'accept': 'application/json'
          }
        }
      );

      console.log('Document content response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching document content:', {
        error,
        documentId,
        url: `${this.v1BaseUrl}/knowledge-base/docs/${documentId}`,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  }
}

module.exports = new VoiceflowService(); 