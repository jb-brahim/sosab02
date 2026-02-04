const express = require('express');
const router = express.Router();
const { login, logout } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/login', login);
router.post('/logout', protect, logout);

module.exports = router;

