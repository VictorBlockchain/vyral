import { NextResponse } from 'next/server';
import { randomBytes, createCipheriv, createDecipheriv, scrypt } from 'crypto';
import { promisify } from 'util';
import { prisma } from '@/lib/db';
import { verifyAdmin } from '@/lib/admin-auth';
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

function loadKeysConfig(): EncryptionKeysConfig {
  try {
    if (fs.existsSync(KEYS_CONFIG_PATH)) {
      const data = fs.readFileSync(KEYS_CONFIG_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading keys config:', error);
  }

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

function saveKeysConfig(config: EncryptionKeysConfig): void {
  fs.writeFileSync(KEYS_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');

  // Update .gitignore
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  if (!gitignoreContent.includes('.encryption-keys.json')) {
    fs.appendFileSync(gitignorePath, '\n# Encryption keys\n.encryption-keys.json\n', 'utf8');
  }
}

async function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  return (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress') || '';

    const adminStatus = await verifyAdmin(walletAddress);
    if (!adminStatus.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const config = loadKeysConfig();

    // Get stats
    const challenges = await prisma.challenge.findMany({
      where: { escrowSecretKey: { not: null } },
      select: { id: true, escrowSecretKey: true },
    });

    let newFormatCount = 0;
    let legacyFormatCount = 0;

    challenges.forEach((c) => {
      if (c.escrowSecretKey) {
        const parts = c.escrowSecretKey.split(':');
        if (parts.length === 5) {
          newFormatCount++;
        } else if (parts.length === 4) {
          legacyFormatCount++;
        }
      }
    });

    return NextResponse.json({
      success: true,
      currentKeyId: config.currentKeyId,
      keys: config.keys.map((k) => ({
        keyId: k.keyId,
        createdAt: k.createdAt,
        isActive: k.isActive,
        keyPreview: `${k.key.substring(0, 8)}...${k.key.substring(k.key.length - 8)}`,
      })),
      stats: {
        totalChallenges: challenges.length,
        newFormatCount,
        legacyFormatCount,
      },
    });
  } catch (error: any) {
    console.error('Error getting key info:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress') || '';

    const adminStatus = await verifyAdmin(walletAddress);
    if (!adminStatus.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'generate') {
      // Generate new key
      const newKey = randomBytes(32).toString('hex');
      return NextResponse.json({
        success: true,
        newKey,
        message: 'New encryption key generated. Copy it securely!',
      });
    }

    if (action === 'rotate') {
      const config = loadKeysConfig();
      const oldKeyId = config.currentKeyId;
      const newKeyId = `key-${Date.now()}`;
      const newKey = randomBytes(32).toString('hex');

      // Add new key to config
      config.keys.push({
        keyId: newKeyId,
        key: newKey,
        createdAt: new Date().toISOString(),
        isActive: false,
      });

      // Re-encrypt all challenges
      const challenges = await prisma.challenge.findMany({
        where: { escrowSecretKey: { not: null } },
        select: { id: true, escrowSecretKey: true },
      });

      let updatedCount = 0;
      const errors: string[] = [];

      for (const challenge of challenges) {
        try {
          if (!challenge.escrowSecretKey) continue;

          const parts = challenge.escrowSecretKey.split(':');
          const keyId = parts.length === 5 ? parts[0] : oldKeyId;
          const encryptedData = parts.length === 5 ? parts.slice(1).join(':') : challenge.escrowSecretKey;

          // Find the key used
          const keyRecord = config.keys.find((k) => k.keyId === keyId);
          if (!keyRecord) {
            errors.push(`Key not found for challenge ${challenge.id}`);
            continue;
          }

          // Decrypt
          const [saltHex, ivHex, authTagHex, encrypted] = encryptedData.split(':');
          const salt = Buffer.from(saltHex, 'hex');
          const iv = Buffer.from(ivHex, 'hex');
          const authTag = Buffer.from(authTagHex, 'hex');

          const derivedKey = await deriveKey(keyRecord.key, salt);
          const decipher = createDecipheriv(ALGORITHM, derivedKey, iv) as any;
          decipher.setAuthTag(authTag);

          let decrypted = decipher.update(encrypted, 'hex', 'utf8');
          decrypted += decipher.final('utf8');

          // Re-encrypt with new key
          const newSalt = randomBytes(SALT_LENGTH);
          const newIv = randomBytes(IV_LENGTH);
          const newDerivedKey = await deriveKey(newKey, newSalt);

          const cipher = createCipheriv(ALGORITHM, newDerivedKey, newIv) as any;
          let newEncrypted = cipher.update(decrypted, 'utf8', 'hex');
          newEncrypted += cipher.final('hex');
          const newAuthTag = cipher.getAuthTag().toString('hex');

          const newFormat = `${newKeyId}:${newSalt.toString('hex')}:${newIv.toString('hex')}:${newAuthTag}:${newEncrypted}`;

          // Update database
          await prisma.challenge.update({
            where: { id: challenge.id },
            data: { escrowSecretKey: newFormat },
          });

          updatedCount++;
        } catch (err: any) {
          errors.push(`Failed to update challenge ${challenge.id}: ${err.message}`);
        }
      }

      // Update current key
      config.currentKeyId = newKeyId;
      config.keys.forEach((k) => {
        k.isActive = k.keyId === newKeyId;
      });

      saveKeysConfig(config);

      return NextResponse.json({
        success: true,
        newKeyId,
        oldKeyId,
        updatedCount,
        errors,
        message: `Key rotation completed. ${updatedCount} challenges updated.`,
      });
    }

    if (action === 'purge') {
      const config = loadKeysConfig();
      const currentKeyId = config.currentKeyId;

      // Check if any challenges still use old keys
      const challenges = await prisma.challenge.findMany({
        where: { escrowSecretKey: { not: null } },
        select: { id: true, escrowSecretKey: true },
      });

      let usingOldKeys = 0;
      challenges.forEach((c) => {
        if (c.escrowSecretKey) {
          const parts = c.escrowSecretKey.split(':');
          const keyId = parts.length === 5 ? parts[0] : null;
          if (keyId && keyId !== currentKeyId) {
            usingOldKeys++;
          }
        }
      });

      if (usingOldKeys > 0) {
        return NextResponse.json(
          { error: `${usingOldKeys} challenges still use old keys. Run rotation first.` },
          { status: 400 }
        );
      }

      // Purge old keys
      const keysToRemove = config.keys.filter((k) => k.keyId !== currentKeyId).length;
      config.keys = config.keys.filter((k) => k.keyId === currentKeyId);
      saveKeysConfig(config);

      return NextResponse.json({
        success: true,
        keysRemoved: keysToRemove,
        message: `Successfully purged ${keysToRemove} old keys`,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in key management:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
