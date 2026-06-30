const crypto = require('crypto');

/* ── Secure scratch-card token ───────────────────────────────────
   Generates a short, URL-safe, human-typeable token for the public
   reward link, e.g. https://getmore.app/reward/ABCD123XYZ
   Alphabet excludes 0/O and 1/I to avoid visual ambiguity. Built on
   crypto.randomBytes so it is unpredictable (not Math.random). */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateToken(length = 10) {
  const bytes = crypto.randomBytes(length);
  let token = '';
  for (let i = 0; i < length; i += 1) {
    token += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return token;
}

/* Keeps generating until it finds a token not already used by Model
   (default RewardTransaction, but kept generic to avoid a circular
   require). Pass the model in to avoid importing it here. */
async function generateUniqueToken(Model, field = 'token', length = 10, maxAttempts = 10) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const token = generateToken(length);
    // eslint-disable-next-line no-await-in-loop
    const exists = await Model.exists({ [field]: token });
    if (!exists) return token;
  }
  throw new Error('Could not generate a unique token, please try again.');
}

module.exports = { generateToken, generateUniqueToken };
