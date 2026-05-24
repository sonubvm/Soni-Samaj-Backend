const jwt = require('jsonwebtoken');
const { getEffectivePermissions } = require('./permissions');

const generateToken = (user) => {
  const permissions = getEffectivePermissions(user);
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      permissions,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

const formatUserResponse = (user) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  role: user.role,
  permissions: getEffectivePermissions(user),
  customPermissions: user.permissions || [],
  isActive: user.isActive,
});

module.exports = { generateToken, formatUserResponse };
