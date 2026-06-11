const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Review = require('../models/Review');
const Feedback = require('../models/Feedback');
const QRCode = require('../models/QRCode');
const Client = require('../models/Client');

// @desc    Get analytics for admin or client
// @route   GET /api/analytics
// @access  Private
const getAnalytics = asyncHandler(async (req, res) => {
  const clientId = req.user.role === 'clientadmin'
    ? req.user.clientId
    : req.query.clientId || null;

  const reviewQuery = clientId ? { clientId } : {};
  const reviews = await Review.find(reviewQuery).select('rating type createdAt qrCodeId');

  const total = reviews.length;
  const positive = reviews.filter((r) => r.type === 'positive').length;
  const negative = total - positive;
  const avgRating = total ? parseFloat((reviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(2)) : 0;
  const csat = total ? Math.round((positive / total) * 100) : 0;

  // Rating distribution
  const distribution = [1, 2, 3, 4, 5].map((star) => ({
    star, count: reviews.filter((r) => r.rating === star).length,
  }));

  // Monthly trend (last 12 months)
  const monthly = {};
  for (const r of reviews) {
    const d = new Date(r.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthly[key] = (monthly[key] || 0) + 1;
  }
  const monthlyArr = Object.entries(monthly)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([month, count]) => ({ month, count }));

  // Pie data
  const pie = [
    { name: 'Positive', value: positive },
    { name: 'Negative', value: negative },
  ];

  // Feedback stats
  const feedbackQuery = clientId ? { clientId } : {};
  const feedbackStats = await Feedback.aggregate([
    { $match: feedbackQuery.clientId ? { clientId: new mongoose.Types.ObjectId(feedbackQuery.clientId) } : {} },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const feedbackByStatus = feedbackStats.reduce((acc, cur) => {
    acc[cur._id] = cur.count;
    return acc;
  }, {});

  // QR scan stats
  const qrQuery = clientId ? { clientId } : {};
  const qrs = await QRCode.find(qrQuery).select('title source scanCount');
  const totalScans = qrs.reduce((s, q) => s + q.scanCount, 0);

  // Admin-specific: client growth
  let clientGrowth = null;
  if (req.user.role === 'superadmin' && !clientId) {
    const clients = await Client.find().select('createdAt');
    const cgMonthly = {};
    for (const c of clients) {
      const d = new Date(c.createdAt);
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
    data: {
      total, positive, negative, avgRating, csat,
      distribution, monthly: monthlyArr, pie,
      feedbackByStatus, totalScans, qrCodes: qrs,
      clientGrowth,
    },
  });
});

// @desc    Admin overview metrics
// @route   GET /api/analytics/overview
// @access  Super Admin
const getAdminOverview = asyncHandler(async (req, res) => {
  const [totalClients, activeClients, totalReviews, totalQRCodes] = await Promise.all([
    Client.countDocuments(),
    Client.countDocuments({ status: 'active' }),
    Review.countDocuments(),
    QRCode.countDocuments(),
  ]);

  // Top clients by review count
  const topClients = await Review.aggregate([
    { $group: { _id: '$clientId', count: { $sum: 1 }, avgRating: { $avg: '$rating' } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'clients',
        localField: '_id',
        foreignField: '_id',
        as: 'client',
      },
    },
    { $unwind: '$client' },
    { $project: { businessName: '$client.businessName', count: 1, avgRating: { $round: ['$avgRating', 1] } } },
  ]);

  // Recent activity
  const recentReviews = await Review.find()
    .populate('clientId', 'businessName')
    .sort({ createdAt: -1 })
    .limit(8)
    .select('type rating createdAt clientId customerName');

  res.json({
    success: true,
    data: {
      totalClients, activeClients, totalReviews, totalQRCodes,
      topClients, recentReviews,
    },
  });
});

module.exports = { getAnalytics, getAdminOverview };
