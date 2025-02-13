const mongoose = require('mongoose');

// Create the main user schema
const userSchema = new mongoose.Schema({
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
  // Flatten the permissions structure
  'permissions.home': {
    type: Boolean,
    default: true
  },
  'permissions.conversations': {
    type: Boolean,
    default: true
  },
  'permissions.knowledgeBase': {
    type: Boolean,
    default: true
  },
  'permissions.prototype': {
    type: Boolean,
    default: false
  }
});

// Add a toJSON transform to restructure the permissions
userSchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.permissions = {
      home: ret['permissions.home'],
      conversations: ret['permissions.conversations'],
      knowledgeBase: ret['permissions.knowledgeBase'],
      prototype: ret['permissions.prototype']
    };
    
    // Remove the flattened fields
    delete ret['permissions.home'];
    delete ret['permissions.conversations'];
    delete ret['permissions.knowledgeBase'];
    delete ret['permissions.prototype'];
    
    return ret;
  }
});

// Create the model
const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User; 