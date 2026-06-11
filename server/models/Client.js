const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema(
  {
    businessName: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    businessLogo: { type: String, default: null },
    businessCategory: { type: String, trim: true, maxlength: 120 },
    googleReviewLink: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    address: { type: String, trim: true, maxlength: 500, default: '' },
    phone: { type: String, trim: true, maxlength: 30, default: '' },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
      default: '',
    },
    website: { type: String, trim: true, maxlength: 300, default: '' },
    subscriptionPlan: {
      type: String,
      enum: ['free', 'starter', 'pro', 'enterprise'],
      default: 'free',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Client', clientSchema);
