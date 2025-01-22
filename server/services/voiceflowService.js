const axios = require('axios');
require('dotenv').config();
const User = require('../models/User');
const req = require('express/lib/request');

class VoiceflowService {
  constructor() {
    this.v1BaseUrl = 'https://api.voiceflow.com/v1';
    this.v2BaseUrl = 'https://api.voiceflow.com/v2';
    this.runtimeUrl = 'https://general-runtime.voiceflow.com';
  }

  // Helper to get project credentials
  async getProjectCredentials(userId) {
    try {
      const user = await User.findById(userId).populate('current_project');
      console.log('User and Project:', {
        userId,
        user: user ? 'Found' : 'Not Found',
        project: user?.current_project ? 'Found' : 'Not Found',
        credentials: user?.current_project?.voiceflow_config
      });
      
      if (!user?.current_project) {
        throw new Error('No project selected');
      }
      return user.current_project.voiceflow_config;
    } catch (error) {
      console.error('Error getting project credentials:', error);
      throw error;
    }
  }

  // Get all knowledge base documents
  async getKnowledgeBaseDocs(userId, page = 1, limit = 100) {
    try {
      const { api_key, project_id } = await this.getProjectCredentials(userId);
      console.log('Fetching knowledge base docs with:', {
        url: `${this.v1BaseUrl}/knowledge-base/docs`,
        project_id,
        hasApiKey: !!api_key,
        page,
        limit
      });

      const response = await axios.get(`${this.v1BaseUrl}/knowledge-base/docs`, {
        headers: {
          Authorization: api_key,
          'Content-Type': 'application/json',
        },
        params: { 
          page, 
          limit,
          projectID: project_id
        }
      });

      console.log('Knowledge base response:', {
        status: response.status,
        dataLength: response.data?.data?.length,
        data: response.data
      });

      // Transform the response data
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

      return {
        total,
        documents
      };

    } catch (error) {
      console.error('Error fetching knowledge base:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config
      });
      throw error;
    }
  }

  // Get content of a specific document
  async getDocumentContent(userId, documentId) {
    try {
      const { api_key, project_id } = await this.getProjectCredentials(userId);
      console.log('Fetching document content with:', {
        url: `${this.v1BaseUrl}/knowledge-base/docs/${documentId}`,
        project_id,
        hasApiKey: !!api_key,
        documentId
      });

      const response = await axios.get(
        `${this.v1BaseUrl}/knowledge-base/docs/${documentId}`,
        {
          headers: {
            Authorization: api_key,
            'Content-Type': 'application/json'
          },
          params: {
            projectID: project_id
          }
        }
      );

      console.log('Document content response:', {
        status: response.status,
        data: response.data
      });

      // Transform the document content response to match expected structure
      return {
        data: {
          tags: response.data.data.tags || [],
          documentID: response.data.data.documentID,
          data: {
            type: response.data.data.data.type,
            name: response.data.data.data.name,
            canEdit: response.data.data.data.canEdit || false
          },
          updatedAt: response.data.data.updatedAt,
          status: {
            data: null,
            type: response.data.data.status.type
          }
        },
        chunks: response.data.chunks.map(chunk => ({
          chunkID: chunk.chunkID,
          content: chunk.content,
          metadata: chunk.metadata || {}
        }))
      };

    } catch (error) {
      console.error('Error fetching document content:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config
      });
      throw error;
    }
  }

  // Get all transcripts
  async getTranscripts(userId, page = 1, limit = 100) {
    try {
      const { api_key, project_id } = await this.getProjectCredentials(userId);
      console.log('Fetching transcripts with:', {
        url: `${this.v2BaseUrl}/transcripts/${project_id}`,
        project_id,
        hasApiKey: !!api_key,
        page,
        limit
      });

      const response = await axios.get(
        `${this.v2BaseUrl}/transcripts/${project_id}`,
        {
          headers: {
            Authorization: api_key,
            'Content-Type': 'application/json'
          },
          params: {
            page,
            limit
          }
        }
      );

      console.log('Transcripts response:', {
        status: response.status,
        dataLength: response.data?.length,
        firstTranscript: response.data?.[0]
      });

      return response.data.map(transcript => ({
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
    } catch (error) {
      console.error('Error fetching transcripts:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config
      });
      throw error;
    }
  }

  // Get dialog/messages for a specific transcript
  async getTranscriptDialog(userId, transcriptId) {
    try {
      const { api_key, project_id } = await this.getProjectCredentials(userId);
      console.log('Fetching transcript dialog with:', {
        url: `${this.v2BaseUrl}/transcripts/${project_id}/${transcriptId}`,
        project_id,
        hasApiKey: !!api_key,
        transcriptId
      });

      const response = await axios.get(
        `${this.v2BaseUrl}/transcripts/${project_id}/${transcriptId}`,
        {
          headers: {
            Authorization: api_key,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Transcript dialog response:', {
        status: response.status,
        dataLength: response.data?.length,
        data: response.data
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching transcript dialog:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config
      });
      throw error;
    }
  }
}

module.exports = new VoiceflowService(); 