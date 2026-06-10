import { randomBytes } from 'crypto';

/**
 * Generate a secure 256-bit encryption key for AES-256-GCM
 * 
 * Usage:
 * npx tsx scripts/generate-encryption-key.ts
 */
function generateEncryptionKey(): string {
  // Generate 32 bytes (256 bits) for AES-256
  const key = randomBytes(32);
  return key.toString('hex');
}

// Generate and display the key
const newKey = generateEncryptionKey();

console.log('========================================');
console.log('🔐 ENCRYPTION KEY GENERATOR');
console.log('========================================');
console.log('');
console.log('📋 Your new encryption key:');
console.log('');
console.log(`ENCRYPTION_KEY=${newKey}`);
console.log('');
console.log('========================================');
console.log('⚠️  IMPORTANT:');
console.log('========================================');
console.log('1. Store this key securely (password manager, secrets vault)');
console.log('2. Add it to your .env.local file');
console.log('3. Run the key rotation script to re-encrypt existing data');
console.log('4. Never commit this key to version control');
console.log('5. Back up old keys for backward compatibility');
console.log('========================================');
console.log('');
console.log('💡 Next steps:');
console.log('   1. Copy the ENCRYPTION_KEY above to your .env.local');
console.log('   2. Run: npx tsx scripts/rotate-encryption-key.ts');
console.log('      (to re-encrypt all existing escrow keys)');
console.log('');
