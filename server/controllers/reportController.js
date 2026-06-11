const asyncHandler = require('express-async-handler');
const XLSX = require('xlsx');
const Review = require('../models/Review');
const Feedback = require('../models/Feedback');
const Client = require('../models/Client');

// @desc    Export reviews as XLSX
// @route   GET /api/reports/reviews
// @access  Private
const exportReviews = asyncHandler(async (req, res) => {
  const { type = 'all', clientId: qClientId } = req.query;
  const query = {};

  if (req.user.role === 'clientadmin') {
    query.clientId = req.user.clientId;
  } else if (qClientId) {
    query.clientId = qClientId;
  }
  if (type !== 'all') query.type = type;

  const reviews = await Review.find(query)
    .populate('clientId', 'businessName')
    .sort({ createdAt: -1 });

  const sheetData = reviews.map((r) => ({
    'Business': r.clientId?.businessName || '',
    'Type': r.type,
    'Rating': r.rating,
    'Customer': r.customerName || '',
    'Category': r.categoryLabel || '',
    'Review/Feedback': r.selectedSuggestion || r.message || '',
    'Email': r.customerEmail || '',
    'Phone': r.customerPhone || '',
    'Date': new Date(r.createdAt).toLocaleString(),
  }));

  const ws = XLSX.utils.json_to_sheet(sheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Reviews');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  const filename = `reviews-${type}-${Date.now()}.xlsx`;

  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buf);
});

// @desc    Export feedback as XLSX
// @route   GET /api/reports/feedback
// @access  Private
const exportFeedback = asyncHandler(async (req, res) => {
  const { status = 'all', clientId: qClientId } = req.query;
  const query = {};

  if (req.user.role === 'clientadmin') {
    query.clientId = req.user.clientId;
  } else if (qClientId) {
    query.clientId = qClientId;
  }
  if (status !== 'all') query.status = status;

  const feedbacks = await Feedback.find(query)
    .populate('clientId', 'businessName')
    .sort({ createdAt: -1 });

  const sheetData = feedbacks.map((f) => ({
    'Business': f.clientId?.businessName || '',
    'Customer': f.customerName,
    'Email': f.email || '',
    'Phone': f.phone || '',
    'Rating': f.rating,
    'Feedback': f.feedback,
    'Status': f.status,
    'Date': new Date(f.createdAt).toLocaleString(),
  }));

  const ws = XLSX.utils.json_to_sheet(sheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Feedback');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  const filename = `feedback-${Date.now()}.xlsx`;

  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buf);
});

// @desc    Export full report (reviews + feedback) as XLSX
// @route   GET /api/reports/full
// @access  Private
const exportFull = asyncHandler(async (req, res) => {
  const { clientId: qClientId } = req.query;
  const cid = req.user.role === 'clientadmin' ? req.user.clientId : qClientId;
  const query = cid ? { clientId: cid } : {};

  const [reviews, feedbacks] = await Promise.all([
    Review.find(query).populate('clientId', 'businessName').sort({ createdAt: -1 }),
    Feedback.find(query).populate('clientId', 'businessName').sort({ createdAt: -1 }),
  ]);

  const wb = XLSX.utils.book_new();

  const reviewSheet = XLSX.utils.json_to_sheet(reviews.map((r) => ({
    'Business': r.clientId?.businessName || '',
    'Type': r.type,
    'Rating': r.rating,
    'Customer': r.customerName || '',
    'Category': r.categoryLabel || '',
    'Review': r.selectedSuggestion || '',
    'Date': new Date(r.createdAt).toLocaleString(),
  })));
  XLSX.utils.book_append_sheet(wb, reviewSheet, 'Positive Reviews');

  const feedbackSheet = XLSX.utils.json_to_sheet(feedbacks.map((f) => ({
    'Business': f.clientId?.businessName || '',
    'Customer': f.customerName,
    'Email': f.email || '',
    'Phone': f.phone || '',
    'Rating': f.rating,
    'Feedback': f.feedback,
    'Status': f.status,
    'Date': new Date(f.createdAt).toLocaleString(),
  })));
  XLSX.utils.book_append_sheet(wb, feedbackSheet, 'Private Feedback');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  const filename = `full-report-${Date.now()}.xlsx`;

  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buf);
});

module.exports = { exportReviews, exportFeedback, exportFull };
