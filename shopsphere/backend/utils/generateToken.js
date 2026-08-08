const jwt = require('jsonwebtoken');

/**
 * Signs a JWT for a given user id. Also sets it as an httpOnly cookie
 * on the response (useful for browser clients), and returns the raw
 * token so it can also be sent in the JSON body for API/mobile clients.
 */
const generateToken = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  return token;
};

module.exports = generateToken;
