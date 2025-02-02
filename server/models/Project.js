const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
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
});

module.exports = mongoose.model('Project', projectSchema); 