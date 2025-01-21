import React, { useState, useEffect } from 'react';
import { fetchTranscripts, fetchTranscriptDialog } from '../services/api';
import Sidebar from './Sidebar';
import './Conversations.css';

const Conversations = () => {
  const [transcripts, setTranscripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTranscript, setSelectedTranscript] = useState(null);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [dialog, setDialog] = useState(null);

  useEffect(() => {
    loadTranscripts();
  }, []);

  const loadTranscripts = async () => {
    try {
      setLoading(true);
      const data = await fetchTranscripts();
      setTranscripts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTranscriptSelect = async (transcript) => {
    setSelectedTranscript(transcript);
    try {
      setDialogLoading(true);
      const dialogData = await fetchTranscriptDialog(transcript.id);
      setDialog(dialogData);
    } catch (err) {
      console.error('Error loading dialog:', err);
    } finally {
      setDialogLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const parseMessage = (messageData) => {
    // Handle assistant messages (type: 'text')
    if (messageData.type === 'text' && messageData.payload?.payload?.slate?.content) {
      return messageData.payload.payload.slate.content
        .map(block => 
          block.children
            .map(child => child.text)
            .join('')
        )
        .join('\n')
        .trim();
    }
    
    // Handle user messages (type: 'request')
    if (messageData.type === 'request' && 
        messageData.payload?.type === 'intent' && 
        messageData.payload?.payload?.query) {
      return messageData.payload.payload.query;
    }

    return null;
  };

  const renderMessage = (message) => {
    const text = parseMessage(message);
    if (!text) return null;

    const isUser = message.type === 'request';

    return (
      <div 
        key={message.turnID} 
        className={`message ${isUser ? 'user' : 'assistant'}`}
      >
        <div className="message-content">
          <div className="message-header">
            <span className="message-sender">
              {isUser ? 'User' : 'Assistant'}
            </span>
            <span className="message-time">
              {new Date(message.startTime).toLocaleTimeString()}
            </span>
          </div>
          <div className="message-text">{text}</div>
        </div>
      </div>
    );
  };

  const renderDialog = (dialogData) => {
    if (!Array.isArray(dialogData)) return null;

    return (
      <div className="dialog-messages">
        <div className="dialog-header">
          <h2>Conversation</h2>
          <div className="dialog-meta">
            <span>{new Date(selectedTranscript.createdAt).toLocaleString()}</span>
          </div>
        </div>
        <div className="messages-container">
          {dialogData.map(message => renderMessage(message))}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (loading) return <div className="loading">Loading transcripts...</div>;
    if (error) return <div className="error">Error: {error}</div>;

    return (
      <div className="conversations-container">
        <div className="transcripts-list">
          <div className="transcripts-header">
            <h2>Transcripts ({transcripts.length})</h2>
          </div>
          <div className="transcripts-items">
            {transcripts.map(transcript => (
              <div 
                key={transcript.id} 
                className={`transcript-item ${selectedTranscript?.id === transcript.id ? 'selected' : ''}`}
                onClick={() => handleTranscriptSelect(transcript)}
              >
                <div className="transcript-user">
                  <span className="user-icon">👤</span>
                  <span className="user-id">{transcript.sessionId}</span>
                </div>
                <div className="transcript-meta">
                  <span className="timestamp">{formatDate(transcript.createdAt)}</span>
                  <div className="device-info">
                    <span>{transcript.device}</span>
                    <span>{transcript.os}</span>
                    <span>{transcript.browser}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="transcript-detail">
          {selectedTranscript ? (
            <div className="transcript-content">
              {dialogLoading ? (
                <div className="loading">Loading conversation...</div>
              ) : dialog ? (
                renderDialog(dialog)
              ) : (
                <div className="no-dialog">No conversation data available</div>
              )}
            </div>
          ) : (
            <div className="no-selection">
              Select a conversation to view details
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

export default Conversations; 