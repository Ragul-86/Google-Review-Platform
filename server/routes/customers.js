const express = require('express');
const router = express.Router();
const {
  getCustomers, createCustomer, updateCustomer, deleteCustomer,
  markWhatsappSent, getCustomerAnalytics,
  searchCustomers, quickCreateCustomer,
} = require('../controllers/customerController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// Named sub-routes — must come BEFORE /:id to avoid wildcard capture
router.get('/analytics', getCustomerAnalytics);
router.get('/search',    searchCustomers);       // autocomplete for Create Scratch Card
router.post('/quick',    quickCreateCustomer);   // lightweight create (no service required)

router.route('/').get(getCustomers).post(createCustomer);
router.route('/:id').put(updateCustomer).delete(deleteCustomer);
router.patch('/:id/whatsapp-sent', markWhatsappSent);

module.exports = router;
