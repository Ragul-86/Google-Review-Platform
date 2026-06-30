const asyncHandler = require('express-async-handler');
const RewardConfig = require('../models/RewardConfig');
const { currentMonth, ensureMonthConfigs } = require('../utils/rewardMonth');

function getClientId(req) {
  return req.user.role === 'superadmin'
    ? req.query.clientId || req.body.clientId
    : req.user.clientId;
}

function withAnalytics(doc) {
  const o = doc.toObject ? doc.toObject({ virtuals: true }) : doc;
  const remaining   = Math.max(o.totalCards - o.claimed, 0);
  const distributed = o.claimed * o.amount;
  const progress    = o.totalCards > 0 ? Math.round((o.claimed / o.totalCards) * 100) : 0;
  return { ...o, remaining, distributed, progress };
}

/* ── GET /api/rewards/configs?month=YYYY-MM ───────────────────────
   Lists this client's reward tiers for the given month (defaults to
   the current month). If this month hasn't been configured yet, last
   month's tier setup is auto-cloned forward with claimed reset to 0 —
   this is the "monthly reset" happening automatically, while every
   prior month's documents remain in the DB as permanent history. */
const getConfigs = asyncHandler(async (req, res) => {
  const clientId = getClientId(req);
  if (!clientId) { res.status(400); throw new Error('clientId required'); }

  const month = req.query.month || currentMonth();
  await ensureMonthConfigs(RewardConfig, clientId, month);

  const configs = await RewardConfig.find({ clientId, month }).sort({ amount: 1 });
  res.json({ success: true, data: configs.map(withAnalytics), month });
});

/* ── GET /api/rewards/configs/months ───────────────────────────────
   Distinct months that have reward history — powers a "view past
   months" selector in Reward Analytics. */
const getConfigMonths = asyncHandler(async (req, res) => {
  const clientId = getClientId(req);
  if (!clientId) { res.status(400); throw new Error('clientId required'); }

  const months = await RewardConfig.distinct('month', { clientId });
  res.json({ success: true, data: months.sort().reverse() });
});

/* ── POST /api/rewards/configs ─────────────────────────────────────
   Body: { amount, totalCards, month? } — create a new reward tier. */
const createConfig = asyncHandler(async (req, res) => {
  const clientId = getClientId(req);
  if (!clientId) { res.status(400); throw new Error('clientId required'); }

  const { amount, totalCards, month } = req.body;
  if (!amount || !totalCards) { res.status(400); throw new Error('amount and totalCards are required'); }

  const config = await RewardConfig.create({
    clientId,
    amount: Number(amount),
    totalCards: Number(totalCards),
    claimed: 0,
    status: 'active',
    month: month || currentMonth(),
  });

  res.status(201).json({ success: true, data: withAnalytics(config) });
});

/* ── PUT /api/rewards/configs/:id ─────────────────────────────────── */
const updateConfig = asyncHandler(async (req, res) => {
  const config = await RewardConfig.findById(req.params.id);
  if (!config) { res.status(404); throw new Error('Reward tier not found'); }

  const clientId = getClientId(req);
  if (String(config.clientId) !== String(clientId)) { res.status(403); throw new Error('Not authorized'); }

  const { amount, totalCards } = req.body;
  if (amount !== undefined)     config.amount     = Number(amount);
  if (totalCards !== undefined) config.totalCards = Number(totalCards);

  await config.save();
  res.json({ success: true, data: withAnalytics(config) });
});

/* ── DELETE /api/rewards/configs/:id ──────────────────────────────── */
const deleteConfig = asyncHandler(async (req, res) => {
  const config = await RewardConfig.findById(req.params.id);
  if (!config) { res.status(404); throw new Error('Reward tier not found'); }

  const clientId = getClientId(req);
  if (String(config.clientId) !== String(clientId)) { res.status(403); throw new Error('Not authorized'); }

  await config.deleteOne();
  res.json({ success: true, message: 'Reward tier deleted' });
});

/* ── PATCH /api/rewards/configs/:id/toggle ───────────────────────── */
const toggleConfig = asyncHandler(async (req, res) => {
  const config = await RewardConfig.findById(req.params.id);
  if (!config) { res.status(404); throw new Error('Reward tier not found'); }

  const clientId = getClientId(req);
  if (String(config.clientId) !== String(clientId)) { res.status(403); throw new Error('Not authorized'); }

  config.status = config.status === 'active' ? 'inactive' : 'active';
  await config.save();
  res.json({ success: true, data: { _id: config._id, status: config.status } });
});

/* ── POST /api/rewards/configs/reset ──────────────────────────────
   "Reset Monthly Rewards" button — zeroes `claimed` on every tier for
   the target month (defaults to current month) on demand, without
   touching any other month's documents/history. */
const resetMonth = asyncHandler(async (req, res) => {
  const clientId = getClientId(req);
  if (!clientId) { res.status(400); throw new Error('clientId required'); }

  const month = req.body.month || currentMonth();
  await RewardConfig.updateMany({ clientId, month }, { $set: { claimed: 0 } });

  const configs = await RewardConfig.find({ clientId, month }).sort({ amount: 1 });
  res.json({ success: true, data: configs.map(withAnalytics), month });
});

module.exports = {
  getConfigs, getConfigMonths, createConfig, updateConfig, deleteConfig, toggleConfig, resetMonth,
};
