const express = require('express');
const router = express.Router();
const {
  getCustomers, createCustomer, updateCustomer, deleteCustomer,
  markWhatsappSent, getCustomerAnalytics,
} = require('../controllers/customerController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/analytics', getCustomerAnalytics);
router.route('/').get(getCustomers).post(createCustomer);
router.route('/:id').put(updateCustomer).delete(deleteCustomer);
router.patch('/:id/whatsapp-sent', markWhatsappSent);

module.exports = router;
