const mongoose = require('mongoose');

// Check if the model already exists before creating it
const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  projects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }],
  current_project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  permissions: {
    type: {
      home: { type: Boolean, default: true },
      conversations: { type: Boolean, default: true },
      knowledgeBase: { type: Boolean, default: true },
      prototype: { type: Boolean, default: true }
    },
    default: {
      home: true,
      conversations: true,
      knowledgeBase: true,
      prototype: true
    },
    _id: false
  }
}));

module.exports = User; 