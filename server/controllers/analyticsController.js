const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Review   = require('../models/Review');
const Feedback = require('../models/Feedback');
const QRCode   = require('../models/QRCode');
const Client   = require('../models/Client');
const Customer = require('../models/Customer');

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Client-level analytics
// @route GET /api/analytics
// @access Private
// ─────────────────────────────────────────────────────────────────────────────
const getAnalytics = asyncHandler(async (req, res) => {
  const clientId = req.user.role === 'clientadmin'
    ? req.user.clientId
    : req.query.clientId || null;

  const reviewQuery = clientId ? { clientId } : {};
  const reviews = await Review.find(reviewQuery).select('rating type createdAt qrCodeId');

  const total    = reviews.length;
  const positive = reviews.filter((r) => r.type === 'positive').length;
  const negative = total - positive;
  const avgRating = total ? parseFloat((reviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(2)) : 0;
  const csat = total ? Math.round((positive / total) * 100) : 0;

  const distribution = [1, 2, 3, 4, 5].map((star) => ({
    star, count: reviews.filter((r) => r.rating === star).length,
  }));

  const monthly = {};
  for (const r of reviews) {
    const d   = new Date(r.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthly[key] = (monthly[key] || 0) + 1;
  }
  const monthlyArr = Object.entries(monthly)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([month, count]) => ({ month, count }));

  const pie = [{ name: 'Positive', value: positive }, { name: 'Negative', value: negative }];

  const feedbackQuery = clientId ? { clientId } : {};
  const feedbackStats = await Feedback.aggregate([
    { $match: feedbackQuery.clientId ? { clientId: new mongoose.Types.ObjectId(feedbackQuery.clientId) } : {} },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const feedbackByStatus = feedbackStats.reduce((acc, cur) => { acc[cur._id] = cur.count; return acc; }, {});

  const qrQuery = clientId ? { clientId } : {};
  const qrs = await QRCode.find(qrQuery).select('title source scanCount');
  const totalScans = qrs.reduce((s, q) => s + q.scanCount, 0);

  let clientGrowth = null;
  if (req.user.role === 'superadmin' && !clientId) {
    const clients = await Client.find().select('createdAt');
    const cgMonthly = {};
    for (const c of clients) {
      const d   = new Date(c.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      cgMonthly[key] = (cgMonthly[key] || 0) + 1;
    }
    clientGrowth = Object.entries(cgMonthly)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, count]) => ({ month, count }));
  }

  res.json({
    success: true,
    data: { total, positive, negative, avgRating, csat, distribution, monthly: monthlyArr, pie, feedbackByStatus, totalScans, qrCodes: qrs, clientGrowth },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Super Admin overview — V1 dashboard
// @route GET /api/analytics/overview
// @access Super Admin only
// ─────────────────────────────────────────────────────────────────────────────
const getAdminOverview = asyncHandler(async (req, res) => {
  // Today boundary (midnight → now)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // ── KPI totals ────────────────────────────────────────────────────────────
  const [
    totalClients, activeClients,
    totalReviews, totalFeedback,
    totalCustomers, totalWaSent,
    totalQRCodes,
  ] = await Promise.all([
    Client.countDocuments(),
    Client.countDocuments({ status: 'active' }),
    Review.countDocuments({ type: 'positive' }),
    Feedback.countDocuments(),
    Customer.countDocuments(),
    Customer.countDocuments({ whatsappStatus: { $in: ['sent', 'clicked', 'reviewed'] } }),
    QRCode.countDocuments(),
  ]);

  // ── Today's snapshot ──────────────────────────────────────────────────────
  const [
    todayClients, todayReviews, todayFeedback, todayWaSent,
  ] = await Promise.all([
    Client.countDocuments({ createdAt: { $gte: todayStart } }),
    Review.countDocuments({ type: 'positive', createdAt: { $gte: todayStart } }),
    Feedback.countDocuments({ createdAt: { $gte: todayStart } }),
    Customer.countDocuments({
      whatsappStatus: { $in: ['sent', 'clicked', 'reviewed'] },
      whatsappSentAt: { $gte: todayStart },
    }),
  ]);

  // ── Review conversion funnel (platform-wide) ─────────────────────────────
  const [funnelOpened, funnelSubmitted] = await Promise.all([
    Customer.countDocuments({ reviewStatus: { $in: ['opened', 'google_submitted', 'feedback_submitted'] } }),
    Customer.countDocuments({ reviewStatus: { $in: ['google_submitted', 'feedback_submitted'] } }),
  ]);
  const funnel = {
    customersAdded: totalCustomers,
    waSent:        totalWaSent,
    opened:        funnelOpened,
    submitted:     funnelSubmitted,
  };

  // ── Latest reviews (10) ───────────────────────────────────────────────────
  const latestReviews = await Review.find({ type: 'positive' })
    .populate('clientId', 'businessName')
    .sort({ createdAt: -1 })
    .limit(10)
    .select('clientId customerName categoryLabel rating createdAt selectedSuggestion')
    .lean();

  // ── Latest private feedback (10) ─────────────────────────────────────────
  const latestFeedback = await Feedback.find()
    .populate('clientId', 'businessName')
    .sort({ createdAt: -1 })
    .limit(10)
    .select('clientId customerName categoryLabel rating feedback status createdAt')
    .lean();

  // ── Activity feed — reviews + feedback + new clients (30 total, top 15) ──
  const recentClients = await Client.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .select('businessName createdAt')
    .lean();

  const activityItems = [
    ...latestReviews.slice(0, 8).map((r) => ({
      type:         'google_review',
      label:        'Review Received',
      businessName: r.clientId?.businessName || 'Unknown',
      detail:       r.categoryLabel || `${r.rating} star`,
      createdAt:    r.createdAt,
      _id:          r._id,
    })),
    ...latestFeedback.slice(0, 8).map((f) => ({
      type:         'private_feedback',
      label:        'Private Feedback',
      businessName: f.clientId?.businessName || 'Unknown',
      detail:       f.categoryLabel || `${f.rating} star`,
      createdAt:    f.createdAt,
      _id:          f._id,
    })),
    ...recentClients.map((c) => ({
      type:         'client_created',
      label:        'Client Created',
      businessName: c.businessName || 'Unknown',
      detail:       'New business account',
      createdAt:    c.createdAt,
      _id:          c._id,
    })),
  ]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 15);

  // ── Platform score ────────────────────────────────────────────────────────
  const totalResponses = totalReviews + totalFeedback || 1;
  const platformScore  = Math.round((totalReviews / totalResponses) * 100);

  // ── Client health table ───────────────────────────────────────────────────
  const allClients = await Client.find().select('businessName onboardingStatus status slug createdAt').lean();

  const clientHealth = await Promise.all(allClients.map(async (c) => {
    const cid = c._id;
    const [reviews, feedback, waSent, customers, lastReview, lastFeedback] = await Promise.all([
      Review.countDocuments({ clientId: cid, type: 'positive' }),
      Feedback.countDocuments({ clientId: cid }),
      Customer.countDocuments({ clientId: cid, whatsappStatus: { $in: ['sent', 'clicked', 'reviewed'] } }),
      Customer.countDocuments({ clientId: cid }),
      Review.findOne({ clientId: cid }).sort({ createdAt: -1 }).select('createdAt').lean(),
      Feedback.findOne({ clientId: cid }).sort({ createdAt: -1 }).select('createdAt').lean(),
    ]);
    const totalResp     = reviews + feedback;
    const conversionRate = waSent > 0 ? Math.round((totalResp / waSent) * 100) : 0;
    const lastActivity  = [lastReview?.createdAt, lastFeedback?.createdAt]
      .filter(Boolean).sort((a, b) => new Date(b) - new Date(a))[0] || null;
    return {
      _id: cid, businessName: c.businessName, onboardingStatus: c.onboardingStatus || 'draft',
      status: c.status, totalReviews: reviews, totalFeedback: feedback,
      conversionRate, customers, lastActivity,
    };
  }));

  res.json({
    success: true,
    data: {
      // KPI
      totalClients, activeClients, totalReviews, totalFeedback,
      totalCustomers, totalWaSent, totalQRCodes,
      platformScore,
      // Today
      today: { clients: todayClients, reviews: todayReviews, feedback: todayFeedback, waSent: todayWaSent },
      // Funnel
      funnel,
      // Tables
      latestReviews,
      latestFeedback,
      // Feed
      recentActivity: activityItems,
      // Client health
      clientHealth,
      // Backward compat
      recentReviews: latestReviews.slice(0, 5),
      topClients: [],
    },
  });
});

module.exports = { getAnalytics, getAdminOverview };
