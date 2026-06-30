const asyncHandler = require('express-async-handler');
const Client            = require('../models/Client');
const Customer          = require('../models/Customer');
const RewardConfig      = require('../models/RewardConfig');
const RewardTransaction = require('../models/RewardTransaction');
const { currentMonth, ensureMonthConfigs } = require('../utils/rewardMonth');
const { calcValidUntil } = require('../utils/rewardExpiry');

function generateCouponCode(amount) {
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `GM${amount}-${rand}`;
}

/* ── Is the reward program live for this client right now? ───────
   Used by GET /api/public/client/:slug so the review page knows
   whether to show the scratch-card step at all (clients who haven't
   set up any reward tiers, or who've exhausted this month's cards,
   simply never see the extra step — no broken "claim" UI). */
async function hasActiveRewardProgram(clientId) {
  const month = currentMonth();
  let configs = await ensureMonthConfigs(RewardConfig, clientId, month);
  if (!configs.length) configs = await RewardConfig.find({ clientId, month });
  return configs.some((c) => c.status === 'active' && c.claimed < c.totalCards);
}

/* ── POST /api/rewards/claim   (PUBLIC — no auth) ──────────────────
   Body: { clientSlug, customerName, phone, customerId? }

   Picks a random reward tier (respecting each tier's remaining-card
   limit), atomically increments its claimed count so concurrent
   claims can never push a tier over its card limit, and logs a
   RewardTransaction with status "Pending".

   IMPORTANT: this endpoint NEVER sends a WhatsApp message. It only
   writes a Pending record to MongoDB. Sending is always a separate,
   manual action the client takes later from the Reward Management
   dashboard (the "Send WhatsApp" button, which just opens a
   wa.me link — see rewardController.js). */
const claimReward = asyncHandler(async (req, res) => {
  const { clientSlug, customerName, phone, customerId } = req.body;
  if (!clientSlug || !customerName?.trim() || !phone?.trim()) {
    res.status(400);
    throw new Error('clientSlug, customerName and phone are required');
  }

  const client = await Client.findOne({ slug: clientSlug, status: 'active' });
  if (!client) { res.status(404); throw new Error('Business not found'); }

  const month = currentMonth();
  await ensureMonthConfigs(RewardConfig, client._id, month);

  const eligible = await RewardConfig.find({
    clientId: client._id,
    month,
    status: 'active',
    $expr: { $lt: ['$claimed', '$totalCards'] },
  });

  if (eligible.length === 0) {
    return res.json({ success: false, message: 'No rewards available right now' });
  }

  // Random pick among eligible tiers. The atomic findOneAndUpdate guard
  // means if two customers claim at the same instant and race for the
  // last card in a tier, only one wins it — the loser simply tries the
  // next shuffled tier instead of double-claiming.
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
    return res.json({ success: false, message: 'No rewards available right now' });
  }

  let couponCode = generateCouponCode(won.amount);
  // eslint-disable-next-line no-await-in-loop
  while (await RewardTransaction.exists({ couponCode })) {
    couponCode = generateCouponCode(won.amount);
  }

  let resolvedCustomerId = null;
  if (customerId) {
    const cust = await Customer.findById(customerId).select('_id clientId');
    if (cust && String(cust.clientId) === String(client._id)) resolvedCustomerId = cust._id;
  }

  const wonDate = new Date();
  const transaction = await RewardTransaction.create({
    clientId: client._id,
    customerId: resolvedCustomerId,
    customerName: customerName.trim(),
    phone: phone.trim(),
    rewardAmount: won.amount,
    couponCode,
    reviewDate: wonDate,
    validUntil: calcValidUntil(wonDate), // 30 days from the moment it's won
    rewardStatus: 'pending',
    whatsappStatus: 'not_sent',
    month,
  });

  res.json({
    success: true,
    data: {
      rewardAmount: transaction.rewardAmount,
      couponCode: transaction.couponCode,
      validUntil: transaction.validUntil,
      businessName: client.businessName,
    },
  });
});

module.exports = { claimReward, hasActiveRewardProgram };
