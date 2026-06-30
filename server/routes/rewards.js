const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getConfigs, getConfigMonths, createConfig, updateConfig, deleteConfig, toggleConfig, resetMonth, bulkGenerateConfigs,
} = require('../controllers/rewardConfigController');
const {
  getRewards, getRewardById, markWhatsappOpened, markSent, updateRewardStatus,
} = require('../controllers/rewardController');

// Protected — client / admin dashboard
// (Public, customer-facing endpoints for review requests + the scratch
// card link itself live in routes/reviewRequests.js and the /api/public/*
// handlers in server.js — this router is dashboard-only.)
router.use(protect);

// Reward tier configuration (Scratch Card Rewards)
router.get('/configs/months',      getConfigMonths);
router.get('/configs',             getConfigs);
router.post('/configs',            createConfig);
router.post('/configs/bulk-generate', bulkGenerateConfigs);
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
