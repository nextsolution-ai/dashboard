const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Project = require('../models/Project');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// Test endpoint to verify routing
router.get('/test', [auth, admin], (req, res) => {
  res.json({ message: 'Admin routes working' });
});

// GET /api/admin/users
// List all users with their projects
router.get('/users', [auth, admin], async (req, res) => {
  try {
    const users = await User.find()
      .select('-password') // Exclude password
      .populate('projects')
      .populate('current_project');

    const formattedUsers = users.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      projectsCount: user.projects.length,
      projects: user.projects.map(project => ({
        id: project._id,
        name: project.name
      })),
      currentProject: user.current_project ? {
        id: user.current_project._id,
        name: user.current_project.name
      } : null
    }));

    res.json(formattedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// GET /api/admin/projects
// List all projects with their associated users
router.get('/projects', [auth, admin], async (req, res) => {
  try {
    const projects = await Project.find();
    const users = await User.find().select('-password');

    const formattedProjects = await Promise.all(projects.map(async project => {
      // Find users who have this project
      const projectUsers = users.filter(user => 
        user.projects.includes(project._id) ||
        user.current_project?.equals(project._id)
      );

      return {
        id: project._id,
        name: project.name,
        createdAt: project.created_at,
        bigquery_config: {
          project_id: project.bigquery_config.project_id,
          dataset_id: project.bigquery_config.dataset_id,
          table_id: project.bigquery_config.table_id
        },
        voiceflow_config: {
          project_id: project.voiceflow_config.project_id,
          // Don't send API key for security
          hasApiKey: !!project.voiceflow_config.api_key
        },
        users: projectUsers.map(user => ({
          id: user._id,
          name: user.name,
          email: user.email,
          isCurrentProject: user.current_project?.equals(project._id)
        }))
      };
    }));

    res.json(formattedProjects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Failed to fetch projects' });
  }
});

// GET /api/admin/projects/:projectId/users
// Get users for a specific project
router.get('/projects/:projectId/users', [auth, admin], async (req, res) => {
  try {
    const users = await User.find({
      $or: [
        { projects: req.params.projectId },
        { current_project: req.params.projectId }
      ]
    }).select('-password');

    const formattedUsers = users.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      isCurrentProject: user.current_project?.equals(req.params.projectId)
    }));

    res.json(formattedUsers);
  } catch (error) {
    console.error('Error fetching project users:', error);
    res.status(500).json({ message: 'Failed to fetch project users' });
  }
});

module.exports = router; 