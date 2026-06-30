const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createReviewRequest, getReviewRequests, getReviewRequestById,
  assignCustomerDetails, approveReviewRequest, rejectReviewRequest, sendScratchCard,
} = require('../controllers/reviewRequestController');

// Public — customer-facing "I've Submitted My Review" (NO AUTH).
// Only ever writes a Pending-Verification record. Never creates a
// reward, never touches WhatsApp.
router.post('/', createReviewRequest);

// Protected — Review Verification dashboard
router.use(protect);

router.get('/',                       getReviewRequests);
router.get('/:id',                    getReviewRequestById);
router.patch('/:id/assign-customer',  assignCustomerDetails);
router.patch('/:id/approve',          approveReviewRequest);
router.patch('/:id/reject',           rejectReviewRequest);
router.patch('/:id/send-scratch-card', sendScratchCard);

module.exports = router;
