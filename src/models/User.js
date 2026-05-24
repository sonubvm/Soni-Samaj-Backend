const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ALL_PERMISSIONS } = require('../utils/permissions');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: {
      type: String,
      enum: ['admin', 'superadmin', 'manager', 'assistant'],
      default: 'assistant',
    },
    permissions: {
      type: [String],
      default: [],
      validate: {
        validator: (perms) => perms.every((p) => ALL_PERMISSIONS.includes(p)),
        message: 'Invalid permission value.',
      },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
