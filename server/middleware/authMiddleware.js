const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

/**
 * Protect - verifies JWT access token, attaches req.user
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      res.status(401);
      throw new Error('Not authorized, user not found');
    }
    if (!req.user.isActive) {
      res.status(401);
      throw new Error('Account is deactivated');
    }
    next();
  } catch (error) {
    res.status(401);
    throw new Error('Not authorized, token failed');
  }
});

/**
 * superAdmin — must come after protect; rejects non-superadmin roles
 */
const superAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'superadmin') return next();
  res.status(403);
  throw new Error('Access denied: Super Admin only');
};

module.exports = { protect, superAdmin };
