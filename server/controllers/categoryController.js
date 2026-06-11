const asyncHandler = require('express-async-handler');
const Category = require('../models/Category');

// @desc    List categories (Super Admin: all global; Client: their own)
// @route   GET /api/categories
// @access  Private
const getCategories = asyncHandler(async (req, res) => {
  let query = {};
  if (req.user.role === 'superadmin') {
    query = req.query.clientId ? { clientId: req.query.clientId } : { clientId: null };
  } else {
    query = { clientId: req.user.clientId };
  }

  const categories = await Category.find(query).sort({ sortOrder: 1, createdAt: 1 });
  res.json({ success: true, data: categories });
});

// @desc    Create category
// @route   POST /api/categories
// @access  Private
const createCategory = asyncHandler(async (req, res) => {
  const { name, description, isEnabled } = req.body;
  if (!name) { res.status(400); throw new Error('Category name is required'); }

  const clientId = req.user.role === 'superadmin'
    ? (req.body.clientId || null)
    : req.user.clientId;

  const maxOrder = await Category.findOne({ clientId }).sort({ sortOrder: -1 }).select('sortOrder');
  const sortOrder = maxOrder ? maxOrder.sortOrder + 1 : 0;

  const category = await Category.create({
    name, description, clientId,
    isEnabled: isEnabled !== undefined ? isEnabled : true,
    isCustom: true, sortOrder,
  });
  res.status(201).json({ success: true, data: category });
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private
const updateCategory = asyncHandler(async (req, res) => {
  const cat = await Category.findById(req.params.id);
  if (!cat) { res.status(404); throw new Error('Category not found'); }

  if (req.user.role !== 'superadmin' && String(cat.clientId) !== String(req.user.clientId)) {
    res.status(403); throw new Error('Not authorized');
  }

  const { name, description, isEnabled, sortOrder } = req.body;
  if (name !== undefined) cat.name = name;
  if (description !== undefined) cat.description = description;
  if (isEnabled !== undefined) cat.isEnabled = isEnabled;
  if (sortOrder !== undefined) cat.sortOrder = sortOrder;

  const updated = await cat.save();
  res.json({ success: true, data: updated });
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private
const deleteCategory = asyncHandler(async (req, res) => {
  const cat = await Category.findById(req.params.id);
  if (!cat) { res.status(404); throw new Error('Category not found'); }

  if (req.user.role !== 'superadmin' && String(cat.clientId) !== String(req.user.clientId)) {
    res.status(403); throw new Error('Not authorized');
  }

  await cat.deleteOne();
  res.json({ success: true, message: 'Category deleted' });
});

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
