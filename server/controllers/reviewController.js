const asyncHandler = require('express-async-handler');
const Review = require('../models/Review');
const Client = require('../models/Client');
const Feedback = require('../models/Feedback');
const { sendFeedbackNotification } = require('../services/emailService');

// @desc    Get reviews (admin: all; client: theirs)
// @route   GET /api/reviews
// @access  Private
const getReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, type = '', rating = '', search = '', clientId = '' } = req.query;

  const query = {};
  if (req.user.role === 'clientadmin') {
    query.clientId = req.user.clientId;
  } else if (clientId) {
    query.clientId = clientId;
  }
  if (type) query.type = type;
  if (rating) query.rating = parseInt(rating);
  if (search) query.$or = [
    { customerName: { $regex: search, $options: 'i' } },
    { reviewText: { $regex: search, $options: 'i' } },
  ];

  const total = await Review.countDocuments(query);
  const reviews = await Review.find(query)
    .populate('clientId', 'businessName slug')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.json({ success: true, data: reviews, total, page: parseInt(page), pages: Math.ceil(total / limit) });
});

// @desc    Get single review
// @route   GET /api/reviews/:id
// @access  Private
const getReviewById = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id).populate('clientId', 'businessName');
  if (!review) { res.status(404); throw new Error('Review not found'); }
  res.json({ success: true, data: review });
});

// @desc    Submit review from public page (positive → DB, negative → Feedback)
// @route   POST /api/reviews/submit
// @access  Public
const submitReview = asyncHandler(async (req, res) => {
  const {
    clientSlug, rating, type,
    // positive
    categoryLabel, selectedSuggestion,
    // negative
    customerName, customerEmail, customerPhone, message,
    serviceLabel,   // service selected before rating (if available)
    qrToken,
  } = req.body;

  if (!clientSlug || !rating || !type) {
    res.status(400); throw new Error('clientSlug, rating, type are required');
  }

  const client = await Client.findOne({ slug: clientSlug, status: 'active' });
  if (!client) { res.status(404); throw new Error('Business not found or inactive'); }

  let qrCodeId = null;
  if (qrToken) {
    const QRCode = require('../models/QRCode');
    const qr = await QRCode.findOne({ token: qrToken, clientId: client._id });
    if (qr) {
      qrCodeId = qr._id;
      qr.scanCount += 1;
      await qr.save();
    }
  }

  if (parseInt(rating) >= 4) {
    // Positive review → store in Reviews
    const review = await Review.create({
      clientId: client._id,
      customerName: customerName || 'Anonymous',
      rating: parseInt(rating),
      type: 'positive',
      categoryLabel: categoryLabel || '',
      selectedSuggestion: selectedSuggestion || '',
      reviewText: selectedSuggestion || '',   // mirror into reviewText for uniform display
      source: qrCodeId ? 'qr' : 'direct',
      qrCodeId,
    });
    return res.status(201).json({ success: true, data: review, redirectTo: client.googleReviewLink });
  } else {
    // Negative → store in Feedback and notify client
    const feedback = await Feedback.create({
      clientId: client._id,
      customerName: customerName || 'Anonymous',
      email: customerEmail || '',
      phone: customerPhone || '',
      rating: parseInt(rating),
      feedback: message || '',
      categoryLabel: serviceLabel || categoryLabel || '',
      status: 'new',
    });

    // Notify client admin
    if (client.email) {
      sendFeedbackNotification({
        clientEmail: client.email,
        clientName: client.businessName,
        feedbackData: {
          customerName: customerName || 'Anonymous',
          rating: parseInt(rating),
          phone: customerPhone || '',
          email: customerEmail || '',
          feedback: message || '',
        },
      }).catch(() => {});
    }

    return res.status(201).json({ success: true, data: feedback, redirectTo: `/review/${clientSlug}/thanks` });
  }
});

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Super Admin
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) { res.status(404); throw new Error('Review not found'); }
  await review.deleteOne();
  res.json({ success: true, message: 'Review deleted' });
});

// @desc    Get overview metrics for client dashboard
// @route   GET /api/reviews/overview
// @access  Client Admin
const getOverview = asyncHandler(async (req, res) => {
  const clientId = req.user.role === 'superadmin'
    ? req.query.clientId || null
    : req.user.clientId;

  const query = clientId ? { clientId } : {};
  const reviews = await Review.find(query).select('rating type createdAt');

  const total = reviews.length;
  const positive = reviews.filter((r) => r.type === 'positive').length;
  const negative = reviews.filter((r) => r.type === 'negative').length;
  const avg = total ? (reviews.reduce((s, r) => s + r.rating, 0) / total) : 0;

  const feedbackQuery = clientId ? { clientId } : {};
  const openFeedback = await Feedback.countDocuments({ ...feedbackQuery, status: { $in: ['new', 'in_progress'] } });

  const QRCode = require('../models/QRCode');
  const qrCount = await QRCode.countDocuments(clientId ? { clientId } : {});

  res.json({
    success: true,
    data: {
      total, positive, negative,
      average: parseFloat(avg.toFixed(2)),
      openFeedback, qrCount,
    },
  });
});

// @desc    Generate AI review suggestions using OpenAI
// @route   POST /api/reviews/suggestions
// @access  Public
const generateSuggestions = asyncHandler(async (req, res) => {
  const {
    businessName,
    categoryLabel,
    rating      = 5,
    serviceLabel  = '',   // e.g. "Hair Cut"
    businessType  = '',   // e.g. "Salon"
  } = req.body;

  if (!businessName || !categoryLabel) {
    res.status(400); throw new Error('businessName and categoryLabel are required');
  }

  const b  = businessName.trim();
  const c  = categoryLabel.trim();
  const r  = Math.min(5, Math.max(1, parseInt(rating)));
  const s  = serviceLabel.trim();
  const bt = businessType.trim();

  // Context strings for prompts / fallbacks
  const serviceCtx  = s  ? ` for "${s}"` : '';
  const bizTypeCtx  = bt ? ` (${bt})` : '';

  // Fallback templates
  const fallback = [
    `Absolutely loved my visit to ${b}${bizTypeCtx}! The ${c}${serviceCtx} was exceptional — professional, thorough, and exactly what I needed. The team made me feel so welcome. Highly recommended! ${'⭐'.repeat(r)}`,
    `Had a fantastic experience at ${b}. What really stood out was the ${c}${serviceCtx} — top-notch quality and genuine care. You can tell the team loves what they do. Will definitely be back! ${'⭐'.repeat(r)}`,
    `Impressed with ${b}! The ${c}${serviceCtx} exceeded all my expectations. From the moment I arrived, everything was seamless and professional. Don't hesitate — you won't be disappointed. ${'⭐'.repeat(r)}`,
  ];

  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
    try {
      const { OpenAI } = require('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const contextParts = [];
      if (bt) contextParts.push(`Business type: ${bt}`);
      if (s)  contextParts.push(`Service used: ${s}`);
      contextParts.push(`Highlighted category: ${c}`);
      contextParts.push(`Star rating: ${r}/5`);
      const contextBlock = contextParts.join('\n');

      const prompt = `Generate exactly 3 different Google review texts for a business called "${b}".

Context:
${contextBlock}

Rules:
- Each review must be 2-4 sentences, natural and human-sounding (not robotic or template-like)
- Vary the tone across the 3 reviews: enthusiastic, warm, and matter-of-fact
- Mention the business name, the service (if provided), and the highlighted category naturally
- Match the tone to the star rating (${r} stars = ${r >= 4 ? 'positive/glowing' : r === 3 ? 'generally positive with mild suggestions' : 'disappointed but constructive'})
- Do NOT number the reviews or add headers
- Separate each review with the exact delimiter: ---
- Output ONLY the 3 reviews separated by ---, no extra text`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.85,
        max_tokens: 500,
      });

      const raw   = completion.choices[0].message.content || '';
      const parts = raw.split('---').map((s) => s.trim()).filter(Boolean);

      if (parts.length >= 3) {
        return res.json({ success: true, suggestions: parts.slice(0, 3) });
      }
    } catch (err) {
      console.error('OpenAI error:', err.message);
    }
  }

  res.json({ success: true, suggestions: fallback });
});

// @desc    Get rating distribution + counts for Reviews and Feedback
// @route   GET /api/reviews/stats
// @access  Private
const getReviewStats = asyncHandler(async (req, res) => {
  const clientId = req.user.role === 'superadmin'
    ? req.query.clientId || null
    : req.user.clientId;

  const reviewQuery = clientId ? { clientId, type: 'positive' } : { type: 'positive' };
  const feedbackQuery = clientId ? { clientId } : {};

  // Fetch all ratings (lightweight projection)
  const [reviewRatings, feedbackRatings] = await Promise.all([
    Review.find(reviewQuery).select('rating createdAt').lean(),
    Feedback.find(feedbackQuery).select('rating status createdAt').lean(),
  ]);

  // Google Reviews: rating distribution for 4★ and 5★
  const googleByRating = { 4: 0, 5: 0 };
  for (const r of reviewRatings) {
    if (r.rating === 4) googleByRating[4]++;
    else if (r.rating === 5) googleByRating[5]++;
  }

  // Private Feedback: rating distribution for 1★–3★
  const feedbackByRating = { 1: 0, 2: 0, 3: 0 };
  const feedbackByStatus = { new: 0, in_progress: 0, resolved: 0, closed: 0 };
  for (const f of feedbackRatings) {
    if (f.rating >= 1 && f.rating <= 3) feedbackByRating[f.rating] = (feedbackByRating[f.rating] || 0) + 1;
    if (f.status) feedbackByStatus[f.status] = (feedbackByStatus[f.status] || 0) + 1;
  }

  const googleTotal   = reviewRatings.length;
  const feedbackTotal = feedbackRatings.length;

  res.json({
    success: true,
    data: {
      googleReviews:    googleTotal,
      privateFeedback:  feedbackTotal,
      total:            googleTotal + feedbackTotal,
      googleByRating,
      feedbackByRating,
      feedbackByStatus,
    },
  });
});

module.exports = { getReviews, getReviewById, submitReview, deleteReview, getOverview, generateSuggestions, getReviewStats };
