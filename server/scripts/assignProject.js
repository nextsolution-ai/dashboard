const mongoose = require('mongoose');
const User = require('../models/User');
const Project = require('../models/Project');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function assignProject() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    const userEmail = 'raw_organics@website.com';
    const projectId = '67905a7a09cf076c221887da';
    
    // First verify the project exists
    const project = await Project.findById(projectId);
    if (!project) {
      throw new Error(`Project not found with ID: ${projectId}`);
    }
    console.log('Found project:', { id: project._id, name: project.name });

    const user = await User.findOneAndUpdate(
      { email: userEmail },
      { 
        $addToSet: { projects: projectId },
        current_project: projectId
      },
      { new: true }
    ).populate('projects').populate('current_project');

    if (user) {
      console.log('User updated successfully:', {
        id: user._id,
        email: user.email,
        projects: user.projects.map(p => ({ id: p._id, name: p.name })),
        currentProject: user.current_project ? {
          id: user.current_project._id,
          name: user.current_project.name
        } : null
      });
    } else {
      console.log('User not found with email:', userEmail);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

assignProject(); 