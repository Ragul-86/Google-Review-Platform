const express = require('express');
const router = express.Router();
const { getAnalytics, getAdminOverview } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

router.use(protect);
router.get('/', getAnalytics);
router.get('/overview', adminOnly, getAdminOverview);

module.exports = router;
