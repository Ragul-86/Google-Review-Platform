const asyncHandler = require('express-async-handler');
const Service = require('../models/Service');

function getClientId(req) {
  return req.user.role === 'superadmin'
    ? req.query.clientId || req.body.clientId
    : req.user.clientId;
}

/* ── GET /api/services ────────────────────────────────────────── */
const getServices = asyncHandler(async (req, res) => {
  const clientId = getClientId(req);
  if (!clientId) { res.status(400); throw new Error('clientId required'); }

  const { search = '', status = '' } = req.query;
  const query = { clientId };
  if (search) query.name = { $regex: search, $options: 'i' };
  if (status) query.status = status;

  const services = await Service.find(query).sort({ status: 1, name: 1 });
  res.json({ success: true, data: services });
});

/* ── POST /api/services ───────────────────────────────────────── */
const createService = asyncHandler(async (req, res) => {
  const clientId = getClientId(req);
  if (!clientId) { res.status(400); throw new Error('clientId required'); }

  const { name, description, category } = req.body;
  if (!name) { res.status(400); throw new Error('name is required'); }

  const service = await Service.create({
    clientId,
    name:        name.trim(),
    description: description?.trim() || '',
    category:    category?.trim()    || '',
    status:      'active',
  });

  res.status(201).json({ success: true, data: service });
});

/* ── PUT /api/services/:id ────────────────────────────────────── */
const updateService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) { res.status(404); throw new Error('Service not found'); }

  const clientId = getClientId(req);
  if (String(service.clientId) !== String(clientId)) {
    res.status(403); throw new Error('Not authorized');
  }

  const { name, description, category } = req.body;
  if (name !== undefined)        service.name        = name.trim();
  if (description !== undefined) service.description = description.trim();
  if (category !== undefined)    service.category    = category.trim();

  await service.save();
  res.json({ success: true, data: service });
});

/* ── DELETE /api/services/:id ─────────────────────────────────── */
const deleteService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) { res.status(404); throw new Error('Service not found'); }

  const clientId = getClientId(req);
  if (String(service.clientId) !== String(clientId)) {
    res.status(403); throw new Error('Not authorized');
  }

  await service.deleteOne();
  res.json({ success: true, message: 'Service deleted' });
});

/* ── PATCH /api/services/:id/toggle ──────────────────────────── */
const toggleService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) { res.status(404); throw new Error('Service not found'); }

  const clientId = getClientId(req);
  if (String(service.clientId) !== String(clientId)) {
    res.status(403); throw new Error('Not authorized');
  }

  service.status = service.status === 'active' ? 'inactive' : 'active';
  await service.save();
  res.json({ success: true, data: { status: service.status } });
});

module.exports = { getServices, createService, updateService, deleteService, toggleService };
