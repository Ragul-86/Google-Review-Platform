const express = require('express');
const router = express.Router();
const { exportReviews, exportFeedback, exportFull } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/reviews', exportReviews);
router.get('/feedback', exportFeedback);
router.get('/full', exportFull);

module.exports = router;
