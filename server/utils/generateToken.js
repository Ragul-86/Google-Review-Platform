const jwt = require('jsonwebtoken');

const generateAccessToken = (id, role, clientId = null) => {
  return jwt.sign(
    { id, role, clientId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '15m' }
  );
};

const generateRefreshToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );
};

module.exports = { generateAccessToken, generateRefreshToken };
