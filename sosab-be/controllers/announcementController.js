const Announcement = require('../models/Announcement');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Create an announcement (Admin only)
// @route   POST /api/announcements
// @access  Private/Admin
exports.createAnnouncement = asyncHandler(async (req, res) => {
  const { title, content, targetType, targetUsers } = req.body;

  if (!title || !content) {
    return res.status(400).json({
      success: false,
      message: 'Veuillez fournir un titre et un contenu pour l\'annonce.'
    });
  }

  if (targetType === 'specific' && (!targetUsers || targetUsers.length === 0)) {
    return res.status(400).json({
      success: false,
      message: 'Veuillez sélectionner au moins un utilisateur cible.'
    });
  }

  const announcement = await Announcement.create({
    title,
    content,
    targetType: targetType || 'all',
    targetUsers: targetType === 'specific' ? targetUsers : [],
    createdBy: req.user._id
  });

  res.status(201).json({
    success: true,
    data: announcement
  });
});

// @desc    Get announcements (All for Admin, active unread for others)
// @route   GET /api/announcements
// @access  Private
exports.getAnnouncements = asyncHandler(async (req, res) => {
  const userRole = req.user.role;
  const userId = req.user._id;

  // Admins get all announcements to manage them
  if (userRole === 'Admin') {
    const announcements = await Announcement.find()
      .sort({ createdAt: -1 })
      .populate('targetUsers', 'name email role')
      .populate('readBy', 'name email role');

    return res.status(200).json({
      success: true,
      count: announcements.length,
      data: announcements
    });
  }

  // Regular users get active, unread announcements targeting them
  const announcements = await Announcement.find({
    readBy: { $ne: userId }, // Not read yet
    $or: [
      { targetType: 'all' }, // Targets everyone
      { 
        targetType: 'specific', // Targets specific users
        targetUsers: userId 
      }
    ]
  }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: announcements.length,
    data: announcements
  });
});

// @desc    Mark announcement as read/dismissed by user
// @route   POST /api/announcements/:id/dismiss
// @access  Private
exports.dismissAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);

  if (!announcement) {
    return res.status(404).json({
      success: false,
      message: 'Annonce introuvable.'
    });
  }

  // Check if already read
  if (!announcement.readBy.includes(req.user._id)) {
    announcement.readBy.push(req.user._id);
    await announcement.save();
  }

  res.status(200).json({
    success: true,
    message: 'Annonce fermée avec succès.'
  });
});

// @desc    Delete an announcement (Admin only)
// @route   DELETE /api/announcements/:id
// @access  Private/Admin
exports.deleteAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);

  if (!announcement) {
    return res.status(404).json({
      success: false,
      message: 'Annonce introuvable.'
    });
  }

  await announcement.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Annonce supprimée avec succès.'
  });
});
