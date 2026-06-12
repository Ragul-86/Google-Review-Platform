const express = require('express');
const router = express.Router();
const { login, refreshToken, logout, getMe } = require('../controllers/authController');
const { setPasswordViaToken } = require('../controllers/clientController');
const { protect } = require('../middleware/authMiddleware');

router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.post('/set-password', setPasswordViaToken);  // public — new client first-time setup

module.exports = router;
