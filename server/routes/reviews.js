const express = require('express');
const router = express.Router();
const { getReviews, getReviewById, submitReview, deleteReview, getOverview, generateSuggestions } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// Public
router.post('/submit', submitReview);
router.post('/suggestions', generateSuggestions);

// Protected
router.use(protect);
router.get('/overview', getOverview);
router.get('/', getReviews);
router.get('/:id', getReviewById);
router.delete('/:id', adminOnly, deleteReview);

module.exports = router;
