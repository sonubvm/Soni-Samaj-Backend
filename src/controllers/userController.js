const User = require('../models/User');
const { ALL_PERMISSIONS } = require('../utils/permissions');
const { formatUserResponse } = require('../utils/generateToken');

const listUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({
      success: true,
      data: users.map(formatUserResponse),
    });
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const { role, permissions } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    if (!['admin', 'manager', 'assistant'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be admin, manager, or assistant.',
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already in use.' });
    }

    const customPerms = Array.isArray(permissions)
      ? permissions.filter((p) => ALL_PERMISSIONS.includes(p))
      : [];

    const user = await User.create({
      name,
      email,
      password,
      role,
      permissions: customPerms,
    });

    res.status(201).json({ success: true, data: formatUserResponse(user) });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.role === 'superadmin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Cannot modify superadmin account.' });
    }

    const { name, role, permissions, isActive, password } = req.body;

    if (name !== undefined) user.name = name;
    if (role !== undefined) {
      if (!['admin', 'manager', 'assistant'].includes(role)) {
        return res.status(400).json({ success: false, message: 'Invalid role.' });
      }
      if (user.role === 'superadmin') {
        return res.status(403).json({ success: false, message: 'Cannot change superadmin role.' });
      }
      user.role = role;
    }
    if (permissions !== undefined) {
      user.permissions = Array.isArray(permissions)
        ? permissions.filter((p) => ALL_PERMISSIONS.includes(p))
        : [];
    }
    if (isActive !== undefined) {
      if (String(user._id) === String(req.user._id) && isActive === false) {
        return res.status(400).json({ success: false, message: 'Cannot deactivate your own account.' });
      }
      user.isActive = isActive;
    }
    if (password) {
      user.password = password;
    }

    await user.save();

    res.json({ success: true, data: formatUserResponse(user) });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.role === 'superadmin') {
      return res.status(403).json({ success: false, message: 'Cannot deactivate superadmin account.' });
    }

    if (String(user._id) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: 'Cannot deactivate your own account.' });
    }

    user.isActive = false;
    await user.save();

    res.json({ success: true, message: 'User deactivated successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { listUsers, createUser, updateUser, deleteUser };
