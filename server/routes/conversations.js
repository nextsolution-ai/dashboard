const express = require('express');
const router = express.Router();
const voiceflowService = require('../services/voiceflowService');
const auth = require('../middleware/auth');

// Get all transcripts
router.get('/transcripts', auth, async (req, res) => {
  try {
    const { page = 1, limit = 100 } = req.query;
    const transcripts = await voiceflowService.getTranscripts(req.user.userId, page, limit);
    res.json(transcripts);
  } catch (error) {
    console.error('Error in transcripts route:', error);
    res.status(500).json({ error: 'Failed to fetch transcripts' });
  }
});

// Get transcript dialog
router.get('/transcripts/:transcriptId/dialog', auth, async (req, res) => {
  try {
    const dialog = await voiceflowService.getTranscriptDialog(req.user.userId, req.params.transcriptId);
    res.json(dialog);
  } catch (error) {
    console.error('Error in transcript dialog route:', error);
    res.status(500).json({ error: 'Failed to fetch transcript dialog' });
  }
});

// Get document content
router.get('/documents/:id', auth, async (req, res) => {
  try {
    const content = await voiceflowService.getDocumentContent(req.user.userId, req.params.id);
    res.json(content);
  } catch (error) {
    console.error('Error in document content route:', error);
    res.status(500).json({ error: 'Failed to fetch document content' });
  }
});

// Get all knowledge base documents
router.get('/knowledge-base', auth, async (req, res) => {
  try {
    const { page = 1, limit = 100 } = req.query;
    const docs = await voiceflowService.getKnowledgeBaseDocs(req.user.userId, page, limit);
    res.json(docs);
  } catch (error) {
    console.error('Error fetching knowledge base:', error);
    res.status(500).json({ error: 'Failed to fetch knowledge base' });
  }
});

// Get specific knowledge base document content
router.get('/knowledge-base/docs/:documentId', auth, async (req, res) => {
  try {
    const { documentId } = req.params;
    const doc = await voiceflowService.getDocumentContent(req.user.userId, documentId);
    res.json(doc);
  } catch (error) {
    console.error('Error fetching document content:', error);
    res.status(500).json({ error: 'Failed to fetch document content' });
  }
});

module.exports = router; 