const asyncHandler = require('express-async-handler');
const Client = require('../models/Client');
const RewardConfig = require('../models/RewardConfig');
const RewardTransaction = require('../models/RewardTransaction');
const { currentMonth, ensureMonthConfigs } = require('../utils/rewardMonth');
const { calcValidUntil, applyLazyExpiry } = require('../utils/rewardExpiry');

function generateCouponCode(amount) {
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `GM${amount}-${rand}`;
}

/* ── GET /api/public/reward/:token   (PUBLIC — no auth) ─────────────
   Read-only lookup the Scratch Card page calls on load to decide what
   to show: the scratch animation (first visit), the static reward
   details (already scratched), or an expired/invalid state. Never
   mutates anything except the lazy expiry sweep on this one document. */
const getRewardByToken = asyncHandler(async (req, res) => {
  const reward = await RewardTransaction.findOne({ token: req.params.token });
  if (!reward) { res.status(404); throw new Error('Invalid or unknown reward link'); }

  await applyLazyExpiry(reward);

  const client = await Client.findById(reward.clientId).select('businessName');

  res.json({
    success: true,
    data: {
      token: reward.token,
      customerName: reward.customerName,
      businessName: client?.businessName || '',
      isScratched: reward.isScratched,
      rewardStatus: reward.rewardStatus,
      rewardAmount: reward.rewardAmount,
      couponCode: reward.couponCode,
      scratchedAt: reward.scratchedAt,
      validUntil: reward.validUntil,
      daysRemaining: reward.daysRemaining,
    },
  });
});

/* ── POST /api/public/reward/:token/scratch   (PUBLIC — no auth) ────
   The ONE-TIME reveal. Picks a random reward tier (respecting each
   tier's remaining-card limit) for the CURRENT month — resolved now,
   not when the link was sent, so a link opened in a new month draws
   from that month's freshly-reset pool. Atomically increments the
   winning tier's claimed count so concurrent scratches can never push
   a tier over its card limit.

   Strict one-time-use: once isScratched is true, this endpoint refuses
   to run again — the customer (or anyone replaying the link) only ever
   sees the same already-revealed reward via GET above. */
const scratchReward = asyncHandler(async (req, res) => {
  const reward = await RewardTransaction.findOne({ token: req.params.token });
  if (!reward) { res.status(404); throw new Error('Invalid or unknown reward link'); }

  if (await applyLazyExpiry(reward)) {
    res.status(400); throw new Error('This reward has expired and can no longer be opened.');
  }
  if (reward.isScratched) {
    res.status(400); throw new Error('This reward has already been revealed.');
  }

  const month = currentMonth();
  await ensureMonthConfigs(RewardConfig, reward.clientId, month);

  const eligible = await RewardConfig.find({
    clientId: reward.clientId,
    month,
    status: 'active',
    $expr: { $lt: ['$claimed', '$totalCards'] },
  });

  if (eligible.length === 0) {
    return res.json({ success: false, message: 'No rewards are available right now — please contact the business.' });
  }

  // Random pick among eligible tiers; atomic findOneAndUpdate guard means
  // two customers scratching at the same instant can never both win the
  // last card in a tier — the loser just tries the next shuffled tier.
  const shuffled = [...eligible].sort(() => Math.random() - 0.5);
  let won = null;
  for (const tier of shuffled) {
    // eslint-disable-next-line no-await-in-loop
    const updated = await RewardConfig.findOneAndUpdate(
      { _id: tier._id, $expr: { $lt: ['$claimed', '$totalCards'] } },
      { $inc: { claimed: 1 } },
      { new: true },
    );
    if (updated) { won = updated; break; }
  }

  if (!won) {
    return res.json({ success: false, message: 'No rewards are available right now — please contact the business.' });
  }

  let couponCode = generateCouponCode(won.amount);
  // eslint-disable-next-line no-await-in-loop
  while (await RewardTransaction.exists({ couponCode })) {
    couponCode = generateCouponCode(won.amount);
  }

  const scratchedAt = new Date();
  reward.rewardAmount = won.amount;
  reward.couponCode = couponCode;
  reward.isScratched = true;
  reward.scratchedAt = scratchedAt;
  reward.validUntil = calcValidUntil(scratchedAt);
  reward.rewardStatus = 'scratched';
  reward.month = month;
  await reward.save();

  const client = await Client.findById(reward.clientId).select('businessName');

  res.json({
    success: true,
    data: {
      rewardAmount: reward.rewardAmount,
      couponCode: reward.couponCode,
      validUntil: reward.validUntil,
      daysRemaining: reward.daysRemaining,
      businessName: client?.businessName || '',
    },
  });
});

module.exports = { getRewardByToken, scratchReward };
