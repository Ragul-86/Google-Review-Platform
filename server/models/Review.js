const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
    },
    customerName: { type: String, trim: true, maxlength: 120, default: '' },
    rating: { type: Number, min: 1, max: 5, required: true },
    reviewText: { type: String, trim: true, maxlength: 2000, default: '' },
    categoryLabel: { type: String, trim: true, maxlength: 120, default: '' },
    source: {
      type: String,
      enum: ['google', 'direct', 'qr', 'manual'],
      default: 'direct',
    },
    type: {
      type: String,
      enum: ['positive', 'negative'],
      required: true,
    },
    qrCodeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QRCode',
      default: null,
    },
    // For positive reviews (AI-generated suggestions)
    selectedSuggestion: { type: String, maxlength: 2000, default: '' },
    // For negative reviews
    customerEmail: { type: String, trim: true, lowercase: true, default: '' },
    customerPhone: { type: String, trim: true, default: '' },
    message: { type: String, maxlength: 2000, default: '' },
  },
  { timestamps: true }
);

reviewSchema.index({ clientId: 1, createdAt: -1 });
reviewSchema.index({ clientId: 1, type: 1 });

module.exports = mongoose.model('Review', reviewSchema);
