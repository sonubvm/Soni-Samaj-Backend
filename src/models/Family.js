const mongoose = require('mongoose');

const parentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    occupation: { type: String, default: '', trim: true },
    income: { type: Number, default: 0, min: 0 },
    education: { type: String, default: '', trim: true },
    mobile: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const coResidentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    relation: { type: String, default: '', trim: true },
    age: { type: Number, min: 0 },
    occupation: { type: String, default: '', trim: true },
    mobile: { type: String, default: '', trim: true },
  },
  { _id: true }
);

const childSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], default: 'Male' },
    dob: { type: Date },
    studentType: { type: String, enum: ['School', 'College'], default: 'School' },
    school: {
      name: { type: String, default: '', trim: true },
      medium: { type: String, enum: ['Hindi', 'English', 'Gujarati', 'Other'], default: 'Hindi' },
      board: { type: String, default: '', trim: true },
    },
    course: { type: String, default: '', trim: true },
    currentStd: { type: String, default: '', trim: true },
    passOutYear: { type: Number, min: 1950, max: 2100 },
    percentage: { type: Number, min: 0, max: 100 },
    isStudying: { type: Boolean, default: true },
  },
  { _id: true }
);

const familySchema = new mongoose.Schema(
  {
    headOfFamily: {
      name: { type: String, required: true, trim: true },
      mobile: { type: String, required: true, trim: true },
      email: { type: String, default: '', trim: true, lowercase: true },
    },
    address: {
      houseNo: { type: String, default: '', trim: true },
      street: { type: String, default: '', trim: true },
      village: { type: String, default: '', trim: true },
      city: { type: String, required: true, trim: true },
      district: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      pincode: { type: String, required: true, trim: true },
    },
    parents: {
      father: { type: parentSchema, required: true },
      mother: { type: parentSchema, required: true },
    },
    coResidents: [coResidentSchema],
    children: [childSchema],
    totalFamilyIncome: { type: Number, default: 0, min: 0 },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

// Unique only among active (non-deleted) families — deleted mobiles can register again
familySchema.index(
  { 'headOfFamily.mobile': 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);
familySchema.index({ 'headOfFamily.name': 'text', 'headOfFamily.mobile': 'text', 'address.city': 'text', 'address.district': 'text' });
familySchema.index({ 'address.district': 1, 'address.city': 1, 'address.state': 1 });
familySchema.index({ totalFamilyIncome: 1 });
familySchema.index({ createdAt: -1 });
familySchema.index({ deletedAt: 1 });

module.exports = mongoose.model('Family', familySchema);
