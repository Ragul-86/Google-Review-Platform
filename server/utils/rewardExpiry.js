const RewardTransaction = require('../models/RewardTransaction');

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/* ── calcValidUntil ──────────────────────────────────────────────
   Every scratch-card reward is valid for exactly 30 days from the
   moment it is won. Example: won 01 July 2026 → expires 31 July 2026. */
function calcValidUntil(wonDate = new Date()) {
  return new Date(wonDate.getTime() + THIRTY_DAYS_MS);
}

/* ── expireOverdueRewards ────────────────────────────────────────
   Bulk-flips any Pending/Sent reward whose 30-day window has passed
   to Expired. Cheap, idempotent, safe to call as often as we like —
   used both by the daily sweep in server.js and lazily before every
   read of the rewards list so the dashboard is always accurate even
   between sweeps. Expired rewards are terminal: they are never
   redeemable or sendable again. */
async function expireOverdueRewards(filter = {}) {
  return RewardTransaction.updateMany(
    {
      ...filter,
      rewardStatus: { $in: ['pending', 'sent', 'scratched'] },
      // validUntil is null until the customer actually scratches — guard
      // against the BSON rule where null sorts below Date, which would
      // otherwise make $lt match every not-yet-scratched transaction too.
      validUntil: { $ne: null, $lt: new Date() },
    },
    { $set: { rewardStatus: 'expired' } },
  );
}

/* ── applyLazyExpiry ─────────────────────────────────────────────
   Single-document version for action endpoints (mark sent, send
   WhatsApp, change status) — flips + saves this one reward to
   Expired if it's overdue, then reports back whether it's expired
   so the caller can reject the action. */
async function applyLazyExpiry(reward) {
  if (
    ['pending', 'sent', 'scratched'].includes(reward.rewardStatus)
    && reward.validUntil
    && reward.validUntil < new Date()
  ) {
    reward.rewardStatus = 'expired';
    await reward.save();
  }
  return reward.rewardStatus === 'expired';
}

module.exports = { calcValidUntil, expireOverdueRewards, applyLazyExpiry };
