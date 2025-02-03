const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Project = require('../models/Project');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const bcrypt = require('bcryptjs');

// Test endpoint to verify routing
router.get('/test', [auth, admin], (req, res) => {
  res.json({ message: 'Admin routes working' });
});

// GET /api/admin/users
// List all users with their projects
router.get('/users', [auth, admin], async (req, res) => {
  try {
    const users = await User.find().select('-password').populate('projects').populate('current_project');
    const projects = await Project.find();

    const formattedUsers = users.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      projects: user.projects.map(project => project._id),
      projectsDetails: user.projects.map(project => ({
        id: project._id,
        name: project.name
      })),
      current_project: user.current_project?._id,
      current_project_name: user.current_project?.name,
      createdAt: user.createdAt
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

// POST /api/admin/projects
// Create a new project
router.post('/projects', [auth, admin], async (req, res) => {
  try {
    const { 
      name, 
      bigquery_config, 
      voiceflow_config 
    } = req.body;

    // Create new project
    const project = new Project({
      name,
      bigquery_config: {
        project_id: bigquery_config.project_id,
        dataset_id: bigquery_config.dataset_id,
        table_id: bigquery_config.table_id
      },
      voiceflow_config: {
        api_key: voiceflow_config.api_key,
        project_id: voiceflow_config.project_id
      }
    });

    await project.save();

    // Return the project without sensitive data
    const projectResponse = {
      id: project._id,
      name: project.name,
      bigquery_config: {
        project_id: project.bigquery_config.project_id,
        dataset_id: project.bigquery_config.dataset_id,
        table_id: project.bigquery_config.table_id
      },
      voiceflow_config: {
        project_id: project.voiceflow_config.project_id,
        hasApiKey: !!project.voiceflow_config.api_key
      },
      createdAt: project.created_at
    };

    res.status(201).json(projectResponse);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ message: 'Failed to create project' });
  }
});

// POST /api/admin/users
// Create a new user
router.post('/users', [auth, admin], async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'user'
    });

    await user.save();

    // Return user without password
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    };

    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Failed to create user' });
  }
});

// DELETE /api/admin/projects/:id
router.delete('/projects/:id', [auth, admin], async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Also remove project references from users
    await User.updateMany(
      { $or: [
        { projects: req.params.id },
        { current_project: req.params.id }
      ]},
      { 
        $pull: { projects: req.params.id },
        $unset: { current_project: "" }
      }
    );

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ message: 'Failed to delete project' });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', [auth, admin], async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// POST /api/admin/users/:id/assign-project
router.post('/users/:id/assign-project', [auth, admin], async (req, res) => {
  try {
    const { projectId } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Add project to user's projects array if not already there
    if (!user.projects.includes(projectId)) {
      user.projects.push(projectId);
    }

    // Set as current project
    user.current_project = projectId;

    await user.save();

    res.json({
      message: 'Project assigned successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        projects: user.projects,
        current_project: user.current_project
      }
    });
  } catch (error) {
    console.error('Error assigning project:', error);
    res.status(500).json({ message: 'Failed to assign project' });
  }
});

// POST /api/admin/users/:id/remove-project
router.post('/users/:id/remove-project', [auth, admin], async (req, res) => {
  try {
    const { projectId } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove project from user's projects array
    user.projects = user.projects.filter(p => !p.equals(projectId));

    // If removed project was current project, unset it
    if (user.current_project && user.current_project.equals(projectId)) {
      user.current_project = user.projects[0] || null;
    }

    await user.save();

    res.json({
      message: 'Project removed successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        projects: user.projects,
        current_project: user.current_project
      }
    });
  } catch (error) {
    console.error('Error removing project:', error);
    res.status(500).json({ message: 'Failed to remove project' });
  }
});

module.exports = router; 