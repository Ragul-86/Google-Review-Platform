const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Customer = require('../models/Customer');
const Review = require('../models/Review');
const Feedback = require('../models/Feedback');

/* ── helpers ───────────────────────────────────────────────────── */
function getClientId(req) {
  return req.user.role === 'superadmin'
    ? req.query.clientId || req.body.clientId
    : req.user.clientId;
}

function assertOwner(customer, req) {
  if (req.user.role !== 'superadmin' && String(customer.clientId) !== String(req.user.clientId)) {
    const err = new Error('Not authorized'); err.status = 403; throw err;
  }
}

/* ── GET /api/customers ────────────────────────────────────────── */
const getCustomers = asyncHandler(async (req, res) => {
  const cId = getClientId(req);
  if (!cId) { res.status(400); throw new Error('clientId required'); }

  const { page = 1, limit = 25, search = '', status = '' } = req.query;
  const query = { clientId: cId };

  if (search) {
    query.$or = [
      { name:           { $regex: search, $options: 'i' } },
      { phone:          { $regex: search, $options: 'i' } },
      { serviceName:    { $regex: search, $options: 'i' } },
      { purposeOfVisit: { $regex: search, $options: 'i' } },  // legacy compat
    ];
  }
  if (status) query.whatsappStatus = status;

  const total = await Customer.countDocuments(query);
  const customers = await Customer.find(query)
    .sort({ createdAt: -1 })
    .skip((+page - 1) * +limit)
    .limit(+limit);

  res.json({ success: true, data: customers, total, pages: Math.ceil(total / limit) });
});

/* ── POST /api/customers ───────────────────────────────────────── */
const createCustomer = asyncHandler(async (req, res) => {
  const {
    name, phone, email,
    service,         // new: display name (sent as "service" from frontend)
    serviceId,       // new: reference ID
    purposeOfVisit,  // legacy fallback
    visitDate, staffName, notes,
  } = req.body;

  // Resolve service name — prefer new field, fall back to legacy
  const resolvedService = (service || purposeOfVisit || '').trim();

  if (!name || !phone || !resolvedService) {
    res.status(400);
    throw new Error('name, phone, and service are required');
  }

  const cId = getClientId(req);
  if (!cId) { res.status(400); throw new Error('clientId required'); }

  const customer = await Customer.create({
    clientId:      cId,
    name,
    phone,
    email:          email          || '',
    serviceName:    resolvedService,
    serviceId:      serviceId      || null,
    purposeOfVisit: resolvedService,  // keep in sync for backward compat
    visitDate:      visitDate ? new Date(visitDate) : new Date(),
    staffName:      staffName || '',
    notes:          notes     || '',
  });

  res.status(201).json({ success: true, data: customer });
});

/* ── PUT /api/customers/:id ────────────────────────────────────── */
const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) { res.status(404); throw new Error('Customer not found'); }
  assertOwner(customer, req);

  const {
    name, phone, email,
    service, serviceId, purposeOfVisit,
    visitDate, staffName, notes,
    whatsappStatus, reviewStatus,
  } = req.body;

  if (name !== undefined)  customer.name  = name;
  if (phone !== undefined) customer.phone = phone;
  if (email !== undefined) customer.email = email;
  if (visitDate !== undefined) customer.visitDate = visitDate;
  if (staffName !== undefined) customer.staffName = staffName;
  if (notes     !== undefined) customer.notes     = notes;
  if (whatsappStatus !== undefined) customer.whatsappStatus = whatsappStatus;
  if (reviewStatus   !== undefined) customer.reviewStatus   = reviewStatus;
  if (serviceId !== undefined) customer.serviceId = serviceId || null;

  // Resolve service name
  const newService = service ?? purposeOfVisit;
  if (newService !== undefined) {
    customer.serviceName    = newService.trim();
    customer.purposeOfVisit = newService.trim();  // keep in sync
  }

  await customer.save();
  res.json({ success: true, data: customer });
});

/* ── DELETE /api/customers/:id ─────────────────────────────────── */
const deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) { res.status(404); throw new Error('Customer not found'); }
  assertOwner(customer, req);
  await customer.deleteOne();
  res.json({ success: true, message: 'Customer deleted' });
});

/* ── PATCH /api/customers/:id/whatsapp-sent ────────────────────── */
const markWhatsappSent = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) { res.status(404); throw new Error('Customer not found'); }
  assertOwner(customer, req);

  if (customer.whatsappStatus === 'pending') {
    customer.whatsappStatus = 'sent';
    customer.whatsappSentAt = new Date();
    await customer.save();
  }

  res.json({ success: true, data: customer });
});

/* ── GET /api/customers/analytics ─────────────────────────────── */
const getCustomerAnalytics = asyncHandler(async (req, res) => {
  const cId = getClientId(req);
  if (!cId) { res.status(400); throw new Error('clientId required'); }

  // Single source of truth: Google reviews + private feedback are counted
  // directly from the Review/Feedback collections (ground truth in DB),
  // NOT from Customer.reviewStatus — that flag only updates when the
  // review page successfully pings back with ?c=customerId, so it can
  // under-count real submissions (e.g. QR scans without the param).
  const [total, sent, googleSubmitted, feedbackSubmitted, opened] = await Promise.all([
    Customer.countDocuments({ clientId: cId }),
    Customer.countDocuments({ clientId: cId, whatsappStatus: { $in: ['sent', 'clicked', 'reviewed'] } }),
    Review.countDocuments({ clientId: cId, type: 'positive' }),
    Feedback.countDocuments({ clientId: cId }),
    Customer.countDocuments({ clientId: cId, reviewStatus: 'opened' }),
  ]);

  const totalResponses = googleSubmitted + feedbackSubmitted;
  // Conversion = responses / WA sent (not / total customers)
  const conversionRate = sent > 0 ? Math.round((totalResponses / sent) * 100) : 0;

  // Service breakdown
  const ObjectId = mongoose.Types.ObjectId;
  const clientOid = ObjectId.createFromHexString
    ? ObjectId.createFromHexString(String(cId))
    : new ObjectId(String(cId));

  const serviceBreakdownRaw = await Customer.aggregate([
    { $match: { clientId: clientOid } },
    {
      $group: {
        _id:      { $ifNull: ['$serviceName', '$purposeOfVisit'] },
        total:    { $sum: 1 },
        googleReviews:  { $sum: { $cond: [{ $in: ['$reviewStatus', ['google_submitted', 'submitted']] }, 1, 0] } },
        feedback:       { $sum: { $cond: [{ $eq: ['$reviewStatus', 'feedback_submitted'] }, 1, 0] } },
        waSent:   { $sum: { $cond: [{ $in: ['$whatsappStatus', ['sent', 'clicked', 'reviewed']] }, 1, 0] } },
      },
    },
    { $match: { _id: { $ne: null, $ne: '' } } },
    { $sort: { total: -1 } },
    { $limit: 20 },
  ]);

  const byService = serviceBreakdownRaw.map((row) => {
    const responses = row.googleReviews + row.feedback;
    return {
      service:        row._id || 'Unknown',
      total:          row.total,
      googleReviews:  row.googleReviews,
      feedback:       row.feedback,
      responses,
      waSent:         row.waSent,
      conversionRate: row.waSent > 0 ? Math.round((responses / row.waSent) * 100) : 0,
    };
  });

  res.json({
    success: true,
    data: {
      totalCustomers:   total,
      whatsappSent:     sent,
      googleReviews:    googleSubmitted,
      privateFeedback:  feedbackSubmitted,
      totalResponses,
      conversionRate,
      opened,
      byService,
    },
  });
});

module.exports = {
  getCustomers, createCustomer, updateCustomer, deleteCustomer,
  markWhatsappSent, getCustomerAnalytics,
};
