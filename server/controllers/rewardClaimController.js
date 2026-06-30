const RewardConfig = require('../models/RewardConfig');
const { currentMonth, ensureMonthConfigs } = require('../utils/rewardMonth');

/* ── Is the reward program live for this client right now? ───────
   Used by GET /api/public/client/:slug so the review page knows
   whether to show the "I've Submitted My Review" step at all
   (clients who haven't set up any reward tiers, or who've exhausted
   this month's cards, simply never see the extra step). */
async function hasActiveRewardProgram(clientId) {
  const month = currentMonth();
  let configs = await ensureMonthConfigs(RewardConfig, clientId, month);
  if (!configs.length) configs = await RewardConfig.find({ clientId, month });
  return configs.some((c) => c.status === 'active' && c.claimed < c.totalCards);
}

module.exports = { hasActiveRewardProgram };
