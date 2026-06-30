const mongoose = require('mongoose');
const RewardConfig = require('../models/RewardConfig');
const { currentMonth, prevMonthOf, cloneMonthForClient } = require('../utils/rewardMonth');

/* ── Automatic Monthly Scratch Card Rollover ──────────────────────
   Runs at 00:00 on the 1st of every month (server time), and once
   more at boot as a catch-up in case the server was offline exactly
   at midnight. For every client who has ever configured a reward
   program, it copies their reward tiers (amount/totalCards/status)
   from the previous month into the new month with claimed reset to
   0 — never touching, deleting, or mutating any prior month's
   documents. Per-client work is isolated in its own try/catch and,
   where the MongoDB deployment supports it, its own transaction, so
   one client's failure can never affect another client's rollover
   and a half-finished rollover for one client can never leave their
   data partially written. Idempotent: re-running for a month that's
   already been rolled over is always a safe no-op. */

function isTransactionsUnsupportedError(err) {
  const msg = String((err && err.message) || '');
  return /Transaction numbers are only allowed|IllegalOperation|replica set|transactions are not supported/i.test(msg);
}

async function rollOneClient(clientId, fromMonth, targetMonth) {
  const session = await mongoose.startSession();
  try {
    let result;
    try {
      await session.withTransaction(async () => {
        result = await cloneMonthForClient(RewardConfig, clientId, fromMonth, targetMonth, session);
      });
    } catch (txErr) {
      if (!isTransactionsUnsupportedError(txErr)) throw txErr;
      // Standalone MongoDB (no replica set) — transactions aren't available.
      // Fall back to the same idempotent clone logic without a session.
      result = await cloneMonthForClient(RewardConfig, clientId, fromMonth, targetMonth);
    }
    return result;
  } finally {
    await session.endSession();
  }
}

/**
 * Roll every client forward into `targetMonth` (defaults to the
 * current server month). Safe to call repeatedly — clients who
 * already have configs for `targetMonth` are skipped, and clients
 * with no configs at all in `fromMonth` (e.g. never configured, or
 * configured further in the past) are skipped here too; the existing
 * lazy `ensureMonthConfigs` read-path still covers them whenever they
 * next load their dashboard.
 */
async function runMonthlyRollover(targetMonth = currentMonth()) {
  const fromMonth = prevMonthOf(targetMonth);
  const startedAt = Date.now();
  const clientIds = await RewardConfig.distinct('clientId', { month: fromMonth });

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const clientId of clientIds) {
    try {
      const result = await rollOneClient(clientId, fromMonth, targetMonth);
      if (result.created) created++;
      else skipped++;
    } catch (err) {
      failed++;
      console.error(`[monthlyRewardRollover] Client ${clientId} rollover failed (${fromMonth} → ${targetMonth}):`, err.message);
    }
  }

  const summary = {
    targetMonth,
    fromMonth,
    totalClients: clientIds.length,
    created,
    skipped,
    failed,
    durationMs: Date.now() - startedAt,
  };

  console.log(
    `[monthlyRewardRollover] ${fromMonth} → ${targetMonth}: ` +
    `${created} created, ${skipped} already existed, ${failed} failed ` +
    `(${clientIds.length} clients, ${summary.durationMs}ms)`,
  );

  return summary;
}

module.exports = { runMonthlyRollover };
