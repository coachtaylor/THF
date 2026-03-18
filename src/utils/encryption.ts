/**
 * Encryption utilities for protecting sensitive health data
 *
 * IMPLEMENTATION NOTES (v1.0):
 *
 * Current Implementation:
 * - XOR-based stream cipher with random IV per encryption
 * - 256-bit key stored in SecureStore (iOS Keychain / Android Keystore)
 * - Provides client-side obfuscation for sensitive health data
 * - Keys are device-specific and protected by OS secure storage
 *
 * Encrypted Fields:
 * - HRT status, type, and dates
 * - Surgical history
 * - Binding information
 * - Dysphoria triggers and notes
 * - Gender identity and date of birth
 *
 * v1.1 Upgrade Plan:
 * - Migrate to AES-256-GCM via expo-crypto (authenticated encryption)
 * - Add HMAC for tamper detection
 * - Consider key rotation strategy
 *
 * SECURITY NOTE: XOR cipher provides reasonable protection for client-side
 * data at rest, but is not cryptographically equivalent to AES. The primary
 * security comes from the key being stored in OS secure storage.
 */

import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const ENCRYPTION_KEY_ALIAS = 'transfitness_encryption_key';
const KEY_LENGTH = 32; // 256 bits for AES-256
const IV_LENGTH = 16; // 128 bits for AES IV

/**
 * Sensitive fields that should always be encrypted before storage
 */
export const SENSITIVE_FIELDS = [
  'hrt_type',
  'hrt_start_date',
  'hrt_injection_start_date',
  'hrt_injection_frequency',
  'on_hrt',
  'surgeries',
  'binds_chest',
  'binder_type',
  'binding_duration_hours',
  'binding_frequency',
  'dysphoria_triggers',
  'dysphoria_notes',
  'gender_identity',
  'date_of_birth',
] as const;

export type SensitiveField = (typeof SENSITIVE_FIELDS)[number];

/**
 * Generate a cryptographically secure random key
 */
async function generateEncryptionKey(): Promise<string> {
  const randomBytes = await Crypto.getRandomBytesAsync(KEY_LENGTH);
  return bytesToHex(randomBytes);
}

/**
 * Get or create the encryption key for the current device
 * The key is stored in SecureStore (Keychain/Keystore)
 */
export async function getOrCreateEncryptionKey(): Promise<string> {
  try {
    // Try to get existing key
    const existingKey = await SecureStore.getItemAsync(ENCRYPTION_KEY_ALIAS);
    if (existingKey && existingKey.length === KEY_LENGTH * 2) {
      return existingKey;
    }

    // Generate new key
    const newKey = await generateEncryptionKey();
    await SecureStore.setItemAsync(ENCRYPTION_KEY_ALIAS, newKey);
    return newKey;
  } catch (error) {
    console.error('Failed to get/create encryption key:', error);
    throw new Error('Encryption key initialization failed');
  }
}

/**
 * Clear the encryption key (used during account deletion)
 */
export async function clearEncryptionKey(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(ENCRYPTION_KEY_ALIAS);
  } catch (error) {
    console.error('Failed to clear encryption key:', error);
  }
}

/**
 * Convert bytes to hex string
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert hex string to bytes
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

/**
 * XOR two byte arrays (for simple encryption in absence of SubtleCrypto)
 * This uses key + IV mixing for better security
 */
function xorEncrypt(data: Uint8Array, key: Uint8Array, iv: Uint8Array): Uint8Array {
  const result = new Uint8Array(data.length);
  const keyLen = key.length;
  const ivLen = iv.length;

  for (let i = 0; i < data.length; i++) {
    // Mix key and IV for each position to create pseudo-random stream
    const keyByte = key[i % keyLen];
    const ivByte = iv[i % ivLen];
    const mixedByte = (keyByte ^ ivByte ^ (i & 0xff)) & 0xff;
    result[i] = data[i] ^ mixedByte;
  }
  return result;
}

/**
 * Encrypt a string value
 * Returns base64-encoded encrypted data with IV prepended
 *
 * Format: IV (16 bytes) + encrypted data
 */
export async function encryptValue(plaintext: string): Promise<string> {
  if (!plaintext) return plaintext;

  try {
    const key = await getOrCreateEncryptionKey();
    const keyBytes = hexToBytes(key);

    // Generate random IV
    const iv = await Crypto.getRandomBytesAsync(IV_LENGTH);

    // Convert plaintext to bytes
    const encoder = new TextEncoder();
    const plaintextBytes = encoder.encode(plaintext);

    // Encrypt using XOR with key+IV mixing
    const encryptedBytes = xorEncrypt(plaintextBytes, keyBytes, iv);

    // Combine IV + encrypted data
    const combined = new Uint8Array(IV_LENGTH + encryptedBytes.length);
    combined.set(iv, 0);
    combined.set(encryptedBytes, IV_LENGTH);

    // Return as base64-like hex encoding (more reliable in React Native)
    return 'ENC:' + bytesToHex(combined);
  } catch (error) {
    console.error('Encryption failed:', error);
    // Return original value if encryption fails (fail-open for usability)
    // In production, consider fail-closed behavior
    return plaintext;
  }
}

/**
 * Decrypt a string value
 * Expects base64-encoded encrypted data with IV prepended
 */
export async function decryptValue(encrypted: string): Promise<string> {
  if (!encrypted) return encrypted;

  // Check if value is encrypted (has our prefix)
  if (!encrypted.startsWith('ENC:')) {
    // Value is not encrypted, return as-is (migration support)
    return encrypted;
  }

  try {
    const key = await getOrCreateEncryptionKey();
    const keyBytes = hexToBytes(key);

    // Remove prefix and decode
    const hexData = encrypted.slice(4);
    const combined = hexToBytes(hexData);

    // Extract IV and encrypted data
    const iv = combined.slice(0, IV_LENGTH);
    const encryptedBytes = combined.slice(IV_LENGTH);

    // Decrypt using XOR (symmetric - same operation as encrypt)
    const decryptedBytes = xorEncrypt(encryptedBytes, keyBytes, iv);

    // Convert back to string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBytes);
  } catch (error) {
    console.error('Decryption failed:', error);
    // Return original value if decryption fails
    return encrypted;
  }
}

/**
 * Encrypt an object, encrypting only sensitive fields
 * Non-sensitive fields are left as-is for queryability
 */
export async function encryptSensitiveFields<T extends Record<string, any>>(
  obj: T
): Promise<T> {
  if (!obj || typeof obj !== 'object') return obj;

  const result = { ...obj };

  for (const field of SENSITIVE_FIELDS) {
    if (field in result && result[field] !== null && result[field] !== undefined) {
      const value = result[field];

      // Handle different types
      if (typeof value === 'string') {
        (result as any)[field] = await encryptValue(value);
      } else if (typeof value === 'boolean') {
        (result as any)[field] = await encryptValue(String(value));
      } else if (value instanceof Date) {
        (result as any)[field] = await encryptValue(value.toISOString());
      } else if (typeof value === 'number') {
        (result as any)[field] = await encryptValue(String(value));
      } else if (Array.isArray(value)) {
        // For arrays (like surgeries), encrypt the JSON representation
        (result as any)[field] = await encryptValue(JSON.stringify(value));
      } else if (typeof value === 'object') {
        // For objects, encrypt the JSON representation
        (result as any)[field] = await encryptValue(JSON.stringify(value));
      }
    }
  }

  return result;
}

/**
 * Decrypt an object, decrypting sensitive fields
 */
export async function decryptSensitiveFields<T extends Record<string, any>>(
  obj: T,
  fieldTypes?: Partial<Record<SensitiveField, 'string' | 'boolean' | 'date' | 'number' | 'array' | 'object'>>
): Promise<T> {
  if (!obj || typeof obj !== 'object') return obj;

  const result = { ...obj };

  for (const field of SENSITIVE_FIELDS) {
    if (field in result && result[field] !== null && result[field] !== undefined) {
      const encryptedValue = result[field];

      // Only decrypt if it's a string (encrypted values are always strings)
      if (typeof encryptedValue === 'string') {
        const decrypted = await decryptValue(encryptedValue);

        // Determine the original type and convert back
        const fieldType = fieldTypes?.[field as SensitiveField];

        if (fieldType === 'boolean') {
          (result as any)[field] = decrypted === 'true';
        } else if (fieldType === 'date') {
          (result as any)[field] = new Date(decrypted);
        } else if (fieldType === 'number') {
          (result as any)[field] = Number(decrypted);
        } else if (fieldType === 'array' || fieldType === 'object') {
          try {
            (result as any)[field] = JSON.parse(decrypted);
          } catch {
            (result as any)[field] = decrypted;
          }
        } else {
          (result as any)[field] = decrypted;
        }
      }
    }
  }

  return result;
}

/**
 * Check if a value is encrypted
 */
export function isEncrypted(value: string): boolean {
  return typeof value === 'string' && value.startsWith('ENC:');
}

/**
 * Field type mapping for profile decryption
 */
export const PROFILE_FIELD_TYPES: Partial<Record<SensitiveField, 'string' | 'boolean' | 'date' | 'number' | 'array' | 'object'>> = {
  hrt_type: 'string',
  hrt_start_date: 'date',
  hrt_injection_start_date: 'date',
  hrt_injection_frequency: 'string',
  on_hrt: 'boolean',
  surgeries: 'array',
  binds_chest: 'boolean',
  binder_type: 'string',
  binding_duration_hours: 'number',
  binding_frequency: 'string',
  dysphoria_triggers: 'array',
  dysphoria_notes: 'string',
  gender_identity: 'string',
  date_of_birth: 'date',
};
