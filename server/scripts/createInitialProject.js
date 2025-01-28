const mongoose = require('mongoose');
const Project = require('../models/Project');
const User = require('../models/User');
require('dotenv').config();

const createProject = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create the project
    const project = new Project({
      name: 'Spintso Chatbot',
      bigquery_config: {
        project_id: 'grand-century-443515-g4',
        dataset_id: 'my_dataset',
        table_id: 'user_navigation_spintso'
      },
      voiceflow_config: {
        api_key: 'VF.DM.678ac49edb80fb6a72c1e4b0.rDoZRu0O11CtkOCN',
        project_id: '678a517b631a401e6d1ace38'
      }
    });

    await project.save();
    console.log('Project created:', project._id);

    // Find the user and assign the project
    const user = await User.findOne({ email: 'test@example.com' });
    if (!user) {
      console.log('User not found');
      return;
    }

    user.projects = [project._id];
    user.current_project = project._id;
    await user.save();

    console.log('Project assigned to user successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

createProject(); 