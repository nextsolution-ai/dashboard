const express = require('express');
const router = express.Router();
const voiceflowService = require('../services/voiceflowService');

// Get all transcripts
router.get('/transcripts', async (req, res) => {
  try {
    const transcripts = await voiceflowService.getTranscripts();
    res.json(transcripts);
  } catch (error) {
    console.error('Error in transcripts route:', error);
    res.status(500).json({ error: 'Failed to fetch transcripts' });
  }
});

// Get knowledge base docs
router.get('/knowledge-base', async (req, res) => {
  try {
    const { page = 1, limit = 100 } = req.query;
    const docs = await voiceflowService.getKnowledgeBaseDocs(page, limit);
    res.json(docs);
  } catch (error) {
    console.error('Error fetching knowledge base:', error);
    res.status(500).json({ error: 'Failed to fetch knowledge base' });
  }
});

// Add this new route
router.get('/transcripts/:transcriptId/dialog', async (req, res) => {
  try {
    const { transcriptId } = req.params;
    const dialog = await voiceflowService.getTranscriptDialog(transcriptId);
    res.json(dialog);
  } catch (error) {
    console.error('Error fetching transcript dialog:', error);
    res.status(500).json({ error: 'Failed to fetch transcript dialog' });
  }
});

// Add this new route
router.get('/knowledge-base/docs/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;
    const doc = await voiceflowService.getDocumentContent(documentId);
    res.json(doc);
  } catch (error) {
    console.error('Error fetching document content:', error);
    res.status(500).json({ error: 'Failed to fetch document content' });
  }
});

module.exports = router; 