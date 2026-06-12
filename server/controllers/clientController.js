const asyncHandler = require('express-async-handler');
const Client = require('../models/Client');
const User = require('../models/User');
const Category = require('../models/Category');
const Review = require('../models/Review');
const Feedback = require('../models/Feedback');
const QRCode = require('../models/QRCode');
const slugify = require('../utils/slugify');
const { sendWelcomeEmail } = require('../services/emailService');
const { seedDefaultTemplate } = require('./whatsappTemplateController');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');

// Default categories by business type
const CATEGORY_TEMPLATES = {
  Restaurant: ['Food Quality', 'Service', 'Ambience', 'Value for Money', 'Cleanliness', 'Staff Friendliness'],
  Clinic: ['Doctor', 'Staff', 'Waiting Time', 'Cleanliness', 'Diagnosis', 'Overall Care'],
  Salon: ['Hair Service', 'Skin Treatment', 'Staff Skills', 'Ambience', 'Hygiene', 'Value'],
  Hotel: ['Room Quality', 'Service', 'Cleanliness', 'Location', 'Food', 'Staff'],
  Retail: ['Product Quality', 'Pricing', 'Staff Helpfulness', 'Store Cleanliness', 'Variety'],
  Other: ['Service Quality', 'Staff Friendliness', 'Value for Money', 'Overall Experience'],
};

function generatePassword(len = 12) {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// @desc    Get all clients
// @route   GET /api/clients
// @access  Super Admin
const getClients = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search = '', status = '' } = req.query;
  const query = {};
  if (search) query.businessName = { $regex: search, $options: 'i' };
  if (status) query.status = status;

  const total = await Client.countDocuments(query);
  const clients = await Client.find(query)
    .populate('ownerId', 'name email isActive')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.json({ success: true, data: clients, total, page: parseInt(page), pages: Math.ceil(total / limit) });
});

// @desc    Get client by ID
// @route   GET /api/clients/:id
// @access  Super Admin
const getClientById = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id).populate('ownerId', 'name email isActive');
  if (!client) { res.status(404); throw new Error('Client not found'); }
  res.json({ success: true, data: client });
});

// @desc    Create client + owner user
// @route   POST /api/clients
// @access  Super Admin
const createClient = asyncHandler(async (req, res) => {
  const {
    businessName, businessCategory, googleReviewLink,
    address, phone, email, website, subscriptionPlan,
    ownerName, ownerEmail,
  } = req.body;

  if (!businessName || !ownerEmail || !ownerName) {
    res.status(400); throw new Error('businessName, ownerName, ownerEmail are required');
  }

  // Generate unique slug
  let baseSlug = slugify(businessName) || 'business';
  let slug = baseSlug;
  let i = 1;
  while (await Client.findOne({ slug })) { slug = `${baseSlug}-${i++}`; }

  // Create or find owner
  let owner = await User.findOne({ email: ownerEmail.toLowerCase() });
  let tempPassword = null;

  if (!owner) {
    tempPassword = generatePassword();
    // Pass plain text — User pre-save hook hashes it (avoid double-hash)
    owner = await User.create({
      name: ownerName,
      email: ownerEmail.toLowerCase(),
      password: tempPassword,
      role: 'clientadmin',
      isActive: true,
    });
  }

  const client = await Client.create({
    businessName, slug, businessCategory,
    googleReviewLink: googleReviewLink || '',
    address: address || '', phone: phone || '',
    email: email || '', website: website || '',
    subscriptionPlan: subscriptionPlan || 'free',
    ownerId: owner._id,
    status: 'active',
    businessLogo: req.file ? `/uploads/${req.file.filename}` : (req.body.businessLogo || null),
  });

  // Link owner to client
  owner.clientId = client._id;
  owner.role = 'clientadmin';
  await owner.save({ validateBeforeSave: false });

  // Seed default WhatsApp template
  seedDefaultTemplate(client._id).catch(() => {});

  // Seed categories
  const presets = CATEGORY_TEMPLATES[businessCategory] || CATEGORY_TEMPLATES['Other'];
  await Category.insertMany(presets.map((name, idx) => ({
    name, clientId: client._id, isEnabled: true, sortOrder: idx,
  })));

  // Send welcome email
  if (tempPassword) {
    sendWelcomeEmail({
      to: ownerEmail,
      name: ownerName,
      email: ownerEmail,
      tempPassword,
      loginUrl: `${process.env.CLIENT_URL}/login`,
    }).catch(() => {});
  }

  res.status(201).json({
    success: true,
    data: client,
    tempPassword: tempPassword || undefined,
    message: 'Client created successfully',
  });
});

// @desc    Update client
// @route   PUT /api/clients/:id
// @access  Super Admin
const updateClient = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id);
  if (!client) { res.status(404); throw new Error('Client not found'); }

  const fields = ['businessName', 'businessCategory', 'googleReviewLink', 'address', 'phone', 'email', 'website', 'subscriptionPlan', 'status'];
  fields.forEach((f) => { if (req.body[f] !== undefined) client[f] = req.body[f]; });
  if (req.file) client.businessLogo = `/uploads/${req.file.filename}`;
  else if (req.body.businessLogo !== undefined) client.businessLogo = req.body.businessLogo || null;

  const updated = await client.save();
  res.json({ success: true, data: updated });
});

// @desc    Delete client
// @route   DELETE /api/clients/:id
// @access  Super Admin
const deleteClient = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id);
  if (!client) { res.status(404); throw new Error('Client not found'); }

  await Promise.all([
    Review.deleteMany({ clientId: client._id }),
    Feedback.deleteMany({ clientId: client._id }),
    QRCode.deleteMany({ clientId: client._id }),
    Category.deleteMany({ clientId: client._id }),
    User.findByIdAndUpdate(client.ownerId, { clientId: null }),
    client.deleteOne(),
  ]);

  res.json({ success: true, message: 'Client and all related data deleted' });
});

// @desc    Toggle client status
// @route   PATCH /api/clients/:id/status
// @access  Super Admin
const toggleClientStatus = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id);
  if (!client) { res.status(404); throw new Error('Client not found'); }
  client.status = client.status === 'active' ? 'inactive' : 'active';
  await client.save();
  res.json({ success: true, data: { status: client.status } });
});

// @desc    Get client's own profile (Client Admin)
// @route   GET /api/clients/me
// @access  Client Admin
const getMyClient = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.user.clientId);
  if (!client) { res.status(404); throw new Error('Business not found'); }
  res.json({ success: true, data: client });
});

// @desc    Update client's own profile (Client Admin)
// @route   PUT /api/clients/me
// @access  Client Admin
const updateMyClient = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.user.clientId);
  if (!client) { res.status(404); throw new Error('Business not found'); }

  const allowed = ['businessName', 'googleReviewLink', 'address', 'phone', 'email', 'website'];
  allowed.forEach((f) => { if (req.body[f] !== undefined) client[f] = req.body[f]; });
  if (req.file) client.businessLogo = `/uploads/${req.file.filename}`;

  const updated = await client.save();
  res.json({ success: true, data: updated });
});

// @desc    Reset client owner password
// @route   POST /api/clients/:id/reset-password
// @access  Super Admin
const resetClientPassword = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id).populate('ownerId', 'email name');
  if (!client) { res.status(404); throw new Error('Client not found'); }
  if (!client.ownerId) { res.status(400); throw new Error('Client has no owner'); }

  const tempPassword = generatePassword();
  const owner = await User.findById(client.ownerId._id);
  owner.password = tempPassword; // pre-save hook will hash it
  await owner.save();

  res.json({ success: true, tempPassword, email: owner.email });
});

// @desc    Reset client login ID (owner email)
// @route   PATCH /api/clients/:id/reset-login
// @access  Super Admin
const resetLoginId = asyncHandler(async (req, res) => {
  const { newEmail } = req.body;
  if (!newEmail?.trim()) { res.status(400); throw new Error('newEmail is required'); }

  const client = await Client.findById(req.params.id).populate('ownerId', 'email name');
  if (!client) { res.status(404); throw new Error('Client not found'); }
  if (!client.ownerId) { res.status(400); throw new Error('Client has no owner'); }

  const emailLower = newEmail.toLowerCase().trim();

  // Check not already in use by another user
  const existing = await User.findOne({ email: emailLower, _id: { $ne: client.ownerId._id } });
  if (existing) { res.status(409); throw new Error('Email already in use by another account'); }

  const owner = await User.findById(client.ownerId._id);
  const oldEmail = owner.email;
  owner.email = emailLower;
  await owner.save({ validateBeforeSave: false });

  res.json({ success: true, oldEmail, newEmail: emailLower, message: 'Login ID updated successfully' });
});

// @desc    Send message (email) to client owner
// @route   POST /api/clients/:id/message
// @access  Super Admin
const sendClientMessage = asyncHandler(async (req, res) => {
  const { subject, message, channel = 'email' } = req.body;
  if (!subject?.trim() || !message?.trim()) {
    res.status(400); throw new Error('subject and message are required');
  }

  const client = await Client.findById(req.params.id).populate('ownerId', 'email name');
  if (!client) { res.status(404); throw new Error('Client not found'); }

  const ownerEmail = client.ownerId?.email || client.email;
  const ownerName  = client.ownerId?.name || client.businessName;

  if (!ownerEmail) { res.status(400); throw new Error('No email address found for this client'); }

  const { sendEmail } = require('../services/emailService');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1f2937;">${subject}</h2>
      <p>Hi ${ownerName},</p>
      <div style="background: #f9fafb; padding: 16px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 16px 0;">
        <p style="white-space: pre-wrap; color: #374151;">${message}</p>
      </div>
      <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">— Platform Admin</p>
    </div>
  `;

  const result = await sendEmail({
    to: ownerEmail,
    subject: `[Admin Message] ${subject}`,
    html,
    text: message,
  });

  if (!result.success) {
    res.status(500); throw new Error('Failed to send email: ' + result.error);
  }

  res.json({ success: true, sentTo: ownerEmail, channel, message: 'Message sent successfully' });
});

module.exports = {
  getClients, getClientById, createClient, updateClient,
  deleteClient, toggleClientStatus, getMyClient, updateMyClient,
  resetClientPassword, resetLoginId, sendClientMessage,
};
