import * as bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12; // Industry standard for bcrypt

export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }
  
  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    return hash;
  } catch (error) {
    console.error('[Password Hash Error]', error);
    throw new Error('Failed to hash password');
  }
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    if (!password || !hash) {
      return false;
    }
    const isMatch = await bcrypt.compare(password, hash);
    return isMatch;
  } catch (error) {
    console.error('[Password Verify Error]', error);
    return false;
  }
}

// Generate hash for setup purposes
export async function generateHashForSetup(password: string): Promise<string> {
  return await hashPassword(password);
}

export function createPasswordHash(password: string): { hash: string; salt: string } {
  // For bcryptjs, the salt is embedded in the hash, but we return a compatible format
  // This is a synchronous version for setup scripts
  const crypto = require('crypto');
  const salt = crypto.randomBytes(32).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('hex');
  return { hash, salt };
}
