const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    console.log('Admin middleware - Request path:', req.path);
    console.log('Admin middleware - userId:', req.user.userId);
    const user = await User.findById(req.user.userId);
    console.log('User found:', user ? 'Yes' : 'No', 'Role:', user?.role);
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  } catch (err) {
    console.error('Admin middleware error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}; 