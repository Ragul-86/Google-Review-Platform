const asyncHandler = require('express-async-handler');
const Client = require('../models/Client');
const Customer = require('../models/Customer');
const ReviewRequest = require('../models/ReviewRequest');
const RewardTransaction = require('../models/RewardTransaction');
const { currentMonth } = require('../utils/rewardMonth');
const { generateUniqueToken } = require('../utils/secureToken');

function getClientId(req) {
  return req.user.role === 'superadmin'
    ? req.query.clientId || req.body.clientId
    : req.user.clientId;
}

/* ── POST /api/review-requests   (PUBLIC — no auth) ─────────────────
   Body: { clientSlug, customerName, phone, email?, rating, category?, customerId? }

   Fired the instant a customer clicks "I've Submitted My Review" on
   the public review page. This NEVER creates a reward and NEVER sends
   WhatsApp — it only logs a Pending-Verification request that shows
   up in the client's "Review Verification" dashboard. The client must
   manually Approve it and then manually click "Send Scratch Card"
   before any reward link exists. */
const createReviewRequest = asyncHandler(async (req, res) => {
  const { clientSlug, customerName, phone, email, rating, category, customerId } = req.body;

  if (!clientSlug || !customerName?.trim() || !phone?.trim()) {
    res.status(400);
    throw new Error('clientSlug, customerName and phone are required');
  }
  const ratingNum = Number(rating);
  if (!Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    res.status(400);
    throw new Error('A valid rating (1-5) is required');
  }

  const client = await Client.findOne({ slug: clientSlug, status: 'active' });
  if (!client) { res.status(404); throw new Error('Business not found'); }

  let resolvedCustomerId = null;
  if (customerId) {
    const cust = await Customer.findById(customerId).select('_id clientId');
    if (cust && String(cust.clientId) === String(client._id)) resolvedCustomerId = cust._id;
  }

  const reviewRequest = await ReviewRequest.create({
    clientId: client._id,
    customerId: resolvedCustomerId,
    customerName: customerName.trim(),
    phone: phone.trim(),
    email: email?.trim() || '',
    rating: ratingNum,
    category: category?.trim() || '',
    reviewDate: new Date(),
    status: 'pending',
  });

  res.status(201).json({
    success: true,
    message: 'Thanks! Your request has been submitted for verification.',
    data: { id: reviewRequest._id },
  });
});

/* ── GET /api/review-requests ────────────────────────────────────── */
const getReviewRequests = asyncHandler(async (req, res) => {
  const clientId = getClientId(req);
  if (!clientId) { res.status(400); throw new Error('clientId required'); }

  const { page = 1, limit = 20, status = '', search = '', dateRange = '' } = req.query;
  const query = { clientId };

  if (status) query.status = status;
  if (search) {
    const trimmed = search.trim();
    query.$or = [
      { customerName: { $regex: trimmed, $options: 'i' } },
      { phone:         { $regex: trimmed, $options: 'i' } },
      { email:         { $regex: trimmed, $options: 'i' } },
      { category:      { $regex: trimmed, $options: 'i' } },
    ];
  }
  const now = new Date();
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

  const total = await ReviewRequest.countDocuments(query);
  const requests = await ReviewRequest.find(query)
    .populate('rewardTransactionId', 'token rewardStatus isScratched rewardAmount couponCode')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit, 10));

  const baseQuery = { clientId };
  const [total_, pending, approved, rejected] = await Promise.all([
    ReviewRequest.countDocuments(baseQuery),
    ReviewRequest.countDocuments({ ...baseQuery, status: 'pending' }),
    ReviewRequest.countDocuments({ ...baseQuery, status: 'approved' }),
    ReviewRequest.countDocuments({ ...baseQuery, status: 'rejected' }),
  ]);

  res.json({
    success: true,
    data: requests,
    total,
    page: parseInt(page, 10),
    pages: Math.ceil(total / limit),
    counts: { total: total_, pending, approved, rejected },
  });
});

/* ── GET /api/review-requests/:id ────────────────────────────────── */
const getReviewRequestById = asyncHandler(async (req, res) => {
  const reviewRequest = await ReviewRequest.findById(req.params.id)
    .populate('rewardTransactionId');
  if (!reviewRequest) { res.status(404); throw new Error('Review request not found'); }

  const clientId = getClientId(req);
  if (String(reviewRequest.clientId) !== String(clientId)) { res.status(403); throw new Error('Not authorized'); }

  res.json({ success: true, data: reviewRequest });
});

async function findOwnedRequest(req, res) {
  const reviewRequest = await ReviewRequest.findById(req.params.id);
  if (!reviewRequest) { res.status(404); throw new Error('Review request not found'); }

  const clientId = getClientId(req);
  if (String(reviewRequest.clientId) !== String(clientId)) { res.status(403); throw new Error('Not authorized'); }

  return reviewRequest;
}

/* ── PATCH /api/review-requests/:id/approve ───────────────────────── */
const approveReviewRequest = asyncHandler(async (req, res) => {
  const reviewRequest = await findOwnedRequest(req, res);
  reviewRequest.status = 'approved';
  await reviewRequest.save();
  res.json({ success: true, data: reviewRequest });
});

/* ── PATCH /api/review-requests/:id/reject ────────────────────────── */
const rejectReviewRequest = asyncHandler(async (req, res) => {
  const reviewRequest = await findOwnedRequest(req, res);
  reviewRequest.status = 'rejected';
  await reviewRequest.save();
  res.json({ success: true, data: reviewRequest });
});

/* ── PATCH /api/review-requests/:id/send-scratch-card ────────────────
   The ONLY place a RewardTransaction (and its secure one-time token)
   gets created in the new flow. Requires the request to already be
   Approved — the client must verify before sending. Idempotent: if a
   transaction already exists for this request, just hand back its
   existing token/link instead of creating a duplicate.

   IMPORTANT: this endpoint never contacts WhatsApp itself. It only
   returns the token + a wa.me link/message for the client's browser to
   open — the client still has to press Send manually inside WhatsApp. */
const sendScratchCard = asyncHandler(async (req, res) => {
  const reviewRequest = await findOwnedRequest(req, res);

  if (reviewRequest.status !== 'approved') {
    res.status(400);
    throw new Error('Approve this review request before sending a Scratch Card.');
  }

  let transaction;
  if (reviewRequest.rewardTransactionId) {
    transaction = await RewardTransaction.findById(reviewRequest.rewardTransactionId);
  }

  if (!transaction) {
    const token = await generateUniqueToken(RewardTransaction);
    transaction = await RewardTransaction.create({
      clientId: reviewRequest.clientId,
      customerId: reviewRequest.customerId,
      reviewRequestId: reviewRequest._id,
      customerName: reviewRequest.customerName,
      phone: reviewRequest.phone,
      email: reviewRequest.email,
      token,
      rewardStatus: 'sent',
      whatsappStatus: 'not_sent',
      month: currentMonth(), // placeholder — the real tier pool is resolved at scratch time
    });
    reviewRequest.rewardTransactionId = transaction._id;
    await reviewRequest.save();
  }

  const client = await Client.findById(reviewRequest.clientId).select('businessName');

  res.json({
    success: true,
    data: {
      token: transaction.token,
      customerName: transaction.customerName,
      phone: transaction.phone,
      businessName: client?.businessName || '',
    },
  });
});

module.exports = {
  createReviewRequest,
  getReviewRequests,
  getReviewRequestById,
  approveReviewRequest,
  rejectReviewRequest,
  sendScratchCard,
};
