const User = require('../models/User');

const seedAdmin = async () => {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || 'Admin';

  if (!email || !password) return;

  const existing = await User.findOne({ email });
  if (existing) return;

  await User.create({
    name,
    email,
    password,
    role: 'superadmin',
  });

  console.log(`Default admin created: ${email}`);
};

module.exports = seedAdmin;
