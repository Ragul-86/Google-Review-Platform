const mongoose = require('mongoose');

/* ── ReviewRequest ────────────────────────────────────────────────
   Created the instant a customer clicks "I've Submitted My Review"
   on the public review page (rating 4–5, after copying an AI review
   suggestion and opening Google). NOT a reward yet — just a record
   waiting for the client (business owner) to manually verify it.
   The client then Approves / Rejects, and only after Approving can
   they click "Send Scratch Card" (creates a RewardTransaction with a
   secure one-time token and opens WhatsApp Web — never automatic). */
const reviewRequestSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
    },

    customerName: { type: String, required: true, trim: true, maxlength: 150 },
    phone:        { type: String, required: true, trim: true, maxlength: 30 },
    email:        { type: String, default: '', trim: true, maxlength: 150 },

    rating:   { type: Number, required: true, min: 1, max: 5 },
    category: { type: String, default: '', trim: true, maxlength: 100 },

    reviewDate: { type: Date, default: Date.now },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },

    rewardTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RewardTransaction',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

reviewRequestSchema.index({ clientId: 1, createdAt: -1 });
reviewRequestSchema.index({ clientId: 1, status: 1 });

module.exports = mongoose.model('ReviewRequest', reviewRequestSchema);
