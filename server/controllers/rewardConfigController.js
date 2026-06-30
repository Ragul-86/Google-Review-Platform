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
  if (!amount || totalCards === undefined || totalCards === null || Number(totalCards) < 0) {
    res.status(400); throw new Error('amount and totalCards are required');
  }

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

/* ── POST /api/rewards/configs/bulk-generate ───────────────────────
   Body: { start, end, step, month? } — "Generate Reward Tiers".
   Instead of adding ₹10, ₹20, ₹30 ... one at a time, the client picks
   a numeric range (e.g. Start 10, End 100, Step 10) and every amount
   in that range is created as its own tier in one shot. Tiers are
   created with totalCards 0 — the client fills in "Number of Scratch
   Cards" per tier afterwards and clicks "Save All". Amounts that
   already exist for this month are skipped, never duplicated. */
const bulkGenerateConfigs = asyncHandler(async (req, res) => {
  const clientId = getClientId(req);
  if (!clientId) { res.status(400); throw new Error('clientId required'); }

  const month = req.body.month || currentMonth();
  const start = Number(req.body.start);
  const end = Number(req.body.end);
  const step = Number(req.body.step);

  if (!Number.isFinite(start) || !Number.isFinite(end) || !Number.isFinite(step) || step <= 0 || end < start) {
    res.status(400);
    throw new Error('Provide a valid Start, End and Step (Step > 0, End ≥ Start).');
  }
  // Safety cap so a typo (e.g. step 0.01) can't try to create thousands of docs.
  const count = Math.floor((end - start) / step) + 1;
  if (count > 200) { res.status(400); throw new Error('That range would generate too many tiers — narrow it down.'); }

  const existing = await RewardConfig.find({ clientId, month }).select('amount');
  const existingAmounts = new Set(existing.map((c) => c.amount));

  const amounts = [];
  for (let amount = start; amount <= end + 1e-9; amount += step) {
    amounts.push(Math.round(amount * 100) / 100); // avoid float drift (10.000000002)
  }

  const toCreate = amounts.filter((amount) => !existingAmounts.has(amount));
  if (toCreate.length > 0) {
    await RewardConfig.insertMany(
      toCreate.map((amount) => ({
        clientId, amount, totalCards: 0, claimed: 0, status: 'active', month,
      })),
    );
  }

  const configs = await RewardConfig.find({ clientId, month }).sort({ amount: 1 });
  res.status(201).json({
    success: true,
    data: configs.map(withAnalytics),
    month,
    created: toCreate.length,
    skipped: amounts.length - toCreate.length,
  });
});

module.exports = {
  getConfigs, getConfigMonths, createConfig, updateConfig, deleteConfig, toggleConfig, resetMonth, bulkGenerateConfigs,
};
