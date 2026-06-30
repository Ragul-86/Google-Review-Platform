const mongoose = require('mongoose');

/* ── RewardConfig ────────────────────────────────────────────────
   One document per reward tier, per client, per month.
   e.g. { amount: 20, totalCards: 50, claimed: 12, month: '2026-07' }
   "remaining" is a virtual (totalCards - claimed) so it's always
   derived, never stored/out-of-sync. */
const rewardConfigSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    amount:     { type: Number, required: true, min: 0 },
    // min 0 (not 1) so "Generate Reward Tiers" can create a tier shell
    // before the client has typed in a card count for it yet.
    totalCards: { type: Number, required: true, min: 0, default: 0 },
    claimed:    { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    month: { type: String, required: true, trim: true }, // 'YYYY-MM' — canonical key, drives all queries
    // Denormalized from `month` for the Monthly Scratch Card Management
    // spec (explicit "Reward Month" / "Reward Year" fields) — handy for
    // sorting/filtering without parsing the string. Always kept in sync
    // by the pre-validate hook below; never set directly.
    rewardMonth: { type: Number, min: 1, max: 12 },
    rewardYear:  { type: Number, min: 2000 },
  },
  { timestamps: true },
);

rewardConfigSchema.index({ clientId: 1, month: 1, amount: 1 });
rewardConfigSchema.index({ clientId: 1, rewardYear: 1, rewardMonth: 1 });

rewardConfigSchema.pre('validate', function (next) {
  if (this.month && /^\d{4}-\d{2}$/.test(this.month)) {
    const [year, monthNum] = this.month.split('-').map(Number);
    this.rewardYear = year;
    this.rewardMonth = monthNum;
  }
  next();
});

rewardConfigSchema.virtual('remaining').get(function () {
  return Math.max(this.totalCards - this.claimed, 0);
});

rewardConfigSchema.set('toJSON', { virtuals: true });
rewardConfigSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('RewardConfig', rewardConfigSchema);
