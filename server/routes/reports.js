const express = require('express');
const router = express.Router();
const { exportReviews, exportFeedback, exportFull, exportClients, exportCustomers } = require('../controllers/reportController');
const { protect, superAdmin } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/reviews', exportReviews);
router.get('/feedback', exportFeedback);
router.get('/full', exportFull);
router.get('/clients', superAdmin, exportClients);
router.get('/customers', superAdmin, exportCustomers);

module.exports = router;
