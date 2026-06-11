const asyncHandler = require('express-async-handler');
const Feedback = require('../models/Feedback');

// @desc    Get all feedback
// @route   GET /api/feedback
// @access  Private
const getFeedback = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status = '', search = '', rating = '', dateRange = '' } = req.query;
  const query = {};

  if (req.user.role === 'clientadmin') {
    query.clientId = req.user.clientId;
  } else if (req.query.clientId) {
    query.clientId = req.query.clientId;
  }

  if (status) query.status = status;
  if (rating)  query.rating = parseInt(rating);
  if (search) query.$or = [
    { customerName: { $regex: search, $options: 'i' } },
    { feedback: { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } },
  ];
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

  const total = await Feedback.countDocuments(query);
  const feedbacks = await Feedback.find(query)
    .populate('clientId', 'businessName')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.json({ success: true, data: feedbacks, total, page: parseInt(page), pages: Math.ceil(total / limit) });
});

// @desc    Get single feedback
// @route   GET /api/feedback/:id
// @access  Private
const getFeedbackById = asyncHandler(async (req, res) => {
  const fb = await Feedback.findById(req.params.id).populate('clientId', 'businessName');
  if (!fb) { res.status(404); throw new Error('Feedback not found'); }

  if (req.user.role === 'clientadmin' && String(fb.clientId._id) !== String(req.user.clientId)) {
    res.status(403); throw new Error('Not authorized');
  }
  res.json({ success: true, data: fb });
});

// @desc    Update feedback status
// @route   PATCH /api/feedback/:id/status
// @access  Private
const updateFeedbackStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowed = ['new', 'in_progress', 'resolved', 'closed'];
  if (!allowed.includes(status)) { res.status(400); throw new Error('Invalid status'); }

  const fb = await Feedback.findById(req.params.id);
  if (!fb) { res.status(404); throw new Error('Feedback not found'); }

  if (req.user.role === 'clientadmin' && String(fb.clientId) !== String(req.user.clientId)) {
    res.status(403); throw new Error('Not authorized');
  }

  fb.status = status;
  await fb.save();
  res.json({ success: true, data: { _id: fb._id, status: fb.status } });
});

// @desc    Delete feedback
// @route   DELETE /api/feedback/:id
// @access  Private
const deleteFeedback = asyncHandler(async (req, res) => {
  const fb = await Feedback.findById(req.params.id);
  if (!fb) { res.status(404); throw new Error('Feedback not found'); }

  if (req.user.role === 'clientadmin' && String(fb.clientId) !== String(req.user.clientId)) {
    res.status(403); throw new Error('Not authorized');
  }

  await fb.deleteOne();
  res.json({ success: true, message: 'Feedback deleted' });
});

module.exports = { getFeedback, getFeedbackById, updateFeedbackStatus, deleteFeedback };
