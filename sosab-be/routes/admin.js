const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getDashboardStats } = require('../controllers/adminController');

router.use(protect);
router.use(authorize('Admin'));

router.get('/stats', getDashboardStats);

module.exports = router;
