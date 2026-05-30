const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const familyRoutes = require('./routes/familyRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const userRoutes = require('./routes/userRoutes');
const errorHandler = require('./middleware/errorHandler');
const User = require('./models/User');
const ensureFamilyIndexes = require('./utils/ensureFamilyIndexes');

const app = express();
const PORT = process.env.PORT || 5000;

const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:3001')
  .split(',')
  .map((origin) => origin.trim());

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Soni Samaj Uttarbhartiya Trust Surat API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/families', familyRoutes);

app.use(errorHandler);

const seedFirstAdmin = async () => {
  const userCount = await User.countDocuments();
  if (userCount > 0) {
    console.log(`Users in database: ${userCount} (login uses DB credentials only)`);
    return;
  }

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || 'Super Admin';

  if (!email || !password) {
    console.warn(
      'No users in database. Set ADMIN_EMAIL and ADMIN_PASSWORD in .env to create the first admin, ' +
        'or create a user via MongoDB / POST /api/auth/register (only when DB is empty).'
    );
    return;
  }

  if (password.length < 6) {
    console.error('ADMIN_PASSWORD must be at least 6 characters.');
    return;
  }

  await User.create({ name, email, password, role: 'superadmin' });
  console.log(`First admin created from .env: ${email}`);
};

const startServer = async () => {
  try {
    await connectDB();
    await ensureFamilyIndexes();
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is required in .env');
    }
    await seedFirstAdmin();
    const { isCloudinaryConfigured } = require('./config/cloudinary');
    if (!isCloudinaryConfigured()) {
      console.warn(
        'Cloudinary is not configured — photo upload (POST /api/upload) will return 503. ' +
          'Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend/.env'
      );
    }
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
