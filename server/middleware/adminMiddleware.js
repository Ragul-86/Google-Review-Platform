/**
 * Admin only — must be used after protect middleware
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'superadmin') {
    next();
  } else {
    res.status(403);
    throw new Error('Access denied: Super Admin only');
  }
};

module.exports = { adminOnly };
