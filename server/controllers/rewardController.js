const asyncHandler = require('express-async-handler');
const RewardTransaction = require('../models/RewardTransaction');

function getClientId(req) {
  return req.user.role === 'superadmin'
    ? req.query.clientId || req.body.clientId
    : req.user.clientId;
}

/* ── GET /api/rewards/transactions ──────────────────────────────────
   Filters: status (pending/sent/redeemed/expired), search (customer
   name / phone / coupon code / reward amount), dateRange
   (today/week/month). Pagination via page/limit. `counts` is computed
   from real DB counts (not just the current page) for the summary
   stat cards on the Reward Management page. */
const getRewards = asyncHandler(async (req, res) => {
  const clientId = getClientId(req);
  if (!clientId) { res.status(400); throw new Error('clientId required'); }

  const { page = 1, limit = 20, status = '', search = '', dateRange = '' } = req.query;
  const query = { clientId };

  if (status) query.rewardStatus = status;
  if (search) {
    const trimmed = search.trim();
    const asNumber = Number(trimmed);
    query.$or = [
      { customerName: { $regex: trimmed, $options: 'i' } },
      { phone:         { $regex: trimmed, $options: 'i' } },
      { couponCode:    { $regex: trimmed, $options: 'i' } },
      ...(trimmed !== '' && Number.isFinite(asNumber) ? [{ rewardAmount: asNumber }] : []),
    ];
  }
  if (dateRange) {
    const now = new Date();
    if (dateRange === 'today') {
      const start = new Date(now); start.setHours(0, 0, 0, 0);
      query.createdAt = { $gte: start };
    } else if (dateRange === 'week') {
      const start = new Date(now); start.setDate(now.getDate() - 7);
      query.createdAt = { $gte: start };
    } else if (dateRange === 'month') {
      const start = new Date(now); start.setDate(now.getDate() - 30);
      query.createdAt = { $gte: start };
    }
  }

  const total = await RewardTransaction.countDocuments(query);
  const rewards = await RewardTransaction.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const baseQuery = { clientId };
  const [totalAll, pending, sent, redeemed, expired] = await Promise.all([
    RewardTransaction.countDocuments(baseQuery),
    RewardTransaction.countDocuments({ ...baseQuery, rewardStatus: 'pending' }),
    RewardTransaction.countDocuments({ ...baseQuery, rewardStatus: 'sent' }),
    RewardTransaction.countDocuments({ ...baseQuery, rewardStatus: 'redeemed' }),
    RewardTransaction.countDocuments({ ...baseQuery, rewardStatus: 'expired' }),
  ]);

  res.json({
    success: true,
    data: rewards,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
    counts: { total: totalAll, pending, sent, redeemed, expired },
  });
});

/* ── GET /api/rewards/transactions/:id ─────────────────────────────── */
const getRewardById = asyncHandler(async (req, res) => {
  const reward = await RewardTransaction.findById(req.params.id);
  if (!reward) { res.status(404); throw new Error('Reward not found'); }

  const clientId = getClientId(req);
  if (String(reward.clientId) !== String(clientId)) { res.status(403); throw new Error('Not authorized'); }

  res.json({ success: true, data: reward });
});

/* ── PATCH /api/rewards/transactions/:id/whatsapp-opened ───────────
   Fired right when the client clicks "Send WhatsApp" — purely
   telemetry recorded BEFORE window.open() runs. GETMORE itself sends
   nothing here; this just records that the client opened the WhatsApp
   Web compose screen for this reward. */
const markWhatsappOpened = asyncHandler(async (req, res) => {
  const reward = await RewardTransaction.findById(req.params.id);
  if (!reward) { res.status(404); throw new Error('Reward not found'); }

  const clientId = getClientId(req);
  if (String(reward.clientId) !== String(clientId)) { res.status(403); throw new Error('Not authorized'); }

  if (reward.whatsappStatus === 'not_sent') reward.whatsappStatus = 'opened';
  await reward.save();
  res.json({ success: true, data: reward });
});

/* ── PATCH /api/rewards/transactions/:id/mark-sent ─────────────────
   "Mark as Sent" — the client confirms they pressed Send themselves
   inside WhatsApp. Bumps whatsappStatus to "sent" and, if the reward
   was still "pending", advances rewardStatus to "sent" too. */
const markSent = asyncHandler(async (req, res) => {
  const reward = await RewardTransaction.findById(req.params.id);
  if (!reward) { res.status(404); throw new Error('Reward not found'); }

  const clientId = getClientId(req);
  if (String(reward.clientId) !== String(clientId)) { res.status(403); throw new Error('Not authorized'); }

  reward.whatsappStatus = 'sent';
  if (reward.rewardStatus === 'pending') reward.rewardStatus = 'sent';
  await reward.save();
  res.json({ success: true, data: reward });
});

/* ── PATCH /api/rewards/transactions/:id/status ────────────────────
   Generic reward-status updater — used from "View Details" to mark a
   reward Redeemed (customer showed up and used the coupon) or Expired. */
const updateRewardStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowed = ['pending', 'sent', 'redeemed', 'expired'];
  if (!allowed.includes(status)) { res.status(400); throw new Error('Invalid status'); }

  const reward = await RewardTransaction.findById(req.params.id);
  if (!reward) { res.status(404); throw new Error('Reward not found'); }

  const clientId = getClientId(req);
  if (String(reward.clientId) !== String(clientId)) { res.status(403); throw new Error('Not authorized'); }

  reward.rewardStatus = status;
  await reward.save();
  res.json({ success: true, data: reward });
});

module.exports = { getRewards, getRewardById, markWhatsappOpened, markSent, updateRewardStatus };
