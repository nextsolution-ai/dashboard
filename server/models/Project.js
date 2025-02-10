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
  prototype_config: {
    openai_api_key: String,
    user_prompt: {
      type: String,
      default: 'Search random things in the kb and make 5 questions'
    },
    assistant_id: String,
    extensions_cdn: {
      type: String,
      default: 'https://nextsolution-ai.github.io/-ldrekontakt/extensions.js'
    },
    style_bot_cdn: {
      type: String,
      default: 'https://nextsolution-ai.github.io/-ldrekontakt/style-bot.css'
    },
    bundle_cdn: {
      type: String,
      default: 'https://nextsolution-ai.github.io/-ldrekontakt/bundle.mjs'
    },
    extensions: {
      type: [String],
      default: [
        'BrowserDataExtension',
        'OpenAIAssistantsV2Extension',
        'DisableInputExtension',
        'PlaceholderExtension',
        'CustomScreenExtension',
        'FeedbackExtension'
      ]
    },
    project_id: String
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Add a virtual property for has_prototype
projectSchema.virtual('has_prototype').get(function() {
  return !!this.prototype_config && Object.keys(this.prototype_config).length > 0;
});

// Ensure virtuals are included when converting to JSON
projectSchema.set('toJSON', { virtuals: true });
projectSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Project', projectSchema); 