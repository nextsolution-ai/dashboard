const mongoose = require('mongoose');

// Check if the model already exists before creating it
const Project = mongoose.models.Project || mongoose.model('Project', new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  bigquery_config: {
    project_id: String,
    dataset_id: String,
    table_id: String
  },
  voiceflow_config: {
    api_key: String,
    project_id: String
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}));

module.exports = Project; 