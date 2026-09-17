const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { authenticator } = require('otplib');
const QRCode = require('qrcode');

const ISSUER = 'CA Firm SaaS';
const BACKUP_CODE_COUNT = 8;

function generateSecret() {
  return authenticator.generateSecret();
}

async function generateQrCode(email, secret) {
  const uri = authenticator.keyuri(email, ISSUER, secret);
  return QRCode.toDataURL(uri);
}

function verifyToken(token, secret) {
  if (typeof token !== 'string' || !/^\d{6}$/.test(token)) return false;
  try {
    return authenticator.check(token, secret);
  } catch {
    return false;
  }
}

// Backup codes are shown to the user exactly once (at enable time) — only
// their bcrypt hashes are ever persisted, same treatment as passwords.
function generateBackupCodes() {
  const codes = Array.from({ length: BACKUP_CODE_COUNT }, () => (
    crypto.randomBytes(5).toString('hex').toUpperCase().match(/.{1,5}/g).join('-')
  ));
  return codes;
}

async function hashBackupCodes(codes) {
  return Promise.all(codes.map((code) => bcrypt.hash(code, 10)));
}

// Returns the index of the matching hash (so the caller can remove it —
// each backup code is single-use) or -1 if none matched.
async function matchBackupCode(code, hashes) {
  for (let i = 0; i < hashes.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    if (await bcrypt.compare(code, hashes[i])) return i;
  }
  return -1;
}

module.exports = {
  generateSecret,
  generateQrCode,
  verifyToken,
  generateBackupCodes,
  hashBackupCodes,
  matchBackupCode,
};
