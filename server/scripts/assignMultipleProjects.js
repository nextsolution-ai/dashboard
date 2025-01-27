const mongoose = require('mongoose');
const User = require('../models/User');
const Project = require('../models/Project');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const projectConfigs = {
  // Spintso project config
  "679060c5d0171d1d8a65cef7": {
    name: "Spintso",
    bigquery_config: {
      project_id: "grand-century-443515-g4",
      dataset_id: "my_dataset",
      table_id: "user_navigation_spintso"
    },
    voiceflow_config: {
      api_key: "VF.DM.678ac49edb80fb6a72c1e4b0.rDoZRu0O11CtkOCN",
      project_id: "678a517b631a401e6d1ace38"
    }
  },
  // Cannaone project config (new)
  "NEW_PROJECT_ID": {  // This will be replaced with actual ID after creation
    name: "Cannaone",
    bigquery_config: {
      project_id: "grand-century-443515-g4",
      dataset_id: "my_dataset",
      table_id: "user_navigation"
    },
    voiceflow_config: {
      api_key: "VF.DM.6759afbcd988a1fa45a81198.hFkVKG6ZZi5I14zN",
      project_id: "6759aecd0f8a65e420552708"
    }
  }
};

const userProjects = [
  {
    email: "spintso@website.com",
    projectId: "679060c5d0171d1d8a65cef7" // Spintso project
  },
  {
    email: "cannaone@website.com",
    projectId: "NEW_PROJECT_ID" // Will be updated with actual Cannaone project ID
  }
];

async function assignProjects() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);

    // First, create the new Cannaone project
    const newProject = new Project({
      name: "Cannaone",
      bigquery_config: projectConfigs.NEW_PROJECT_ID.bigquery_config,
      voiceflow_config: projectConfigs.NEW_PROJECT_ID.voiceflow_config
    });
    
    const savedProject = await newProject.save();
    console.log('Created new Cannaone project:', {
      id: savedProject._id,
      name: savedProject.name
    });

    // Update projectConfigs and userProjects with the new project ID
    projectConfigs[savedProject._id] = projectConfigs.NEW_PROJECT_ID;
    delete projectConfigs.NEW_PROJECT_ID;
    
    userProjects.find(u => u.email === "cannaone@website.com").projectId = savedProject._id;

    // Remove Raw Organics project from Cannaone user
    await User.findOneAndUpdate(
      { email: "cannaone@website.com" },
      { 
        $pull: { projects: "6790614ad0171d1d8a65cf09" },
        $unset: { current_project: "" }
      }
    );

    // Update projects
    for (const [projectId, config] of Object.entries(projectConfigs)) {
      const updatedProject = await Project.findByIdAndUpdate(
        projectId,
        { $set: config },
        { new: true }
      );
      console.log(`Updated project ${config.name}:`, {
        id: updatedProject._id,
        name: updatedProject.name,
        bigquery_config: updatedProject.bigquery_config,
        voiceflow_config: {
          project_id: updatedProject.voiceflow_config.project_id,
          hasApiKey: !!updatedProject.voiceflow_config.api_key
        }
      });
    }

    // Assign projects to users
    for (const assignment of userProjects) {
      const user = await User.findOneAndUpdate(
        { email: assignment.email },
        {
          $addToSet: { projects: assignment.projectId },
          current_project: assignment.projectId
        },
        { new: true }
      ).populate('projects').populate('current_project');

      if (user) {
        console.log(`Updated user ${user.email}:`, {
          id: user._id,
          email: user.email,
          projects: user.projects.map(p => ({ id: p._id, name: p.name })),
          currentProject: user.current_project ? {
            id: user.current_project._id,
            name: user.current_project.name
          } : null
        });
      } else {
        console.log(`User not found with email: ${assignment.email}`);
      }
    }

    console.log('All assignments completed');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

assignProjects(); 