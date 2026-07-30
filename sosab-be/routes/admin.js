const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getDashboardStats, getAuditLogs, triggerManualBackup } = require('../controllers/adminController');

router.use(protect);
router.use(authorize('Admin'));

router.get('/stats', getDashboardStats);
router.get('/logs', getAuditLogs);
router.post('/backup/trigger', triggerManualBackup);

module.exports = router;
