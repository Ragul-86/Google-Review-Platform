const express = require('express');
const router = express.Router();
const {
  getClients, getClientById, createClient, updateClient,
  deleteClient, toggleClientStatus,
  updateOnboardingStatus, clientOnboardingAction,
  getMyClient, updateMyClient,
  resetClientPassword, resetLoginId, sendClientMessage,
  setPasswordViaToken,
} = require('../controllers/clientController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

router.use(protect);

// Client admin routes (no adminOnly)
router.get('/me', getMyClient);
router.put('/me', upload.single('businessLogo'), updateMyClient);
router.patch('/me/onboarding', clientOnboardingAction);

// Super admin routes
router.use(adminOnly);
router.route('/').get(getClients).post(upload.single('businessLogo'), createClient);
router.route('/:id').get(getClientById).put(upload.single('businessLogo'), updateClient).delete(deleteClient);
router.patch('/:id/status', toggleClientStatus);
router.patch('/:id/onboarding-status', updateOnboardingStatus);
router.post('/:id/reset-password', resetClientPassword);
router.patch('/:id/reset-login', resetLoginId);
router.post('/:id/message', sendClientMessage);

module.exports = router;
