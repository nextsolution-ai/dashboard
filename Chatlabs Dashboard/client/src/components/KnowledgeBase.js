import React, { useState, useEffect } from 'react';
import { fetchKnowledgeBase, fetchDocumentContent } from '../services/api';
import Sidebar from './Sidebar';
import './KnowledgeBase.css';

const KnowledgeBase = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docContent, setDocContent] = useState(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetchKnowledgeBase();
      setDocuments(response.documents);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentSelect = async (doc) => {
    console.log('Selected document:', doc);
    if (!doc.id) {
      console.error('No id found in:', doc);
      return;
    }
    
    setSelectedDoc(doc);
    try {
      setContentLoading(true);
      console.log('Fetching content for id:', doc.id);
      const content = await fetchDocumentContent(doc.id);
      setDocContent(content);
    } catch (err) {
      console.error('Error loading document content:', err);
    } finally {
      setContentLoading(false);
    }
  };

  const renderDocumentContent = () => {
    if (contentLoading) {
      return <div className="loading">Loading document content...</div>;
    }

    if (!docContent) {
      return null;
    }

    return (
      <div className="document-content">
        <div className="document-header">
          <h2>{docContent.data.data.name}</h2>
          <div className="document-meta">
            <span>Updated: {new Date(docContent.data.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="chunks-container">
          {docContent.chunks.map(chunk => (
            <div key={chunk.chunkID} className="chunk">
              {chunk.content}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const filteredDocs = documents.filter(doc => 
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderContent = () => {
    if (loading) return <div className="loading">Loading documents...</div>;
    if (error) return <div className="error">Error: {error}</div>;

    return (
      <div className="kb-container">
        <div className="kb-sidebar">
          <div className="kb-header">
            <div className="kb-title">
              <div className="kb-icon">🧠</div>
              <div>
                <h1>Knowledge Base</h1>
                <p>Manage the sources of your AI agent.</p>
              </div>
            </div>
            <div className="kb-actions">
              <button className="preview-btn">Preview KB</button>
              <button className="add-source-btn">+ Add Source</button>
            </div>
          </div>
          <div className="kb-search">
            <input
              type="text"
              placeholder="Search Docs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="documents-list">
            {filteredDocs.map(doc => (
              <div 
                key={doc.id} 
                className={`document-item ${selectedDoc?.id === doc.id ? 'selected' : ''}`}
                onClick={() => handleDocumentSelect(doc)}
              >
                <div className="doc-icon">📄</div>
                <div className="doc-info">
                  <div className="doc-name">{doc.name}</div>
                  <div className="doc-meta">
                    <span className="doc-type">DOC</span>
                    <span className="doc-date">8 months ago</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="kb-main">
          {selectedDoc ? (
            renderDocumentContent()
          ) : (
            <div className="no-doc-selected">
              <div className="empty-state">
                <div className="empty-icon">📄</div>
                <h2>Select a document</h2>
                <p>Start by checking a document on the left or add a new one.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-main">
        {renderContent()}
      </div>
    </div>
  );
};

export default KnowledgeBase; 