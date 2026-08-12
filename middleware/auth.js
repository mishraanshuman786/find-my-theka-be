const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'findmytheka-secret-key-2024';
const JWT_EXPIRES_IN = '7d';

function generateToken(user) {
  const payload = {
    userId: user.id,
    email: user.email,
    name: user.name
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return { error: 'Token expired' };
    }
    return { error: 'Invalid token' };
  }
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.'
    });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (decoded.error) {
    return res.status(401).json({
      success: false,
      message: decoded.error
    });
  }

  req.user = decoded;
  next();
}

// Optional auth - doesn't fail if no token
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded.error) {
      req.user = decoded;
    }
  }
  
  next();
}

module.exports = {
  generateToken,
  verifyToken,
  authMiddleware,
  optionalAuth,
  JWT_SECRET
};
