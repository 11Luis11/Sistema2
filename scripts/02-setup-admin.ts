// Script to generate admin hash for admin123
// Run: npx ts-node scripts/02-setup-admin.ts

import { hashPassword } from '../lib/security/password-hash';
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function setupAdmin() {
  try {
    console.log('[Admin Setup] Generating admin password hash...');
    const passwordHash = await hashPassword('admin123');
    
    console.log('[Admin Setup] Inserting admin user into database...');
    
    const result = await sql(
      `UPDATE users 
       SET password_hash = $1, updated_at = NOW()
       WHERE email = $2`,
      [passwordHash, 'admin@yenijeans.com']
    );

    console.log('[Admin Setup] Admin user updated successfully');
    console.log('[Admin Setup] Email: admin@yenijeans.com');
    console.log('[Admin Setup] Password: admin123');
    console.log('[Admin Setup] ✓ Setup complete!');
  } catch (error) {
    console.error('[Admin Setup Error]', error);
    process.exit(1);
  }
}

setupAdmin();
