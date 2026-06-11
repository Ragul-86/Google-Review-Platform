/**
 * Client Admin only — must be used after protect middleware
 */
const clientOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'clientadmin' || req.user.role === 'superadmin')) {
    next();
  } else {
    res.status(403);
    throw new Error('Access denied: Client Admin only');
  }
};

module.exports = { clientOnly };
