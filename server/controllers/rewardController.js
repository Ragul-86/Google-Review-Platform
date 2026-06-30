const asyncHandler = require('express-async-handler');
const Client = require('../models/Client');
const RewardConfig = require('../models/RewardConfig');
const RewardTransaction = require('../models/RewardTransaction');
const { expireOverdueRewards, applyLazyExpiry } = require('../utils/rewardExpiry');
const { currentMonth, isFutureMonth, monthLabel } = require('../utils/rewardMonth');
const { generateUniqueToken } = require('../utils/secureToken');

function getClientId(req) {
  return req.user.role === 'superadmin'
    ? req.query.clientId || req.body.clientId
    : req.user.clientId;
}

/* ── GET /api/rewards/transactions ──────────────────────────────────
   Filters: status (pending/sent/redeemed/expired, plus the synthetic
   "expiring_7" / "expiring_today" views), search (customer name /
   phone / coupon code / reward amount), dateRange (today/week/month).
   Pagination via page/limit. `counts` is computed from real DB counts
   (not just the current page) for the summary stat cards.

   Every call first sweeps this client's overdue Pending/Sent rewards
   to Expired — on top of the daily automatic sweep in server.js —
   so the dashboard is always correct even if the daily timer hasn't
   fired yet (e.g. right after a deploy). */
const getRewards = asyncHandler(async (req, res) => {
  const clientId = getClientId(req);
  if (!clientId) { res.status(400); throw new Error('clientId required'); }

  await expireOverdueRewards({ clientId });

  const { page = 1, limit = 20, status = '', search = '', dateRange = '' } = req.query;
  const query = { clientId };

  const now = new Date();
  if (status === 'expiring_7') {
    const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    query.rewardStatus = 'scratched'; // only scratched rewards carry a real validUntil countdown
    query.validUntil = { $gte: now, $lte: in7 };
  } else if (status === 'expiring_today') {
    const start = new Date(now); start.setHours(0, 0, 0, 0);
    const end = new Date(now); end.setHours(23, 59, 59, 999);
    query.rewardStatus = 'scratched';
    query.validUntil = { $gte: start, $lte: end };
  } else if (status) {
    query.rewardStatus = status;
  }

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
  const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
  const [totalAll, pending, sent, scratched, redeemed, expired, expiringSoon, expiringToday] = await Promise.all([
    RewardTransaction.countDocuments(baseQuery),
    RewardTransaction.countDocuments({ ...baseQuery, rewardStatus: 'pending' }),
    RewardTransaction.countDocuments({ ...baseQuery, rewardStatus: 'sent' }),
    RewardTransaction.countDocuments({ ...baseQuery, rewardStatus: 'scratched' }),
    RewardTransaction.countDocuments({ ...baseQuery, rewardStatus: 'redeemed' }),
    RewardTransaction.countDocuments({ ...baseQuery, rewardStatus: 'expired' }),
    RewardTransaction.countDocuments({
      ...baseQuery, rewardStatus: 'scratched', validUntil: { $gte: now, $lte: in7 },
    }),
    RewardTransaction.countDocuments({
      ...baseQuery, rewardStatus: 'scratched', validUntil: { $gte: todayStart, $lte: todayEnd },
    }),
  ]);

  res.json({
    success: true,
    data: rewards,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
    counts: {
      total: totalAll, pending, sent, scratched, redeemed, expired, expiringSoon, expiringToday,
    },
  });
});

/* ── GET /api/rewards/transactions/:id ─────────────────────────────── */
const getRewardById = asyncHandler(async (req, res) => {
  const reward = await RewardTransaction.findById(req.params.id);
  if (!reward) { res.status(404); throw new Error('Reward not found'); }

  const clientId = getClientId(req);
  if (String(reward.clientId) !== String(clientId)) { res.status(403); throw new Error('Not authorized'); }

  await applyLazyExpiry(reward);
  res.json({ success: true, data: reward });
});

/* ── GET /api/rewards/campaigns ───────────────────────────────────
   Powers the "Select Reward Campaign" dropdown in Create Scratch
   Card. A "campaign" is simply a month that has an active reward-tier
   pool configured (Scratch Card Rewards) — in practice almost always
   just the current month, since future months are never created
   early and past months are read-only history. Never hardcoded:
   pulled live from RewardConfig. */
const getCampaigns = asyncHandler(async (req, res) => {
  const clientId = getClientId(req);
  if (!clientId) { res.status(400); throw new Error('clientId required'); }

  const months = (await RewardConfig.distinct('month', { clientId, status: 'active' }))
    .filter((m) => !isFutureMonth(m))
    .sort()
    .reverse();

  res.json({
    success: true,
    data: months.map((month) => ({
      month,
      label: monthLabel(month),
      isCurrent: month === currentMonth(),
    })),
  });
});

/* ── POST /api/rewards/transactions ────────────────────────────────
   "Create Scratch Card" — the ONLY place a RewardTransaction now
   comes into existence. Fired when the business owner, having
   manually verified the customer's Google Review in person, fills in
   Customer Name + Mobile Number (+ optional Email) and picks a
   Reward Campaign inside Reward Management. Generates a unique
   one-time secure token immediately. The reward amount + coupon code
   stay null until the customer actually scratches the card — that
   draw always resolves against whichever month it's opened in (see
   publicScratchController.scratchReward), so the campaign picked
   here is just the cycle this transaction is logged under, not a
   guarantee of which tier it draws from later.

   IMPORTANT: this endpoint never contacts WhatsApp itself — sending
   is a separate, always-manual action (see markSent below). */
const createTransaction = asyncHandler(async (req, res) => {
  const clientId = getClientId(req);
  if (!clientId) { res.status(400); throw new Error('clientId required'); }

  const { customerName, phone, email } = req.body;
  if (!customerName?.trim() || !phone?.trim()) {
    res.status(400);
    throw new Error('Customer name and mobile number are required');
  }

  const month = req.body.month || currentMonth();
  if (isFutureMonth(month)) {
    res.status(400);
    throw new Error('That reward campaign does not exist yet.');
  }

  const hasCampaign = await RewardConfig.exists({ clientId, month, status: 'active' });
  if (!hasCampaign) {
    res.status(400);
    throw new Error('No active reward campaign is configured for that month yet — set up Scratch Card Rewards first.');
  }

  const token = await generateUniqueToken(RewardTransaction);
  const transaction = await RewardTransaction.create({
    clientId,
    customerName: customerName.trim(),
    phone: phone.trim(),
    email: email?.trim() || '',
    token,
    rewardStatus: 'pending',
    whatsappStatus: 'not_sent',
    month,
  });

  const client = await Client.findById(clientId).select('businessName');

  res.status(201).json({
    success: true,
    data: {
      ...transaction.toObject({ virtuals: true }),
      businessName: client?.businessName || '',
    },
  });
});

/* ── PATCH /api/rewards/transactions/:id/whatsapp-opened ───────────
   Fired right when the client clicks "Send WhatsApp" — purely
   telemetry recorded BEFORE window.open() runs. GETMORE itself sends
   nothing here; this just records that the client opened the WhatsApp
   Web compose screen for this reward. Blocked once a reward has
   expired — expired rewards can never be sent again. */
const markWhatsappOpened = asyncHandler(async (req, res) => {
  const reward = await RewardTransaction.findById(req.params.id);
  if (!reward) { res.status(404); throw new Error('Reward not found'); }

  const clientId = getClientId(req);
  if (String(reward.clientId) !== String(clientId)) { res.status(403); throw new Error('Not authorized'); }

  if (await applyLazyExpiry(reward)) {
    res.status(400); throw new Error('This reward has expired and can no longer be sent.');
  }

  if (reward.whatsappStatus === 'not_sent') reward.whatsappStatus = 'opened';
  await reward.save();
  res.json({ success: true, data: reward });
});

/* ── PATCH /api/rewards/transactions/:id/mark-sent ─────────────────
   "Mark as Sent" — the client confirms they pressed Send themselves
   inside WhatsApp. Bumps whatsappStatus to "sent" and, if the reward
   was still "pending", advances rewardStatus to "sent" too. Blocked
   on expired rewards. */
const markSent = asyncHandler(async (req, res) => {
  const reward = await RewardTransaction.findById(req.params.id);
  if (!reward) { res.status(404); throw new Error('Reward not found'); }

  const clientId = getClientId(req);
  if (String(reward.clientId) !== String(clientId)) { res.status(403); throw new Error('Not authorized'); }

  if (await applyLazyExpiry(reward)) {
    res.status(400); throw new Error('This reward has expired and can no longer be sent.');
  }

  reward.whatsappStatus = 'sent';
  if (reward.rewardStatus === 'pending') reward.rewardStatus = 'sent';
  await reward.save();
  res.json({ success: true, data: reward });
});

/* ── PATCH /api/rewards/transactions/:id/status ────────────────────
   Generic reward-status updater — used from "View Details" to mark a
   reward Redeemed (customer showed up and used the coupon). Once a
   reward is Expired (or expires right now via the lazy check below)
   it is terminal — it cannot be redeemed or sent again, only viewed. */
const updateRewardStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowed = ['pending', 'sent', 'scratched', 'redeemed', 'expired'];
  if (!allowed.includes(status)) { res.status(400); throw new Error('Invalid status'); }

  const reward = await RewardTransaction.findById(req.params.id);
  if (!reward) { res.status(404); throw new Error('Reward not found'); }

  const clientId = getClientId(req);
  if (String(reward.clientId) !== String(clientId)) { res.status(403); throw new Error('Not authorized'); }

  const isExpired = await applyLazyExpiry(reward);
  if (isExpired && status !== 'expired') {
    res.status(400); throw new Error('Expired rewards cannot be redeemed or sent again.');
  }
  if (status === 'redeemed' && reward.rewardStatus !== 'scratched') {
    res.status(400); throw new Error('Only a revealed (scratched) reward can be marked as redeemed.');
  }

  reward.rewardStatus = status;
  if (status === 'redeemed') reward.redeemedAt = new Date();
  await reward.save();
  res.json({ success: true, data: reward });
});

module.exports = {
  getRewards, getRewardById, getCampaigns, createTransaction, markWhatsappOpened, markSent, updateRewardStatus,
};
