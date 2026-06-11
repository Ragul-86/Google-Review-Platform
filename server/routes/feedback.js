const express = require('express');
const router = express.Router();
const { getFeedback, getFeedbackById, updateFeedbackStatus, deleteFeedback } = require('../controllers/feedbackController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', getFeedback);
router.get('/:id', getFeedbackById);
router.patch('/:id/status', updateFeedbackStatus);
router.delete('/:id', deleteFeedback);

module.exports = router;
