/**
 * Encryption utilities for protecting sensitive health data
 *
 * IMPLEMENTATION (v1.1 — AES-256-GCM):
 *
 * - AES-256-GCM authenticated encryption via @noble/ciphers (audited, pure JS)
 * - 256-bit key stored in SecureStore (iOS Keychain / Android Keystore)
 * - Random 96-bit nonce per encryption (GCM standard)
 * - GCM authentication tag provides tamper detection (no separate HMAC needed)
 * - Backward compatible: decrypts legacy XOR-encrypted data (ENC: prefix)
 *   and re-encrypts with AES-GCM on next save
 *
 * Encrypted Fields:
 * - HRT status, type, and dates
 * - Surgical history
 * - Binding information
 * - Dysphoria triggers and notes
 * - Gender identity and date of birth
 *
 * Format: "AES:" + hex(nonce_12bytes + ciphertext + tag_16bytes)
 * Legacy: "ENC:" + hex(iv_16bytes + xor_ciphertext)
 */

import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { gcm } from '@noble/ciphers/aes.js';

const ENCRYPTION_KEY_ALIAS = 'transfitness_encryption_key';
const KEY_LENGTH = 32; // 256 bits for AES-256
const NONCE_LENGTH = 12; // 96 bits — GCM standard nonce size
const LEGACY_IV_LENGTH = 16; // Legacy XOR cipher IV size

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

// =============================================================================
// AES-256-GCM (current — v1.1)
// =============================================================================

/**
 * Encrypt a string value using AES-256-GCM
 * Returns hex-encoded: nonce (12 bytes) + ciphertext + GCM tag (16 bytes)
 */
export async function encryptValue(plaintext: string): Promise<string> {
  if (!plaintext) return plaintext;

  try {
    const key = await getOrCreateEncryptionKey();
    const keyBytes = hexToBytes(key);

    // Generate random nonce (96 bits — GCM standard)
    const nonce = await Crypto.getRandomBytesAsync(NONCE_LENGTH);

    // Convert plaintext to bytes
    const encoder = new TextEncoder();
    const plaintextBytes = encoder.encode(plaintext);

    // Encrypt with AES-256-GCM (includes authentication tag)
    const aes = gcm(keyBytes, nonce);
    const ciphertext = aes.encrypt(plaintextBytes);

    // Combine nonce + ciphertext (tag is appended by GCM)
    const combined = new Uint8Array(NONCE_LENGTH + ciphertext.length);
    combined.set(nonce, 0);
    combined.set(ciphertext, NONCE_LENGTH);

    return 'AES:' + bytesToHex(combined);
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Encryption failed: sensitive data must not be stored as plaintext');
  }
}

/**
 * Decrypt a string value
 * Handles both AES-256-GCM (AES: prefix) and legacy XOR (ENC: prefix)
 */
export async function decryptValue(encrypted: string): Promise<string> {
  if (!encrypted) return encrypted;

  // AES-256-GCM (current)
  if (encrypted.startsWith('AES:')) {
    return decryptAES(encrypted);
  }

  // Legacy XOR cipher (v1.0 — backward compatibility)
  if (encrypted.startsWith('ENC:')) {
    return decryptLegacyXOR(encrypted);
  }

  // Value is not encrypted, return as-is (migration support)
  return encrypted;
}

/**
 * Decrypt AES-256-GCM encrypted value
 */
async function decryptAES(encrypted: string): Promise<string> {
  try {
    const key = await getOrCreateEncryptionKey();
    const keyBytes = hexToBytes(key);

    // Remove prefix and decode
    const hexData = encrypted.slice(4); // Remove "AES:"
    const combined = hexToBytes(hexData);

    // Extract nonce and ciphertext (+ GCM tag)
    const nonce = combined.slice(0, NONCE_LENGTH);
    const ciphertext = combined.slice(NONCE_LENGTH);

    // Decrypt with AES-256-GCM (also verifies authentication tag)
    const aes = gcm(keyBytes, nonce);
    const plaintextBytes = aes.decrypt(ciphertext);

    const decoder = new TextDecoder();
    return decoder.decode(plaintextBytes);
  } catch (error) {
    console.error('AES decryption failed:', error);
    return encrypted;
  }
}

// =============================================================================
// Legacy XOR cipher (v1.0 — read-only for migration)
// =============================================================================

/**
 * XOR decrypt (legacy v1.0 — kept for reading old encrypted data)
 * Data will be re-encrypted with AES-GCM on next save.
 */
function xorDecrypt(data: Uint8Array, key: Uint8Array, iv: Uint8Array): Uint8Array {
  const result = new Uint8Array(data.length);
  const keyLen = key.length;
  const ivLen = iv.length;

  for (let i = 0; i < data.length; i++) {
    const keyByte = key[i % keyLen];
    const ivByte = iv[i % ivLen];
    const mixedByte = (keyByte ^ ivByte ^ (i & 0xff)) & 0xff;
    result[i] = data[i] ^ mixedByte;
  }
  return result;
}

/**
 * Decrypt legacy XOR-encrypted value (ENC: prefix)
 */
async function decryptLegacyXOR(encrypted: string): Promise<string> {
  try {
    const key = await getOrCreateEncryptionKey();
    const keyBytes = hexToBytes(key);

    const hexData = encrypted.slice(4); // Remove "ENC:"
    const combined = hexToBytes(hexData);

    const iv = combined.slice(0, LEGACY_IV_LENGTH);
    const encryptedBytes = combined.slice(LEGACY_IV_LENGTH);

    const decryptedBytes = xorDecrypt(encryptedBytes, keyBytes, iv);

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBytes);
  } catch (error) {
    console.error('Legacy XOR decryption failed:', error);
    return encrypted;
  }
}

// =============================================================================
// Batch encrypt/decrypt for profile objects
// =============================================================================

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
        (result as any)[field] = await encryptValue(JSON.stringify(value));
      } else if (typeof value === 'object') {
        (result as any)[field] = await encryptValue(JSON.stringify(value));
      }
    }
  }

  return result;
}

/**
 * Decrypt an object, decrypting sensitive fields
 * Handles both AES-GCM and legacy XOR transparently
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
 * Check if a value is encrypted (either AES or legacy XOR)
 */
export function isEncrypted(value: string): boolean {
  return typeof value === 'string' && (value.startsWith('AES:') || value.startsWith('ENC:'));
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
