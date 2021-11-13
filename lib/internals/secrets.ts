import { createCipheriv, createDecipheriv } from 'crypto';

/**
 * Encrypts a secret using AES256
 * @param secret secret to encrypt
 * @returns encrypted value
 */
export function encryptSecret(secret: string) {
  const cipher = createCipheriv('aes256', process.env.SECRETS_KEY, process.env.SECRETS_IV);
  return cipher.update(secret, 'utf-8', 'hex') + cipher.final('hex');
}

/**
 * Decrypts a secret using AES256
 * @param secret encrypted secret
 * @returns decrypted value
 */
export function decryptSecret(secret: string) {
  const decipher = createDecipheriv('aes256', process.env.SECRETS_KEY, process.env.SECRETS_IV);
  const decrypted = decipher.update(secret, 'hex', 'utf-8') + decipher.final('utf-8');
  return decrypted.toString();
}
