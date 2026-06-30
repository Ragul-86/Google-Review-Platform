const mongoose = require('mongoose');

/* ── RewardTransaction ───────────────────────────────────────────
   One document per scratch-card win. Created the instant a customer
   claims a reward (status starts "pending"). GETMORE never sends
   WhatsApp automatically — whatsappStatus only moves forward when the
   *client* manually clicks "Send WhatsApp" (→ opened) / "Mark as Sent"
   (→ sent) from the Reward Management dashboard. */
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

    rewardAmount: { type: Number, required: true },
    couponCode:   { type: String, required: true, unique: true, trim: true },

    reviewDate: { type: Date, default: Date.now },
    validUntil: { type: Date, default: null },

    rewardStatus: {
      type: String,
      enum: ['pending', 'sent', 'redeemed', 'expired'],
      default: 'pending',
    },
    whatsappStatus: {
      type: String,
      enum: ['not_sent', 'opened', 'sent'],
      default: 'not_sent',
    },

    month: { type: String, required: true, index: true }, // 'YYYY-MM' at time of claim
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
