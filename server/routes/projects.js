const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const auth = require('../middleware/auth');
const User = require('../models/User');

// Create new project
router.post('/', auth, async (req, res) => {
  try {
    const project = new Project({
      name: req.body.name,
      bigquery_config: {
        project_id: req.body.bigquery_project_id,
        dataset_id: req.body.bigquery_dataset_id,
        table_id: req.body.bigquery_table_id
      },
      voiceflow_config: {
        api_key: req.body.voiceflow_api_key,
        project_id: req.body.voiceflow_project_id
      }
    });

    await project.save();
    res.json(project);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Get user's projects
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('projects');
    res.json(user.projects);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router; 