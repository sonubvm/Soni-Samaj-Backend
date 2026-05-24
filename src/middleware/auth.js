const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getEffectivePermissions, hasPermission, isAdminRole } = require('../utils/permissions');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Not authorized. Token missing.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated.' });
    }

    user.effectivePermissions = getEffectivePermissions(user);
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Not authorized for this action.' });
  }
  next();
};

const requirePermission = (permission) => (req, res, next) => {
  if (!req.user || !hasPermission(req.user, permission)) {
    return res.status(403).json({
      success: false,
      message: `Permission denied. Required: ${permission}`,
    });
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.user || !isAdminRole(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  }
  next();
};

module.exports = { protect, authorize, requirePermission, requireAdmin };
