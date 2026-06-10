import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const scryptAsync = promisify(scrypt);

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;
const IV_LENGTH = 16;
const KEYS_CONFIG_PATH = path.join(process.cwd(), '.encryption-keys.json');

interface EncryptionKeyRecord {
  keyId: string;
  key: string;
  createdAt: string;
  isActive: boolean;
}

interface EncryptionKeysConfig {
  currentKeyId: string;
  keys: EncryptionKeyRecord[];
}

/**
 * Encryption Key Manager - handles key rotation and backward compatibility
 */
class EncryptionKeyManager {
  private keysConfig: EncryptionKeysConfig | null = null;

  /**
   * Load encryption keys configuration
   */
  private loadKeysConfig(): EncryptionKeysConfig {
    if (this.keysConfig) {
      return this.keysConfig;
    }

    try {
      if (fs.existsSync(KEYS_CONFIG_PATH)) {
        const data = fs.readFileSync(KEYS_CONFIG_PATH, 'utf8');
        this.keysConfig = JSON.parse(data);
        return this.keysConfig!;
      }
    } catch (error) {
      console.warn('Warning: Could not load encryption keys config');
    }

    // Fallback to single key from environment
    const currentKey = process.env.ENCRYPTION_KEY;
    if (!currentKey) {
      throw new Error('ENCRYPTION_KEY environment variable is not set');
    }

    this.keysConfig = {
      currentKeyId: 'key-initial',
      keys: [
        {
          keyId: 'key-initial',
          key: currentKey,
          createdAt: new Date().toISOString(),
          isActive: true,
        },
      ],
    };

    return this.keysConfig;
  }

  /**
   * Get the current active encryption key
   */
  getCurrentKey(): string {
    const config = this.loadKeysConfig();
    const currentKeyRecord = config.keys.find(
      (k) => k.keyId === config.currentKeyId
    );

    if (!currentKeyRecord) {
      throw new Error('Current encryption key not found');
    }

    return currentKeyRecord.key;
  }

  /**
   * Get key by ID (for backward compatibility)
   */
  getKeyById(keyId: string): string {
    const config = this.loadKeysConfig();
    const keyRecord = config.keys.find((k) => k.keyId === keyId);

    if (!keyRecord) {
      throw new Error(`Encryption key not found: ${keyId}`);
    }

    return keyRecord.key;
  }

  /**
   * Derive encryption key from password and salt
   */
  async deriveKey(password: string, salt: Buffer): Promise<Buffer> {
    return (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  }
}

export const keyManager = new EncryptionKeyManager();

/**
 * Legacy EncryptionService - maintained for backward compatibility
 * New code should use keyManager directly
 */
export class EncryptionService {
  private static algorithm = ALGORITHM;
  private static keyLength = KEY_LENGTH;
  private static saltLength = SALT_LENGTH;
  private static ivLength = IV_LENGTH;

  /**
   * Derive key from password and salt
   * @deprecated Use keyManager.deriveKey() instead
   */
  static async deriveKey(password: string, salt: Buffer): Promise<Buffer> {
    return keyManager.deriveKey(password, salt);
  }

  /**
   * Encrypt text using current active key
   * New format includes keyId for backward compatibility
   */
  static async encrypt(text: string): Promise<string> {
    const salt = randomBytes(this.saltLength);
    const iv = randomBytes(this.ivLength);
    const currentKey = keyManager.getCurrentKey();
    const key = await keyManager.deriveKey(currentKey, salt);

    const cipher = createCipheriv(this.algorithm, key, iv) as any;
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    // New format: keyId:salt:iv:authTag:encrypted
    // Extract keyId from current key config
    const config = (keyManager as any).loadKeysConfig();
    const keyId = config.currentKeyId;

    return `${keyId}:${salt.toString('hex')}:${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  /**
   * Decrypt text with automatic key detection
   * Supports both old format (4 parts) and new format (5 parts with keyId)
   */
  static async decrypt(encryptedText: string): Promise<string> {
    const parts = encryptedText.split(':');

    // New format with keyId: keyId:salt:iv:authTag:encrypted
    if (parts.length === 5) {
      const [keyId, saltHex, ivHex, authTagHex, encrypted] = parts;
      const salt = Buffer.from(saltHex, 'hex');
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');

      const key = keyManager.getKeyById(keyId);
      const derivedKey = await keyManager.deriveKey(key, salt);

      const decipher = createDecipheriv(this.algorithm, derivedKey, iv) as any;
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    }

    // Legacy format (without keyId): salt:iv:authTag:encrypted
    // Use current key for backward compatibility
    if (parts.length === 4) {
      const [saltHex, ivHex, authTagHex, encrypted] = parts;
      const salt = Buffer.from(saltHex, 'hex');
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');

      const currentKey = keyManager.getCurrentKey();
      const derivedKey = await keyManager.deriveKey(currentKey, salt);

      const decipher = createDecipheriv(this.algorithm, derivedKey, iv) as any;
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    }

    throw new Error('Invalid encrypted text format');
  }
}
