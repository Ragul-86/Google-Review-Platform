const asyncHandler = require('express-async-handler');
const RewardConfig = require('../models/RewardConfig');
const RewardTransaction = require('../models/RewardTransaction');
const {
  currentMonth, ensureMonthConfigs, nextMonthOf, monthToParts,
  isCurrentMonth, isFutureMonth, isPastMonth, monthLabel,
} = require('../utils/rewardMonth');

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

/* Aggregate totals across a list of tier docs for a month — backs the
   monthly-history table's summary row. */
function summarizeTiers(configs) {
  const totals = configs.reduce((acc, c) => {
    acc.totalCards += c.totalCards;
    acc.claimed += c.claimed;
    acc.distributed += c.claimed * c.amount;
    return acc;
  }, { totalCards: 0, claimed: 0, distributed: 0 });
  totals.remaining = Math.max(totals.totalCards - totals.claimed, 0);
  totals.progress  = totals.totalCards > 0 ? Math.round((totals.claimed / totals.totalCards) * 100) : 0;
  return totals;
}

/* Opened / Pending / Expired are never stored or reset directly — they
   are always derived, on read, from the real RewardTransaction history
   for that month. A brand-new month naturally starts at 0/0/0 simply
   because no transaction documents carry that month tag yet; no record
   is ever mutated or deleted to produce that. */
async function transactionCounts(clientId, month) {
  const [opened, pending, expired] = await Promise.all([
    RewardTransaction.countDocuments({ clientId, month, isScratched: true }),
    RewardTransaction.countDocuments({ clientId, month, rewardStatus: { $in: ['pending', 'sent'] } }),
    RewardTransaction.countDocuments({ clientId, month, rewardStatus: 'expired' }),
  ]);
  return { opened, pending, expired };
}

/* Server-side-authoritative edit permission: only the current calendar
   month may ever be mutated. Past months are permanent read-only
   history; future months don't exist to edit yet (they're created
   automatically by the cron rollover / boot catch-up, never early via
   a client request). The frontend additionally disables controls for
   non-current months for UX, but this guard is the real gate. */
function assertEditableMonth(res, month) {
  if (!isCurrentMonth(month)) {
    res.status(403);
    throw new Error(
      isFutureMonth(month)
        ? `${monthLabel(month)} is a future reward cycle and cannot be edited yet.`
        : `${monthLabel(month)} is a past reward cycle and is read-only. Only the current month (${monthLabel(currentMonth())}) can be edited.`,
    );
  }
}

/* ── GET /api/rewards/configs?month=YYYY-MM ───────────────────────
   Lists this client's reward tiers for the given month (defaults to
   the current month). If the current/a past month hasn't been
   materialized yet, last month's tier setup is auto-cloned forward
   with claimed reset to 0 (belt-and-suspenders alongside the cron
   rollover). Future months are never auto-created from this read
   path — they only ever come into existence via the monthly cron
   job, so a client can't force-create one early just by querying it. */
const getConfigs = asyncHandler(async (req, res) => {
  const clientId = getClientId(req);
  if (!clientId) { res.status(400); throw new Error('clientId required'); }

  const month = req.query.month || currentMonth();
  if (!isFutureMonth(month)) {
    await ensureMonthConfigs(RewardConfig, clientId, month);
  }

  const configs = await RewardConfig.find({ clientId, month }).sort({ amount: 1 });
  res.json({
    success: true,
    data: configs.map(withAnalytics),
    month,
    monthLabel: monthLabel(month),
    editable: isCurrentMonth(month),
    isPast: isPastMonth(month),
    isFuture: isFutureMonth(month),
  });
});

/* ── GET /api/rewards/configs/months ───────────────────────────────
   Distinct months that have reward history — powers the Month
   Selector dropdown (Current Month + Previous Months). */
const getConfigMonths = asyncHandler(async (req, res) => {
  const clientId = getClientId(req);
  if (!clientId) { res.status(400); throw new Error('clientId required'); }

  const months = await RewardConfig.distinct('month', { clientId });
  res.json({ success: true, data: months.sort().reverse() });
});

/* ── GET /api/rewards/configs/cycle-status ─────────────────────────
   Powers the Client Dashboard "Automatic Reward Reset" widget:
   Current Reward Month, Next Automatic Reset date, and confirmation
   that automatic monthly rollover is enabled. */
const getCycleStatus = asyncHandler(async (req, res) => {
  const clientId = getClientId(req);
  if (!clientId) { res.status(400); throw new Error('clientId required'); }

  const month = currentMonth();
  const upcoming = nextMonthOf(month);
  const { year, month: mon } = monthToParts(upcoming);
  const nextResetDate = new Date(year, mon - 1, 1, 0, 0, 0, 0);

  const hasConfig = await RewardConfig.exists({ clientId });

  res.json({
    success: true,
    data: {
      currentMonth: month,
      currentMonthLabel: monthLabel(month),
      nextResetMonth: upcoming,
      nextResetDate,
      nextResetLabel: monthLabel(upcoming),
      automaticResetEnabled: true,
      hasConfig: !!hasConfig,
    },
  });
});

/* ── GET /api/rewards/configs/history ──────────────────────────────
   Every month this client has reward history for (current + past),
   each with its own tier-count, totals and transaction-derived
   Opened/Pending/Expired counts — powers the "Previous Month
   History" table. Read-only by nature; never mutates anything. */
const getMonthlyHistory = asyncHandler(async (req, res) => {
  const clientId = getClientId(req);
  if (!clientId) { res.status(400); throw new Error('clientId required'); }

  const months = (await RewardConfig.distinct('month', { clientId })).sort().reverse();

  const history = await Promise.all(months.map(async (month) => {
    const configs = await RewardConfig.find({ clientId, month });
    const totals = summarizeTiers(configs);
    const counts = await transactionCounts(clientId, month);
    return {
      month,
      monthLabel: monthLabel(month),
      isCurrent: isCurrentMonth(month),
      isPast: isPastMonth(month),
      tierCount: configs.length,
      ...totals,
      ...counts,
    };
  }));

  res.json({ success: true, data: history });
});

/* ── POST /api/rewards/configs ─────────────────────────────────────
   Body: { amount, totalCards, month? } — create a new reward tier. */
const createConfig = asyncHandler(async (req, res) => {
  const clientId = getClientId(req);
  if (!clientId) { res.status(400); throw new Error('clientId required'); }

  const { amount, totalCards } = req.body;
  const month = req.body.month || currentMonth();
  assertEditableMonth(res, month);

  if (!amount || totalCards === undefined || totalCards === null || Number(totalCards) < 0) {
    res.status(400); throw new Error('amount and totalCards are required');
  }

  const config = await RewardConfig.create({
    clientId,
    amount: Number(amount),
    totalCards: Number(totalCards),
    claimed: 0,
    status: 'active',
    month,
  });

  res.status(201).json({ success: true, data: withAnalytics(config) });
});

/* ── PUT /api/rewards/configs/:id ─────────────────────────────────── */
const updateConfig = asyncHandler(async (req, res) => {
  const config = await RewardConfig.findById(req.params.id);
  if (!config) { res.status(404); throw new Error('Reward tier not found'); }

  const clientId = getClientId(req);
  if (String(config.clientId) !== String(clientId)) { res.status(403); throw new Error('Not authorized'); }
  assertEditableMonth(res, config.month);

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
  assertEditableMonth(res, config.month);

  await config.deleteOne();
  res.json({ success: true, message: 'Reward tier deleted' });
});

/* ── PATCH /api/rewards/configs/:id/toggle ───────────────────────── */
const toggleConfig = asyncHandler(async (req, res) => {
  const config = await RewardConfig.findById(req.params.id);
  if (!config) { res.status(404); throw new Error('Reward tier not found'); }

  const clientId = getClientId(req);
  if (String(config.clientId) !== String(clientId)) { res.status(403); throw new Error('Not authorized'); }
  assertEditableMonth(res, config.month);

  config.status = config.status === 'active' ? 'inactive' : 'active';
  await config.save();
  res.json({ success: true, data: { _id: config._id, status: config.status } });
});

/* ── POST /api/rewards/configs/reset ──────────────────────────────
   "Reset Monthly Rewards" button — zeroes `claimed` on every tier for
   the target month (defaults to current month, and only the current
   month is ever allowed) on demand, without touching any other
   month's documents/history, and without touching real customer
   transaction history (Opened/Pending/Expired stay exactly what they
   truthfully are — those are never deleted or mutated). */
const resetMonth = asyncHandler(async (req, res) => {
  const clientId = getClientId(req);
  if (!clientId) { res.status(400); throw new Error('clientId required'); }

  const month = req.body.month || currentMonth();
  assertEditableMonth(res, month);

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
  assertEditableMonth(res, month);

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
  getCycleStatus, getMonthlyHistory,
};
