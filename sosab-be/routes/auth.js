const express = require('express');
const router = express.Router();
const { login, logout, updatePassword, updateDetails, requestDeleteOtp } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/login', login);
router.post('/logout', protect, logout);
router.post('/request-delete-otp', protect, requestDeleteOtp);
router.put('/updatepassword', protect, updatePassword);
router.put('/updatedetails', protect, updateDetails);

module.exports = router;

