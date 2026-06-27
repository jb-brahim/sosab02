const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getDashboardStats, getAuditLogs } = require('../controllers/adminController');

router.use(protect);
router.use(authorize('Admin'));

router.get('/stats', getDashboardStats);
router.get('/logs', getAuditLogs);

module.exports = router;
