/* ── RETIRED ───────────────────────────────────────────────────────
   The ReviewRequest approval-queue flow (customer clicks "I've
   Submitted My Review" → Pending Verification → client Approves →
   Send Scratch Card) has been replaced by the FINAL Customer Reward
   Workflow: the customer shows their submitted Google Review to the
   business owner in person, and the owner creates the Scratch Card
   directly from Reward Management (see controllers/rewardController.js
   → createTransaction). This file is no longer required or mounted
   anywhere — kept only as a no-op stub in case anything still
   references the old module path. */
module.exports = {};
