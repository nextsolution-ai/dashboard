const mongoose = require('mongoose');
const Project = require('../models/Project');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function updateProject() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    const projectId = '67905a7a09cf076c221887da';
    
    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      {
        $set: {
          bigquery_config: {
            project_id: 'grand-century-443515-g4',
            dataset_id: 'my_dataset',
            table_id: 'user_navigation_raw_organics'
          },
          voiceflow_config: {
            api_key: 'VF.DM.67905946d1fbb4e91b7c80e5.IkOZFzOtkbjT6dXt',
            project_id: '678a740aedd4e5eafd380cc4'
          }
        }
      },
      { new: true }
    );

    if (updatedProject) {
      console.log('Project updated successfully:', {
        id: updatedProject._id,
        name: updatedProject.name,
        bigquery_config: updatedProject.bigquery_config,
        voiceflow_config: {
          project_id: updatedProject.voiceflow_config.project_id,
          hasApiKey: !!updatedProject.voiceflow_config.api_key
        }
      });
    } else {
      console.log('Project not found with ID:', projectId);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

updateProject(); 