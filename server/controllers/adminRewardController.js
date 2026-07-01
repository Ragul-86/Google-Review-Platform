const asyncHandler = require('express-async-handler');
const RewardTransaction = require('../models/RewardTransaction');
const Client = require('../models/Client');
const { expireOverdueRewards } = require('../utils/rewardExpiry');

/* ── GET /api/rewards/admin/all ─────────────────────────────────────
   Super-Admin only. Paginated list of ALL RewardTransactions across
   every client, with optional filters. Each transaction is populated
   with its client's businessName and email so the table can show both
   "Client Name" (account email) and "Business Name" side by side.

   Clients can only see their own data via the regular /transactions
   endpoint (RBAC enforced there by getClientId → req.user.clientId).
   This endpoint is locked to superadmin at the route level via the
   superAdmin middleware so clients can never reach it. */
const getAdminScratchCards = asyncHandler(async (req, res) => {
  // Sweep expired rewards globally before returning data so dashboard
  // counts are always accurate without waiting for the daily cron.
  await expireOverdueRewards();

  const {
    page  = 1,
    limit = 20,
    clientId   = '',
    status     = '',
    search     = '',
    dateRange  = '',
    businessCategory = '',
  } = req.query;

  const query = {};

  // ── Client filter ──────────────────────────────────────────────────
  if (clientId) query.clientId = clientId;

  // ── Business-category filter (resolve client IDs first) ────────────
  if (businessCategory) {
    const matchClients = await Client.find({
      businessCategory: { $regex: businessCategory.trim(), $options: 'i' },
    }).select('_id');
    const catIds = matchClients.map((c) => c._id);
    // Merge with explicit clientId filter if present
    if (query.clientId) {
      query.clientId = { $in: catIds.filter((id) => String(id) === String(query.clientId)) };
    } else {
      query.clientId = { $in: catIds };
    }
  }

  // ── Status filter — map the UI term "opened" → DB enum "scratched" ─
  const STATUS_MAP = {
    pending:  'pending',
    sent:     'sent',
    opened:   'scratched',   // spec calls it "Opened", DB stores "scratched"
    redeemed: 'redeemed',
    expired:  'expired',
    scratched: 'scratched',  // also accept raw DB value
  };
  if (status && STATUS_MAP[status]) query.rewardStatus = STATUS_MAP[status];

  // ── Date-range filter ─────────────────────────────────────────────
  const now = new Date();
  if (dateRange === 'today') {
    const start = new Date(now); start.setHours(0, 0, 0, 0);
    query.createdAt = { $gte: start };
  } else if (dateRange === 'week') {
    query.createdAt = { $gte: new Date(now.getTime() - 7 * 86400000) };
  } else if (dateRange === 'month') {
    query.createdAt = { $gte: new Date(now.getTime() - 30 * 86400000) };
  }

  // ── Search (customer name, phone, coupon code, business name) ──────
  if (search) {
    const rx = { $regex: search.trim(), $options: 'i' };
    // Searching businessName requires a pre-lookup; handle inline with
    // clientId sub-query when needed so we don't drop the rest of the query.
    const matchingBusinessClients = await Client.find({ businessName: rx }).select('_id');
    const bizIds = matchingBusinessClients.map((c) => c._id);
    const orClauses = [
      { customerName: rx },
      { phone: rx },
      { couponCode: rx },
    ];
    if (bizIds.length) orClauses.push({ clientId: { $in: bizIds } });
    query.$or = orClauses;
  }

  const skip  = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const total = await RewardTransaction.countDocuments(query);

  const rows = await RewardTransaction.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit, 10))
    .populate('clientId', 'businessName email businessCategory');

  // ── Global summary counts (unfiltered — always the full picture) ───
  const [totalAll, pending, sent, scratched, redeemed, expired] = await Promise.all([
    RewardTransaction.countDocuments({}),
    RewardTransaction.countDocuments({ rewardStatus: 'pending' }),
    RewardTransaction.countDocuments({ rewardStatus: 'sent' }),
    RewardTransaction.countDocuments({ rewardStatus: 'scratched' }),
    RewardTransaction.countDocuments({ rewardStatus: 'redeemed' }),
    RewardTransaction.countDocuments({ rewardStatus: 'expired' }),
  ]);

  // Total rupee value distributed (sum of all scratched reward amounts)
  const [valAgg] = await RewardTransaction.aggregate([
    { $match: { isScratched: true, rewardAmount: { $ne: null } } },
    { $group: { _id: null, total: { $sum: '$rewardAmount' } } },
  ]);

  res.json({
    success: true,
    data: rows,
    total,
    page:  parseInt(page, 10),
    pages: Math.ceil(total / parseInt(limit, 10)),
    counts: {
      total: totalAll, pending, sent, scratched, redeemed, expired,
      distributedValue: valAgg?.total ?? 0,
    },
  });
});

/* ── GET /api/rewards/admin/analytics ──────────────────────────────
   Super-Admin only. Returns four datasets used to power the charts
   on the Scratch Card Management page:
     1. monthly  — last 6 months (total created, redeemed, value)
     2. clientWise — top 10 clients by card count
     3. distribution — card count per status (for pie chart)
     4. topAmounts — card count per reward-amount tier (bar chart)   */
const getAdminScratchCardAnalytics = asyncHandler(async (req, res) => {
  await expireOverdueRewards();

  // ── 1. Monthly trend (last 6 months) ──────────────────────────────
  const sixAgo = new Date();
  sixAgo.setMonth(sixAgo.getMonth() - 5);
  sixAgo.setDate(1);
  sixAgo.setHours(0, 0, 0, 0);

  const monthlyRaw = await RewardTransaction.aggregate([
    { $match: { createdAt: { $gte: sixAgo } } },
    {
      $group: {
        _id:      { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        total:    { $sum: 1 },
        redeemed: { $sum: { $cond: [{ $eq: ['$rewardStatus', 'redeemed'] }, 1, 0] } },
        value:    { $sum: { $ifNull: ['$rewardAmount', 0] } },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const MO = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthly = monthlyRaw.map((m) => ({
    month:    `${MO[m._id.month - 1]} ${m._id.year}`,
    total:    m.total,
    redeemed: m.redeemed,
    value:    m.value,
  }));

  // ── 2. Client-wise breakdown (top 10) ─────────────────────────────
  const clientRaw = await RewardTransaction.aggregate([
    {
      $group: {
        _id:      '$clientId',
        total:    { $sum: 1 },
        redeemed: { $sum: { $cond: [{ $eq: ['$rewardStatus', 'redeemed'] }, 1, 0] } },
        value:    { $sum: { $ifNull: ['$rewardAmount', 0] } },
      },
    },
    { $sort: { total: -1 } },
    { $limit: 10 },
  ]);

  const clientIds = clientRaw.map((c) => c._id).filter(Boolean);
  const clients   = await Client.find({ _id: { $in: clientIds } }).select('businessName');
  const cMap = {};
  clients.forEach((c) => { cMap[c._id.toString()] = c.businessName; });

  const clientWise = clientRaw.map((c) => ({
    name:     cMap[c._id?.toString()] || 'Unknown',
    total:    c.total,
    redeemed: c.redeemed,
    value:    c.value,
  }));

  // ── 3. Reward status distribution (pie) ───────────────────────────
  const distRaw = await RewardTransaction.aggregate([
    { $group: { _id: '$rewardStatus', count: { $sum: 1 } } },
  ]);

  const STATUS_LABELS = {
    pending: 'Pending', sent: 'Sent', scratched: 'Opened',
    redeemed: 'Redeemed', expired: 'Expired',
  };
  const STATUS_COLORS = {
    pending: '#94a3b8', sent: '#60a5fa', scratched: '#f59e0b',
    redeemed: '#10b981', expired: '#f87171',
  };
  const distribution = distRaw.map((d) => ({
    name:  STATUS_LABELS[d._id] || d._id,
    value: d.count,
    color: STATUS_COLORS[d._id] || '#94a3b8',
  }));

  // ── 4. Top reward amounts (bar) ────────────────────────────────────
  const amtRaw = await RewardTransaction.aggregate([
    { $match: { rewardAmount: { $ne: null } } },
    { $group: { _id: '$rewardAmount', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
    { $limit: 8 },
  ]);

  res.json({
    success: true,
    monthly,
    clientWise,
    distribution,
    topAmounts: amtRaw.map((t) => ({ amount: `₹${t._id}`, count: t.count })),
  });
});

module.exports = { getAdminScratchCards, getAdminScratchCardAnalytics };
