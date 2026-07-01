const express = require('express');
const router = express.Router();
const { protect, superAdmin } = require('../middleware/authMiddleware');
const {
  getConfigs, getConfigMonths, createConfig, updateConfig, deleteConfig, toggleConfig, resetMonth, bulkGenerateConfigs,
  getCycleStatus, getMonthlyHistory,
} = require('../controllers/rewardConfigController');
const {
  getRewards, getRewardById, getCampaigns, createTransaction, markWhatsappOpened, markSent, updateRewardStatus,
} = require('../controllers/rewardController');
const {
  getAdminScratchCards, getAdminScratchCardAnalytics,
} = require('../controllers/adminRewardController');

// Protected — client / admin dashboard
// (The public, customer-facing Scratch Card link itself is handled by the
// /api/public/reward/* routes mounted directly in server.js — this router
// is dashboard-only: Create Scratch Card, list/view/send/redeem.)
router.use(protect);

// Reward tier configuration (Scratch Card Rewards)
router.get('/configs/months',      getConfigMonths);
router.get('/configs/cycle-status', getCycleStatus);
router.get('/configs/history',     getMonthlyHistory);
router.get('/configs',             getConfigs);
router.post('/configs',            createConfig);
router.post('/configs/bulk-generate', bulkGenerateConfigs);
router.put('/configs/:id',         updateConfig);
router.delete('/configs/:id',      deleteConfig);
router.patch('/configs/:id/toggle', toggleConfig);
router.post('/configs/reset',      resetMonth);

// Super-Admin: cross-client scratch card visibility + analytics
// Both routes require protect (already applied above) + superAdmin middleware.
// Clients can never reach these — the regular /transactions endpoint enforces
// per-client data separation via getClientId() → req.user.clientId for clients.
router.get('/admin/all',       superAdmin, getAdminScratchCards);
router.get('/admin/analytics', superAdmin, getAdminScratchCardAnalytics);

// Reward transactions (Reward Management)
router.get('/campaigns',                          getCampaigns);
router.get('/transactions',                       getRewards);
router.post('/transactions',                      createTransaction);
router.get('/transactions/:id',                   getRewardById);
router.patch('/transactions/:id/whatsapp-opened', markWhatsappOpened);
router.patch('/transactions/:id/mark-sent',       markSent);
router.patch('/transactions/:id/status',          updateRewardStatus);

module.exports = router;
