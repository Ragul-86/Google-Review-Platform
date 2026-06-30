/* ── Reward month helpers ──────────────────────────────────────────
   Reward tiers (RewardConfig) are scoped per calendar month ("YYYY-MM").
   Instead of a cron job, the "1st of every month resets claimed to 0"
   requirement is satisfied lazily: the first time a client or customer
   touches a new month, ensureMonthConfigs() clones last month's tier
   definitions into fresh documents for the new month with claimed = 0.
   Every prior month's documents are left untouched — that IS the
   permanent history the spec asks to keep available. */

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

async function ensureMonthConfigs(RewardConfig, clientId, month) {
  const existing = await RewardConfig.find({ clientId, month });
  if (existing.length > 0) return existing;

  const latestPrior = await RewardConfig.findOne({ clientId, month: { $lt: month } }).sort({ month: -1 });
  if (!latestPrior) return [];

  const priorConfigs = await RewardConfig.find({ clientId, month: latestPrior.month });
  if (priorConfigs.length === 0) return [];

  const cloned = await RewardConfig.insertMany(
    priorConfigs.map((c) => ({
      clientId,
      amount: c.amount,
      totalCards: c.totalCards,
      claimed: 0,
      status: c.status,
      month,
    })),
  );
  return cloned;
}

module.exports = { currentMonth, ensureMonthConfigs };
