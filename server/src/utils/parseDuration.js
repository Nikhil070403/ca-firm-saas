const UNIT_MS = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

/**
 * Converts a short duration string like "15m", "7d", "1h" into milliseconds.
 * Deliberately hand-rolled instead of pulling in the `ms` package — this is
 * the only place it's needed.
 */
function parseDuration(input) {
  const match = /^(\d+)(s|m|h|d)$/.exec(String(input).trim());
  if (!match) throw new Error(`Invalid duration string: ${input}`);
  const [, amount, unit] = match;
  return Number(amount) * UNIT_MS[unit];
}

module.exports = parseDuration;
