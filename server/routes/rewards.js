const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { claimReward } = require('../controllers/rewardClaimController');
const {
  getConfigs, getConfigMonths, createConfig, updateConfig, deleteConfig, toggleConfig, resetMonth,
} = require('../controllers/rewardConfigController');
const {
  getRewards, getRewardById, markWhatsappOpened, markSent, updateRewardStatus,
} = require('../controllers/rewardController');

// Public — customer-facing scratch card claim (NO AUTH).
// This is the only write path reachable from the public review page.
// It never sends a WhatsApp message — it logs a "Pending" reward that
// shows up in the client's Reward Management dashboard for the client
// to send manually.
router.post('/claim', claimReward);

// Protected — client / admin dashboard
router.use(protect);

// Reward tier configuration (Scratch Card Settings)
router.get('/configs/months',      getConfigMonths);
router.get('/configs',             getConfigs);
router.post('/configs',            createConfig);
router.put('/configs/:id',         updateConfig);
router.delete('/configs/:id',      deleteConfig);
router.patch('/configs/:id/toggle', toggleConfig);
router.post('/configs/reset',      resetMonth);

// Reward transactions (Reward Management)
router.get('/transactions',                       getRewards);
router.get('/transactions/:id',                   getRewardById);
router.patch('/transactions/:id/whatsapp-opened', markWhatsappOpened);
router.patch('/transactions/:id/mark-sent',       markSent);
router.patch('/transactions/:id/status',          updateRewardStatus);

module.exports = router;
