const express = require('express');
const router = express.Router();
const { getQRCodes, createQRCode, deleteQRCode, regenerateQR, trackScan } = require('../controllers/qrcodeController');
const { protect } = require('../middleware/authMiddleware');

// Public
router.post('/scan/:token', trackScan);

// Protected
router.use(protect);
router.route('/').get(getQRCodes).post(createQRCode);
router.route('/:id').delete(deleteQRCode);
router.post('/:id/regenerate', regenerateQR);

module.exports = router;
