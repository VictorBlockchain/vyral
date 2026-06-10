import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const scryptAsync = promisify(scrypt);
const prisma = new PrismaClient();

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;
const IV_LENGTH = 16;

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

const KEYS_CONFIG_PATH = path.join(process.cwd(), '.encryption-keys.json');

/**
 * Encryption Key Manager with rotation and backward compatibility
 */
class EncryptionKeyManager {
  private keysConfig: EncryptionKeysConfig;

  constructor() {
    this.keysConfig = this.loadKeysConfig();
  }

  /**
   * Load encryption keys configuration
   */
  private loadKeysConfig(): EncryptionKeysConfig {
    try {
      if (fs.existsSync(KEYS_CONFIG_PATH)) {
        const data = fs.readFileSync(KEYS_CONFIG_PATH, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading keys config:', error);
    }

    // Initialize with current key from environment
    const currentKey = process.env.ENCRYPTION_KEY;
    if (!currentKey) {
      throw new Error('ENCRYPTION_KEY environment variable is not set');
    }

    return {
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
  }

  /**
   * Save encryption keys configuration
   */
  private saveKeysConfig(): void {
    fs.writeFileSync(
      KEYS_CONFIG_PATH,
      JSON.stringify(this.keysConfig, null, 2),
      'utf8'
    );
    // Ensure the file is not committed to git
    this.updateGitignore();
  }

  /**
   * Update .gitignore to exclude encryption keys config
   */
  private updateGitignore(): void {
    const gitignorePath = path.join(process.cwd(), '.gitignore');
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');

    if (!gitignoreContent.includes('.encryption-keys.json')) {
      fs.appendFileSync(
        gitignorePath,
        '\n\n# Encryption key management\n.encryption-keys.json\n',
        'utf8'
      );
    }
  }

  /**
   * Get the current active encryption key
   */
  getCurrentKey(): string {
    const currentKeyRecord = this.keysConfig.keys.find(
      (k) => k.keyId === this.keysConfig.currentKeyId
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
    const keyRecord = this.keysConfig.keys.find((k) => k.keyId === keyId);

    if (!keyRecord) {
      throw new Error(`Encryption key not found: ${keyId}`);
    }

    return keyRecord.key;
  }

  /**
   * Derive encryption key from password and salt
   */
  private async deriveKey(password: string, salt: Buffer): Promise<Buffer> {
    return (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  }

  /**
   * Decrypt text using a specific key ID
   */
  async decryptWithKey(
    encryptedText: string,
    keyId: string
  ): Promise<string> {
    const key = this.getKeyById(keyId);
    const [saltHex, ivHex, authTagHex, encrypted] = encryptedText.split(':');
    const salt = Buffer.from(saltHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const derivedKey = await this.deriveKey(key, salt);

    const decipher = createDecipheriv(ALGORITHM, derivedKey, iv) as any;
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Encrypt text using the current active key
   */
  async encrypt(text: string): Promise<string> {
    const salt = randomBytes(SALT_LENGTH);
    const iv = randomBytes(IV_LENGTH);
    const key = await this.deriveKey(this.getCurrentKey(), salt);

    const cipher = createCipheriv(ALGORITHM, key, iv) as any;
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    return `${salt.toString('hex')}:${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  /**
   * Decrypt text using the key ID embedded in metadata
   * Format: keyId:salt:iv:authTag:encrypted
   */
  async decrypt(encryptedText: string): Promise<string> {
    const parts = encryptedText.split(':');

    // Check if this is the new format with keyId
    if (parts.length === 5) {
      const [keyId, saltHex, ivHex, authTagHex, encrypted] = parts;
      const salt = Buffer.from(saltHex, 'hex');
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');

      const key = this.getKeyById(keyId);
      const derivedKey = await this.deriveKey(key, salt);

      const decipher = createDecipheriv(ALGORITHM, derivedKey, iv) as any;
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    }

    // Legacy format (without keyId) - use current key for backward compatibility
    if (parts.length === 4) {
      const [saltHex, ivHex, authTagHex, encrypted] = parts;
      const salt = Buffer.from(saltHex, 'hex');
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');

      const derivedKey = await this.deriveKey(this.getCurrentKey(), salt);

      const decipher = createDecipheriv(ALGORITHM, derivedKey, iv) as any;
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    }

    throw new Error('Invalid encrypted text format');
  }

  /**
   * Rotate encryption key
   * 1. Generate new key
   * 2. Decrypt all data with old key
   * 3. Re-encrypt with new key
   * 4. Update configuration
   */
  async rotateKey(): Promise<{
    newKeyId: string;
    oldKeyId: string;
    challengesUpdated: number;
  }> {
    console.log('🔄 Starting encryption key rotation...');
    console.log('');

    const oldKeyId = this.keysConfig.currentKeyId;
    const newKeyId = `key-${Date.now()}`;

    // Generate new key
    const { randomBytes } = await import('crypto');
    const newKey = randomBytes(32).toString('hex');

    console.log(`📌 Old key ID: ${oldKeyId}`);
    console.log(`📌 New key ID: ${newKeyId}`);
    console.log('');

    // Add new key to config
    this.keysConfig.keys.push({
      keyId: newKeyId,
      key: newKey,
      createdAt: new Date().toISOString(),
      isActive: false,
    });

    // Re-encrypt all challenge escrow keys
    const challenges = await prisma.challenge.findMany({
      where: {
        escrowSecretKey: {
          not: null,
        },
      },
      select: {
        id: true,
        escrowSecretKey: true,
      },
    });

    console.log(`📊 Found ${challenges.length} challenges with encrypted keys`);
    console.log('');

    let updatedCount = 0;

    for (const challenge of challenges) {
      try {
        if (!challenge.escrowSecretKey) continue;

        // Check if already using new format with keyId
        const parts = challenge.escrowSecretKey.split(':');
        const keyId = parts.length === 5 ? parts[0] : oldKeyId;

        // Decrypt with old key
        const decrypted = await this.decryptWithKey(
          parts.length === 5 ? parts.slice(1).join(':') : challenge.escrowSecretKey,
          keyId
        );

        // Re-encrypt with new key
        const reencrypted = await this.encryptWithKeyId(decrypted, newKeyId);

        // Update database
        await prisma.challenge.update({
          where: { id: challenge.id },
          data: { escrowSecretKey: reencrypted },
        });

        updatedCount++;

        if (updatedCount % 10 === 0) {
          console.log(`  ✓ Updated ${updatedCount}/${challenges.length} challenges`);
        }
      } catch (error) {
        console.error(`  ✗ Failed to update challenge ${challenge.id}:`, error);
      }
    }

    // Update current key
    this.keysConfig.currentKeyId = newKeyId;
    this.keysConfig.keys.forEach((k) => {
      k.isActive = k.keyId === newKeyId;
    });

    // Save configuration
    this.saveKeysConfig();

    console.log('');
    console.log(`✅ Successfully updated ${updatedCount}/${challenges.length} challenges`);
    console.log('');
    console.log('📋 Key rotation summary:');
    console.log(`   - Old key ID: ${oldKeyId} (kept for backward compatibility)`);
    console.log(`   - New key ID: ${newKeyId} (now active)`);
    console.log(`   - Challenges updated: ${updatedCount}`);
    console.log('');
    console.log('⚠️  IMPORTANT:');
    console.log('   - Store the new key from .encryption-keys.json securely');
    console.log('   - Update ENCRYPTION_KEY in .env.local with the new key');
    console.log('   - Keep old keys in .encryption-keys.json for backward compatibility');
    console.log('');

    return {
      newKeyId,
      oldKeyId,
      challengesUpdated: updatedCount,
    };
  }

  /**
   * Encrypt with a specific key ID (includes keyId in output)
   */
  private async encryptWithKeyId(
    text: string,
    keyId: string
  ): Promise<string> {
    const salt = randomBytes(SALT_LENGTH);
    const iv = randomBytes(IV_LENGTH);
    const key = this.getKeyById(keyId);
    const derivedKey = await this.deriveKey(key, salt);

    const cipher = createCipheriv(ALGORITHM, derivedKey, iv) as any;
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    // New format: keyId:salt:iv:authTag:encrypted
    return `${keyId}:${salt.toString('hex')}:${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  /**
   * List all encryption keys
   */
  listKeys(): void {
    console.log('========================================');
    console.log('🔐 ENCRYPTION KEYS');
    console.log('========================================');
    console.log('');
    console.log(`Current Key ID: ${this.keysConfig.currentKeyId}`);
    console.log('');
    console.log('All keys:');

    this.keysConfig.keys.forEach((keyRecord) => {
      const isActive = keyRecord.keyId === this.keysConfig.currentKeyId;
      const status = isActive ? '🟢 ACTIVE' : '⚪ RETIRED';
      console.log(
        `  ${status} ${keyRecord.keyId} (created: ${new Date(keyRecord.createdAt).toLocaleString()})`
      );
    });

    console.log('');
    console.log(`Total keys: ${this.keysConfig.keys.length}`);
    console.log('========================================');
  }

  /**
   * Remove old keys (except the current one)
   * WARNING: Only do this if you're sure no data uses old keys
   */
  async purgeOldKeys(): Promise<void> {
    console.log('⚠️  WARNING: This will remove all old encryption keys!');
    console.log('⚠️  Data encrypted with old keys will become unreadable!');
    console.log('');

    const currentKeyId = this.keysConfig.currentKeyId;
    const keysToRemove = this.keysConfig.keys.filter(
      (k) => k.keyId !== currentKeyId
    );

    if (keysToRemove.length === 0) {
      console.log('✅ No old keys to remove');
      return;
    }

    console.log(`Keys to remove: ${keysToRemove.map((k) => k.keyId).join(', ')}`);
    console.log('');

    // Check if any challenges still use old keys
    const challenges = await prisma.challenge.findMany({
      where: {
        escrowSecretKey: {
          not: null,
        },
      },
      select: {
        id: true,
        escrowSecretKey: true,
      },
    });

    let usingOldKeys = 0;

    for (const challenge of challenges) {
      if (!challenge.escrowSecretKey) continue;

      const parts = challenge.escrowSecretKey.split(':');
      const keyId = parts.length === 5 ? parts[0] : null;

      if (keyId && keyId !== currentKeyId) {
        usingOldKeys++;
      }
    }

    if (usingOldKeys > 0) {
      console.log(`❌ Cannot purge: ${usingOldKeys} challenges still use old keys`);
      console.log('   Run key rotation first to migrate all data');
      return;
    }

    // Purge old keys
    this.keysConfig.keys = this.keysConfig.keys.filter(
      (k) => k.keyId === currentKeyId
    );

    this.saveKeysConfig();

    console.log('✅ Successfully purged old keys');
    console.log(`   Remaining keys: 1 (${currentKeyId})`);
  }
}

// CLI Interface
async function main() {
  const command = process.argv[2] || 'help';
  const manager = new EncryptionKeyManager();

  switch (command) {
    case 'rotate':
      await manager.rotateKey();
      break;

    case 'list':
      manager.listKeys();
      break;

    case 'purge':
      await manager.purgeOldKeys();
      break;

    case 'help':
    default:
      console.log('========================================');
      console.log('🔐 ENCRYPTION KEY MANAGER');
      console.log('========================================');
      console.log('');
      console.log('Usage:');
      console.log('  npx tsx scripts/rotate-encryption-key.ts [command]');
      console.log('');
      console.log('Commands:');
      console.log('  rotate    Rotate encryption key and re-encrypt all data');
      console.log('  list      List all encryption keys');
      console.log('  purge     Remove old keys (after rotation)');
      console.log('  help      Show this help message');
      console.log('');
      console.log('Examples:');
      console.log('  npx tsx scripts/rotate-encryption-key.ts rotate');
      console.log('  npx tsx scripts/rotate-encryption-key.ts list');
      console.log('  npx tsx scripts/rotate-encryption-key.ts purge');
      console.log('');
      break;
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
