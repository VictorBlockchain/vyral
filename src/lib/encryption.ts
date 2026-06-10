import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

export class EncryptionService {
  private static algorithm = 'aes-256-gcm';
  private static keyLength = 32;
  private static saltLength = 16;
  private static ivLength = 16;

  static async deriveKey(password: string, salt: Buffer): Promise<Buffer> {
    return (await scryptAsync(password, salt, this.keyLength)) as Buffer;
  }

  static async encrypt(text: string): Promise<string> {
    const salt = randomBytes(this.saltLength);
    const iv = randomBytes(this.ivLength);
    const key = await this.deriveKey(process.env.ENCRYPTION_KEY!, salt);
    
    const cipher = createCipheriv(this.algorithm, key, iv) as any;
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    
    // Combine: salt + iv + authTag + encrypted
    return `${salt.toString('hex')}:${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  static async decrypt(encryptedText: string): Promise<string> {
    const [saltHex, ivHex, authTagHex, encrypted] = encryptedText.split(':');
    const salt = Buffer.from(saltHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const key = await this.deriveKey(process.env.ENCRYPTION_KEY!, salt);
    
    const decipher = createDecipheriv(this.algorithm, key, iv) as any;
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
