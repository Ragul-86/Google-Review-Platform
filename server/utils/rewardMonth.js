/* ── Reward month helpers ─────────────────────────────────────────
   Single source of truth for everything that touches the 'YYYY-MM'
   month key used by RewardConfig / RewardTransaction: parsing,
   formatting, current/past/future classification, and the
   clone-prior-month-tiers-into-new-month logic used by both the
   lazy on-read path (ensureMonthConfigs) and the monthly cron
   rollover job. */

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthToParts(month) {
  const [year, mon] = String(month).split('-').map(Number);
  return { year, month: mon };
}

function partsToMonth(year, month) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

// Returns the 'YYYY-MM' key immediately following `month`.
function nextMonthOf(month) {
  const { year, month: mon } = monthToParts(month);
  if (mon === 12) return partsToMonth(year + 1, 1);
  return partsToMonth(year, mon + 1);
}

// Returns the 'YYYY-MM' key immediately preceding `month`.
function prevMonthOf(month) {
  const { year, month: mon } = monthToParts(month);
  if (mon === 1) return partsToMonth(year - 1, 12);
  return partsToMonth(year, mon - 1);
}

function isCurrentMonth(month) {
  return month === currentMonth();
}

function isFutureMonth(month) {
  return month > currentMonth();
}

function isPastMonth(month) {
  return month < currentMonth();
}

function monthLabel(month) {
  const { year, month: mon } = monthToParts(month);
  if (!year || !mon || mon < 1 || mon > 12) return month;
  return `${MONTH_NAMES[mon - 1]} ${year}`;
}

/* Clone every reward-tier document a client has in `fromMonth` into
   `toMonth`, copying amount/totalCards/status verbatim and resetting
   only the per-month statistic (`claimed`, which in turn drives the
   derived `remaining`/`distributed` virtuals back down to 0/₹0).
   Idempotent: if `toMonth` already has any configs for this client,
   nothing is created and the existing docs are returned untouched —
   this is what makes it safe to call from both the cron job (every
   1st of the month) and the lazy on-read fallback, any number of
   times, without ever producing duplicate monthly records.
   `session` is optional — pass a Mongoose ClientSession to run the
   exists-check + insert atomically inside a transaction; omit it to
   run the same logic without one (standalone MongoDB deployments
   that don't support multi-document transactions). */
async function cloneMonthForClient(RewardConfig, clientId, fromMonth, toMonth, session) {
  const existingQuery = RewardConfig.find({ clientId, month: toMonth });
  if (session) existingQuery.session(session);
  const existing = await existingQuery;
  if (existing.length > 0) return { created: false, configs: existing };

  const priorQuery = RewardConfig.find({ clientId, month: fromMonth });
  if (session) priorQuery.session(session);
  const priorConfigs = await priorQuery;
  if (priorConfigs.length === 0) return { created: false, configs: [] };

  const docs = priorConfigs.map((c) => ({
    clientId,
    amount: c.amount,
    totalCards: c.totalCards, // carried forward — never reset
    claimed: 0,               // → remaining/distributed virtuals reset automatically
    status: c.status,
    month: toMonth,
  }));

  const cloned = await RewardConfig.insertMany(docs, session ? { session } : undefined);
  return { created: true, configs: cloned };
}

/* Lazy fallback used by read endpoints: if a client has no configs at
   all yet for `month`, look back to their most recent prior month
   (whatever it is — not necessarily the literal previous calendar
   month, in case a client skipped configuring for a while) and clone
   from there. No-op if the client has never configured anything, or
   already has configs for `month`. */
async function ensureMonthConfigs(RewardConfig, clientId, month) {
  const existing = await RewardConfig.find({ clientId, month });
  if (existing.length > 0) return existing;

  const latestPrior = await RewardConfig.findOne({ clientId, month: { $lt: month } }).sort({ month: -1 });
  if (!latestPrior) return [];

  const { configs } = await cloneMonthForClient(RewardConfig, clientId, latestPrior.month, month);
  return configs;
}

module.exports = {
  currentMonth,
  monthToParts,
  partsToMonth,
  nextMonthOf,
  prevMonthOf,
  isCurrentMonth,
  isFutureMonth,
  isPastMonth,
  monthLabel,
  cloneMonthForClient,
  ensureMonthConfigs,
};
