const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Create user (Admin only)
// @route   POST /api/users
// @access  Private/Admin
// @desc    Create user (Admin only)
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, assignedProjects } = req.body;

  // RESTRICTION: Prevent creating new 'Admin' users
  if (role === 'Admin') {
    return res.status(403).json({
      success: false,
      message: 'Creating additional Admin accounts is restricted.'
    });
  }

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User already exists'
    });
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role || 'Project Manager',
    assignedProjects: assignedProjects || []
  });

  res.status(201).json({
    success: true,
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      assignedProjects: user.assignedProjects,
      active: user.active
    }
  });
});

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = asyncHandler(async (req, res) => {
  const { projectId } = req.query;

  let query = {};
  if (projectId) {
    query.assignedProjects = projectId;
  }

  const users = await User.find(query).select('-password').populate('assignedProjects', 'name location');

  res.status(200).json({
    success: true,
    count: users.length,
    data: users
  });
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password').populate('assignedProjects');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update user
// @route   PATCH /api/users/:id
// @access  Private/Admin
exports.updateUser = asyncHandler(async (req, res) => {
  const { name, email, role, assignedProjects, active } = req.body;

  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // RESTRICTION: Prevent updating Admin users via this route
  if (user.role === 'Admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin accounts cannot be modified here. Use Settings.'
    });
  }

  if (name) user.name = name;
  if (email) user.email = email;
  if (role) {
    // Prevent promoting to Admin
    if (role === 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot promote user to Admin role.'
      });
    }
    user.role = role;
  }
  if (assignedProjects !== undefined) user.assignedProjects = assignedProjects;
  if (active !== undefined) user.active = active;
  user.updatedAt = new Date();

  await user.save();

  res.status(200).json({
    success: true,
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      assignedProjects: user.assignedProjects,
      active: user.active
    }
  });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // RESTRICTION: Prevent deleting Admin users
  if (user.role === 'Admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin accounts cannot be deleted.'
    });
  }

  // Soft delete - set active to false
  user.active = false;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'User disabled successfully'
  });
});

