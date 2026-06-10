# Encryption Key Management

This directory contains scripts for managing encryption keys used to secure Solana wallet private keys in the database.

## Overview

The encryption key management system provides:

- **Key Generation**: Create secure 256-bit encryption keys
- **Key Rotation**: Rotate encryption keys and re-encrypt all existing data
- **Backward Compatibility**: Support multiple keys for seamless rotation
- **Key Purging**: Safely remove old keys after migration

## Files

- `generate-encryption-key.ts` - Generate a new encryption key
- `rotate-encryption-key.ts` - Rotate keys and manage key lifecycle
- `../src/lib/encryption-key-manager.ts` - Key manager library
- `../src/lib/encryption.ts` - Legacy encryption service (backward compatible)

## Quick Start

### 1. Generate a New Encryption Key

```bash
npx tsx scripts/generate-encryption-key.ts
```

This will output a new encryption key. Copy it to your `.env.local`:

```env
ENCRYPTION_KEY=your-generated-key-here
```

### 2. Rotate Encryption Key

When you need to change the encryption key (security best practice):

```bash
npx tsx scripts/rotate-encryption-key.ts rotate
```

This will:
1. Generate a new encryption key
2. Decrypt all escrow private keys with the old key
3. Re-encrypt them with the new key
4. Store both keys for backward compatibility
5. Update the database with new encrypted values

### 3. List All Keys

```bash
npx tsx scripts/rotate-encryption-key.ts list
```

Shows all encryption keys and which one is currently active.

### 4. Purge Old Keys

After rotating keys and verifying all data is migrated:

```bash
npx tsx scripts/rotate-encryption-key.ts purge
```

⚠️ **WARNING**: Only purge old keys if you're certain no data uses them!

## How It Works

### Encryption Format

**New Format (with key ID):**
```
keyId:salt:iv:authTag:encryptedData
```

**Legacy Format (backward compatible):**
```
salt:iv:authTag:encryptedData
```

The system automatically detects which format is being used and selects the appropriate key.

### Key Storage

- **Active Key**: Stored in `.env.local` as `ENCRYPTION_KEY`
- **All Keys**: Stored in `.encryption-keys.json` (gitignored)
- **Key ID**: Embedded in encrypted data for automatic detection

### Key Rotation Process

1. **Generate New Key**: Creates a new 256-bit random key
2. **Add to Config**: New key added to `.encryption-keys.json`
3. **Decrypt with Old**: Each escrow key decrypted using old key
4. **Re-encrypt with New**: Each escrow key re-encrypted with new key
5. **Update Database**: All challenges updated with new encrypted values
6. **Set Active**: New key becomes the current active key
7. **Keep Old**: Old key retained for backward compatibility

## Security Best Practices

### Key Storage

✅ **DO:**
- Store keys in a secure password manager (1Password, LastPass, etc.)
- Use environment variables for active key
- Keep `.encryption-keys.json` secure and backed up
- Never commit keys to version control

❌ **DON'T:**
- Share keys via email or chat
- Store keys in code or documentation
- Commit `.env.local` or `.encryption-keys.json` to git
- Use weak or predictable keys

### Key Rotation Schedule

**Recommended:**
- Rotate keys every 90 days
- Rotate immediately if a key is compromised
- Rotate when team members leave the project
- Test rotation in staging before production

### Backup Strategy

1. **Backup `.encryption-keys.json`** to secure storage
2. **Document key rotation dates** in a secure log
3. **Test decryption** with backed-up keys periodically
4. **Store backups** in multiple secure locations

## API Usage

### In Your Code

```typescript
import { EncryptionService } from '@/lib/encryption';
import { keyManager } from '@/lib/encryption-key-manager';

// Encrypt (automatically uses current key)
const encrypted = await EncryptionService.encrypt(secretKey);

// Decrypt (automatically detects key)
const decrypted = await EncryptionService.decrypt(encrypted);

// Get current key ID
const currentKeyId = keyManager.getCurrentKey();

// Get key by ID (for manual operations)
const key = keyManager.getKeyById('key-1234567890');
```

### Manual Key Operations

```typescript
import { keyManager } from '@/lib/encryption-key-manager';

// Encrypt with specific key
const encrypted = await keyManager.encryptWithKeyId(data, 'key-123');

// Decrypt with specific key
const decrypted = await keyManager.decryptWithKey(encrypted, 'key-123');
```

## Troubleshooting

### "ENCRYPTION_KEY environment variable is not set"

Add the key to your `.env.local` file:
```env
ENCRYPTION_KEY=your-key-here
```

### "Encryption key not found: key-XXX"

The key ID doesn't exist in `.encryption-keys.json`. Check that:
1. The key rotation completed successfully
2. `.encryption-keys.json` exists and is valid JSON
3. The key ID matches one in the config

### Decryption fails after key rotation

This means some data still uses the old key. Check:
1. Run `npx tsx scripts/rotate-encryption-key.ts list` to see all keys
2. Verify the rotation script completed successfully
3. Check database for any challenges with old format

### Too many old keys accumulating

After verifying all data is migrated:
```bash
npx tsx scripts/rotate-encryption-key.ts purge
```

## Migration from Legacy Format

If you have data encrypted with the old format (without key ID):

1. **Run Key Rotation**:
   ```bash
   npx tsx scripts/rotate-encryption-key.ts rotate
   ```

2. **Verify Migration**:
   - Check that all challenges have the new format (5 parts separated by `:`)
   - Test decryption of a few records

3. **Purge Old Keys** (optional):
   ```bash
   npx tsx scripts/rotate-encryption-key.ts purge
   ```

## Monitoring

### Check Key Health

```bash
# List all keys and their status
npx tsx scripts/rotate-encryption-key.ts list

# Check how many challenges use each format
# (Run this query in your database)
SELECT 
  CASE 
    WHEN LENGTH(escrowSecretKey) - LENGTH(REPLACE(escrowSecretKey, ':', '')) = 4 
    THEN 'new_format'
    WHEN LENGTH(escrowSecretKey) - LENGTH(REPLACE(escrowSecretKey, ':', '')) = 3 
    THEN 'legacy_format'
    ELSE 'unknown'
  END as format,
  COUNT(*) as count
FROM "Challenge"
WHERE escrowSecretKey IS NOT NULL
GROUP BY format;
```

### Audit Trail

Keep a secure log of:
- Key rotation dates
- Reason for rotation
- Who performed the rotation
- Number of records migrated
- Any issues encountered

## Support

If you encounter issues:

1. Check this documentation
2. Review the error messages carefully
3. Verify `.encryption-keys.json` exists and is valid
4. Ensure `ENCRYPTION_KEY` is set in `.env.local`
5. Contact the development team

## References

- [AES-256-GCM Encryption](https://en.wikipedia.org/wiki/Advanced_Encryption_Standard)
- [Node.js Crypto Module](https://nodejs.org/api/crypto.html)
- [Security Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
