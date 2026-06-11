const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// @desc    Get all users (admin)
// @route   GET /api/users
// @access  Super Admin
const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role = '', search = '' } = req.query;
  const query = {};
  if (role) query.role = role;
  if (search) query.$or = [
    { name: { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } },
  ];

  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .populate('clientId', 'businessName')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.json({ success: true, data: users, total });
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Super Admin
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate('clientId', 'businessName');
  if (!user) { res.status(404); throw new Error('User not found'); }
  res.json({ success: true, data: user });
});

// @desc    Create user
// @route   POST /api/users
// @access  Super Admin
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, clientId, isActive } = req.body;
  if (!name || !email || !password) {
    res.status(400); throw new Error('Name, email, password required');
  }

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) { res.status(400); throw new Error('User with this email already exists'); }

  const user = await User.create({
    name, email: email.toLowerCase(), password,
    role: role || 'clientadmin',
    clientId: clientId || null,
    isActive: isActive !== undefined ? isActive : true,
  });

  res.status(201).json({ success: true, data: { _id: user._id, name: user.name, email: user.email, role: user.role } });
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Super Admin
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }

  const { name, email, role, clientId, isActive, password } = req.body;
  if (name) user.name = name;
  if (email) user.email = email.toLowerCase();
  if (role) user.role = role;
  if (clientId !== undefined) user.clientId = clientId || null;
  if (isActive !== undefined) user.isActive = isActive;
  if (password) {
    // Set plain text — pre-save hook will hash it on save
    user.password = password;
  }

  const updated = await user.save({ validateBeforeSave: false });
  res.json({ success: true, data: { _id: updated._id, name: updated.name, email: updated.email, role: updated.role } });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Super Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  if (String(user._id) === String(req.user._id)) { res.status(400); throw new Error('Cannot delete yourself'); }
  await user.deleteOne();
  res.json({ success: true, message: 'User deleted' });
});

// @desc    Update own profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  const { name, email, currentPassword, newPassword } = req.body;

  if (name) user.name = name;
  if (email) user.email = email.toLowerCase();

  if (newPassword) {
    if (!currentPassword) { res.status(400); throw new Error('Current password required'); }
    const match = await user.matchPassword(currentPassword);
    if (!match) { res.status(401); throw new Error('Current password is incorrect'); }
    user.password = newPassword;
  }

  const updated = await user.save();
  res.json({ success: true, data: { _id: updated._id, name: updated.name, email: updated.email } });
});

module.exports = { getUsers, getUserById, createUser, updateUser, deleteUser, updateProfile };
