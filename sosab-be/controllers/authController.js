const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const generateToken = require('../utils/generateToken');
const AuditLog = require('../models/AuditLog');

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password'
    });
  }

  // Check for user
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Check if user is active
  if (!user.active) {
    return res.status(401).json({
      success: false,
      message: 'User account is disabled'
    });
  }

  // Check if password matches
  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Log audit
  await AuditLog.create({
    userId: user._id,
    action: 'login',
    resource: 'Auth',
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent')
  });

  // Generate token
  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      assignedProjects: user.assignedProjects
    }
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res) => {
  // Log audit
  await AuditLog.create({
    userId: req.user._id,
    action: 'logout',
    resource: 'Auth',
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent')
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = asyncHandler(async (req, res) => {
  const { name, email } = req.body;

  const user = await User.findById(req.user.id);

  if (name) user.name = name;
  if (email) user.email = email;

  await user.save();

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  if (!(await user.comparePassword(currentPassword))) {
    return res.status(401).json({
      success: false,
      message: 'Incorrect current password'
    });
  }

  user.password = newPassword;
  await user.save();

  // Log audit
  await AuditLog.create({
    userId: user._id,
    action: 'update_password',
    resource: 'Auth',
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent')
  });

  // Send new token
  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    token: generateToken(user._id),
    message: 'Password updated successfully'
  });
});
