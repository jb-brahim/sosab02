const express = require('express');
const router = express.Router();
const {
  markAttendance,
  getWeeklyAttendance,
  getDailyAttendance
} = require('../controllers/attendanceController');
const { protect } = require('../middleware/auth');
const { logAction } = require('../middleware/auditLog');

// All routes require authentication
router.use(protect);

router
  .route('/')
  .post(logAction('create', 'Attendance'), markAttendance);

router
  .route('/project/:projectId/date/:date')
  .get(getDailyAttendance);

// Specific routes first
router
  .route('/worker/:workerId')
  .get(require('../controllers/attendanceController').getWorkerAttendance);

// Parameterized routes last
router
  .route('/:projectId/:week')
  .get(getWeeklyAttendance);

module.exports = router;

