const Role = require('../models/Role');

// Check if user has specific permission
exports.checkPermission = (permission) => {
  return async (req, res, next) => {
    try {
      const user = req.user;

      // Admin has all permissions
      if (user.role === 'Admin') {
        return next();
      }

      // Check role permissions
      const role = await Role.findOne({ name: user.role });
      
      if (!role || !role.permissions.includes(permission)) {
        return res.status(403).json({
          success: false,
          message: `You don't have permission to ${permission}`
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error checking permissions'
      });
    }
  };
};

// Role-based access control helper
exports.hasRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient role privileges.'
      });
    }
    next();
  };
};

