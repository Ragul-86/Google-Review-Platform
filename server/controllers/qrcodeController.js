const asyncHandler = require('express-async-handler');
const QRCodeLib = require('qrcode');
const QRCode = require('../models/QRCode');
const Client = require('../models/Client');

function randToken(n = 10) {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// @desc    Get QR codes
// @route   GET /api/qrcodes
// @access  Private
const getQRCodes = asyncHandler(async (req, res) => {
  const query = req.user.role === 'clientadmin'
    ? { clientId: req.user.clientId }
    : req.query.clientId ? { clientId: req.query.clientId } : {};

  const qrCodes = await QRCode.find(query)
    .populate('clientId', 'businessName slug')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: qrCodes });
});

// @desc    Create QR code
// @route   POST /api/qrcodes
// @access  Client Admin
const createQRCode = asyncHandler(async (req, res) => {
  const { title, source, destinationUrl } = req.body;
  if (!title) { res.status(400); throw new Error('Title is required'); }

  const clientId = req.user.role === 'superadmin'
    ? req.body.clientId
    : req.user.clientId;

  if (!clientId) { res.status(400); throw new Error('clientId required'); }

  const client = await Client.findById(clientId);
  if (!client) { res.status(404); throw new Error('Client not found'); }

  // Generate unique token
  let token = randToken();
  while (await QRCode.findOne({ token })) { token = randToken(); }

  // Build destination URL — frontend always recomputes from window.location.origin
  // Store a relative path so it works on any domain
  const url = destinationUrl || `/review/${client.slug}?qr=${token}`;

  // Generate QR image as base64 using the full URL
  const fullUrl = (process.env.CLIENT_URL || 'http://localhost:5173') + url;
  let qrImage = null;
  try {
    qrImage = await QRCodeLib.toDataURL(fullUrl, { width: 300, margin: 2, color: { dark: '#000000', light: '#FFFFFF' } });
  } catch (e) {
    console.error('QR generation error:', e.message);
  }

  const qrCode = await QRCode.create({
    clientId,
    title,
    token,
    source: source || 'custom',
    destinationUrl: url,
    qrImage,
    isActive: true,
  });

  res.status(201).json({ success: true, data: qrCode });
});

// @desc    Delete QR code
// @route   DELETE /api/qrcodes/:id
// @access  Private
const deleteQRCode = asyncHandler(async (req, res) => {
  const qr = await QRCode.findById(req.params.id);
  if (!qr) { res.status(404); throw new Error('QR Code not found'); }

  if (req.user.role === 'clientadmin' && String(qr.clientId) !== String(req.user.clientId)) {
    res.status(403); throw new Error('Not authorized');
  }

  await qr.deleteOne();
  res.json({ success: true, message: 'QR Code deleted' });
});

// @desc    Regenerate QR image for a code
// @route   POST /api/qrcodes/:id/regenerate
// @access  Private
const regenerateQR = asyncHandler(async (req, res) => {
  const qr = await QRCode.findById(req.params.id);
  if (!qr) { res.status(404); throw new Error('QR Code not found'); }

  if (req.user.role === 'clientadmin' && String(qr.clientId) !== String(req.user.clientId)) {
    res.status(403); throw new Error('Not authorized');
  }

  const newImage = await QRCodeLib.toDataURL(qr.destinationUrl, { width: 300, margin: 2 });
  qr.qrImage = newImage;
  await qr.save();
  res.json({ success: true, data: qr });
});

// @desc    Track QR scan (public)
// @route   POST /api/qrcodes/scan/:token
// @access  Public
const trackScan = asyncHandler(async (req, res) => {
  const qr = await QRCode.findOne({ token: req.params.token, isActive: true });
  if (!qr) { res.status(404); throw new Error('QR Code not found'); }
  qr.scanCount += 1;
  await qr.save();
  res.json({ success: true, destinationUrl: qr.destinationUrl });
});

module.exports = { getQRCodes, createQRCode, deleteQRCode, regenerateQR, trackScan };
