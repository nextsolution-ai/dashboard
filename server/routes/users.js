const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const Project = require('../models/Project');

// GET /api/users/projects
router.get('/projects', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate('projects')
      .populate('current_project');

    res.json({
      projects: user.projects.map(project => ({
        id: project._id,
        name: project.name
      })),
      current_project: user.current_project?._id
    });
  } catch (error) {
    console.error('Error fetching user projects:', error);
    res.status(500).json({ message: 'Failed to fetch user projects' });
  }
});

// POST /api/users/switch-project
router.post('/switch-project', auth, async (req, res) => {
  try {
    const { projectId } = req.body;
    const user = await User.findById(req.user.userId);
    
    if (!user.projects.includes(projectId)) {
      return res.status(400).json({ message: 'Project not assigned to user' });
    }

    user.current_project = projectId;
    await user.save();

    res.json({ message: 'Project switched successfully' });
  } catch (error) {
    console.error('Error switching project:', error);
    res.status(500).json({ message: 'Failed to switch project' });
  }
});

// GET /api/users/project/:id
router.get('/project/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    // Check if user has access to this project
    if (!user.projects.includes(req.params.id) && !user.current_project?.equals(req.params.id)) {
      return res.status(403).json({ message: 'Access denied to this project' });
    }

    const project = await Project.findById(req.params.id).lean();
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    console.error('Error fetching project details:', error);
    res.status(500).json({ message: 'Failed to fetch project details' });
  }
});

module.exports = router; 