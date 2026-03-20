// AES-256-GCM encryption for stored credentials
const crypto = require('crypto');

const SERVER_SECRET = process.env.ENCRYPTION_SECRET || 'benchbuddies-dev-secret-change-in-production';

function deriveKey(userId) {
  return crypto.pbkdf2Sync(
    SERVER_SECRET,
    `user-${userId}-salt`,
    100000,
    32,
    'sha512'
  );
}

function encrypt(plaintext, userId) {
  const key = deriveKey(userId);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return {
    encrypted: encrypted + ':' + authTag,
    iv: iv.toString('hex'),
  };
}

function decrypt(ciphertext, iv, userId) {
  const key = deriveKey(userId);
  const [encryptedData, authTag] = ciphertext.split(':');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));

  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

module.exports = { encrypt, decrypt };
