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
    const users = await User.find()
      .select('-password')
      .populate('projects', 'name')
      .populate('current_project', 'name')
      .lean();

    const formattedUsers = users.map(user => {
      // Ensure all permission fields exist with defaults
      const permissions = {
        home: true,
        conversations: true,
        knowledgeBase: true,
        prototype: false,  // Default to false
        ...(user.permissions || {}),  // Override with actual user permissions
      };

      return {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions,  // Use the complete permissions object
        projects: user.projects.map(project => project._id),
        projectsDetails: user.projects.map(project => ({
          id: project._id,
          name: project.name
        })),
        current_project: user.current_project?._id,
        current_project_name: user.current_project?.name,
        createdAt: user.createdAt
      };
    });

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
    const projects = await Project.find().lean();
    const users = await User.find().select('projects current_project').lean();
    
    const formattedProjects = projects.map(project => {
      // Find users who have this project assigned or as current project
      const projectUsers = users.filter(user => 
        user.projects.some(p => p.toString() === project._id.toString()) ||
        user.current_project?.toString() === project._id.toString()
      );

      return {
        id: project._id,
        name: project.name,
        bigquery_config: project.bigquery_config,
        voiceflow_config: project.voiceflow_config,
        prototype_config: project.prototype_config,
        has_prototype: !!project.prototype_config,
        users: projectUsers.map(user => ({
          id: user._id,
          isCurrentProject: user.current_project?.toString() === project._id.toString()
        })),
        usersCount: projectUsers.length,
        createdAt: project.created_at
      };
    });

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
    const project = new Project({
      name: req.body.name,
      bigquery_config: req.body.bigquery_config,
      voiceflow_config: req.body.voiceflow_config,
      prototype_config: req.body.prototype_config
    });

    await project.save();

    // Return the newly created project with empty users array and count
    res.json({
      id: project._id,
      name: project.name,
      bigquery_config: project.bigquery_config,
      voiceflow_config: project.voiceflow_config,
      prototype_config: project.prototype_config,
      has_prototype: !!project.prototype_config,
      users: [],
      usersCount: 0,
      createdAt: project.created_at
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ message: 'Failed to create project' });
  }
});

// POST /api/admin/users
// Create a new user
router.post('/users', [auth, admin], async (req, res) => {
  try {
    const { name, email, password, role, permissions } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user with permissions
    user = new User({
      name,
      email,
      password,
      role: role || 'user',
      permissions: permissions || {
        home: true,
        conversations: true,
        knowledgeBase: true,
        prototype: false
      }
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    // Return user without password
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      projects: [],
      current_project: null,
      createdAt: user.createdAt
    };

    res.json(userResponse);
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

// PUT /api/admin/projects/:id
router.put('/projects/:id', [auth, admin], async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        bigquery_config: req.body.bigquery_config,
        voiceflow_config: req.body.voiceflow_config,
        prototype_config: req.body.prototype_config
      },
      { new: true }
    ).lean();

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const users = await User.find({
      $or: [
        { projects: project._id },
        { current_project: project._id }
      ]
    }).select('projects current_project').lean();

    const projectUsers = users.map(user => ({
      id: user._id,
      isCurrentProject: user.current_project?.toString() === project._id.toString()
    }));

    res.json({
      id: project._id,
      name: project.name,
      bigquery_config: project.bigquery_config,
      voiceflow_config: project.voiceflow_config,
      prototype_config: project.prototype_config,
      has_prototype: !!project.prototype_config,
      users: projectUsers,
      usersCount: projectUsers.length,
      createdAt: project.created_at
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ message: 'Failed to update project' });
  }
});

// PUT /api/admin/users/:id
router.put('/users/:id', [auth, admin], async (req, res) => {
  try {
    const { name, email, role, password, permissions } = req.body;
    
    const updateFields = {
      name,
      email,
      role,
      permissions: permissions || {
        home: true,
        conversations: true,
        knowledgeBase: true,
        prototype: false
      }
    };

    // Only update password if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateFields.password = await bcrypt.hash(password, salt);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      projects: user.projects,
      current_project: user.current_project,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// PUT /api/admin/users/:id/permissions
router.put('/users/:id/permissions', [auth, admin], async (req, res) => {
  try {
    const { permissions } = req.body;
    
    console.log('Incoming permissions update:', permissions);

    // Validate permissions object
    if (!permissions || typeof permissions !== 'object') {
      return res.status(400).json({ message: 'Invalid permissions format' });
    }

    // Create update object with flattened structure
    const updateObj = {
      'permissions.home': Boolean(permissions.home),
      'permissions.conversations': Boolean(permissions.conversations),
      'permissions.knowledgeBase': Boolean(permissions.knowledgeBase),
      'permissions.prototype': Boolean(permissions.prototype),
      'permissions.emailDash': Boolean(permissions.emailDash)
    };

    console.log('Update object:', updateObj);

    // Update the user
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateObj },
      { 
        new: true,
        runValidators: true 
      }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Log the raw user document before transformation
    console.log('Raw user document:', {
      'permissions.home': user.get('permissions.home'),
      'permissions.conversations': user.get('permissions.conversations'),
      'permissions.knowledgeBase': user.get('permissions.knowledgeBase'),
      'permissions.prototype': user.get('permissions.prototype'),
      'permissions.emailDash': user.get('permissions.emailDash')
    });

    // The response will be automatically transformed by the toJSON transform
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: {
        home: user['permissions.home'],
        conversations: user['permissions.conversations'],
        knowledgeBase: user['permissions.knowledgeBase'],
        prototype: user['permissions.prototype'],
        emailDash: user['permissions.emailDash']
      },
      projects: user.projects,
      current_project: user.current_project
    });
  } catch (error) {
    console.error('Error updating user permissions:', error);
    res.status(500).json({ message: 'Failed to update user permissions' });
  }
});

module.exports = router; 