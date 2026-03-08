import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

export function encryptBuffer(data: Buffer, key: Buffer): Buffer {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Layout: [IV (12)] [AuthTag (16)] [Ciphertext]
  return Buffer.concat([iv, authTag, encrypted]);
}

export function decryptBuffer(data: Buffer, key: Buffer): Buffer {
  const iv = data.subarray(0, IV_LENGTH);
  const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

export function getEncryptionKey(keyHex: string): Buffer {
  if (!keyHex || keyHex.length !== 64) {
    throw new Error('FILE_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
  }
  return Buffer.from(keyHex, 'hex');
}
