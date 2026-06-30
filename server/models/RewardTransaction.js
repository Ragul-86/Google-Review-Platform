const mongoose = require('mongoose');

/* ── RewardTransaction ───────────────────────────────────────────
   One document per scratch-card link. Created the instant the
   business owner clicks "Create Scratch Card" in Reward Management
   after manually verifying the customer's Google Review in person
   (status starts "pending" — the secure token already exists, but
   the reward itself is NOT chosen yet). The actual reward + coupon
   code are only assigned once the customer opens the link and
   scratches (isScratched flips true, scratchedAt stamped, status →
   "scratched"). GETMORE never sends WhatsApp automatically — the
   owner always manually presses Send inside WhatsApp Web after
   clicking "Send WhatsApp" on this record. */
const rewardTransactionSchema = new mongoose.Schema(
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

    // Secure, unique, one-time-use link token — e.g. /reward/ABCD123XYZ
    token: { type: String, required: true, unique: true, trim: true, index: true },

    // Unknown until the customer actually scratches — assigned at that moment.
    rewardAmount: { type: Number, default: null },
    couponCode:   { type: String, default: null, trim: true, unique: true, sparse: true },

    isScratched: { type: Boolean, default: false },
    scratchedAt: { type: Date, default: null },

    // Stamped by updateRewardStatus the instant the owner confirms, in the
    // "Mark Reward as Redeemed" dialog, that the customer has used the coupon.
    redeemedAt: { type: Date, default: null },

    reviewDate: { type: Date, default: Date.now },
    validUntil: { type: Date, default: null }, // set only once scratched (scratchedAt + 30 days)

    rewardStatus: {
      type: String,
      enum: ['pending', 'sent', 'scratched', 'redeemed', 'expired'],
      default: 'pending',
    },
    whatsappStatus: {
      type: String,
      enum: ['not_sent', 'opened', 'sent'],
      default: 'not_sent',
    },

    month: { type: String, required: true, index: true }, // 'YYYY-MM' tier pool the win drew from
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

rewardTransactionSchema.index({ clientId: 1, createdAt: -1 });
rewardTransactionSchema.index({ clientId: 1, rewardStatus: 1 });
rewardTransactionSchema.index({ clientId: 1, validUntil: 1 });

/* ── daysRemaining (virtual) ──────────────────────────────────────
   Whole days between today and validUntil (date-only, ignoring time
   of day) so "18 Days" reads the same all day long. Always 0 once a
   reward has actually expired — never negative. Computed on read, so
   it stays correct without any write/cron touching this document. */
rewardTransactionSchema.virtual('daysRemaining').get(function () {
  if (this.rewardStatus === 'expired' || !this.validUntil) return 0;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const expiry = new Date(this.validUntil); expiry.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((expiry - today) / 86400000));
});

module.exports = mongoose.model('RewardTransaction', rewardTransactionSchema);
