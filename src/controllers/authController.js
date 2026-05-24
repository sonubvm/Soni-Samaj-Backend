const User = require('../models/User');
const { generateToken, formatUserResponse } = require('../utils/generateToken');

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const adminCount = await User.countDocuments();

    if (adminCount > 0) {
      return res.status(403).json({
        success: false,
        message: 'Admin registration is disabled. Use login or seed admin.',
      });
    }

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
    }

    const user = await User.create({ name, email, password, role: 'superadmin' });
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      data: {
        user: formatUserResponse(user),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact admin.' });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      data: {
        user: formatUserResponse(user),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res) => {
  res.json({
    success: true,
    data: {
      user: formatUserResponse(req.user),
    },
  });
};

module.exports = { register, login, getMe };
