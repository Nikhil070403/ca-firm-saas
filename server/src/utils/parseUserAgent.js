// Small heuristic UA parser — good enough for a human-readable "Chrome on
// Windows" session label, not meant to be exhaustive. Avoids pulling in a
// full ua-parser dependency for what is ultimately decorative text.
function parseUserAgent(userAgent) {
  if (!userAgent) return { browser: 'Unknown browser', os: 'Unknown device' };

  let browser = 'Unknown browser';
  if (/edg\//i.test(userAgent)) browser = 'Edge';
  else if (/chrome\//i.test(userAgent) && !/chromium/i.test(userAgent)) browser = 'Chrome';
  else if (/firefox\//i.test(userAgent)) browser = 'Firefox';
  else if (/safari\//i.test(userAgent) && !/chrome/i.test(userAgent)) browser = 'Safari';
  else if (/opr\//i.test(userAgent)) browser = 'Opera';

  let os = 'Unknown device';
  if (/windows/i.test(userAgent)) os = 'Windows';
  else if (/mac os x/i.test(userAgent)) os = 'macOS';
  else if (/android/i.test(userAgent)) os = 'Android';
  else if (/iphone|ipad/i.test(userAgent)) os = 'iOS';
  else if (/linux/i.test(userAgent)) os = 'Linux';

  return { browser, os, label: `${browser} on ${os}` };
}

module.exports = { parseUserAgent };
