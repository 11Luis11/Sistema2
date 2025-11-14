import * as crypto from 'crypto';
import * as bcryptjs from 'bcryptjs';

const SALT_ROUNDS = 12;

interface User {
  email: string;
  password: string;
  role: string;
}

const users: User[] = [
  {
    email: 'admin@yenijeans.com',
    password: 'admin123',
    role: 'Administrator',
  },
  {
    email: 'gerente@yenijeans.com',
    password: 'gerente123',
    role: 'Manager',
  },
  {
    email: 'adm_inv@yenijeans.com',
    password: 'adm_inv123',
    role: 'ADM_INV',
  },
];

async function generateUserHashes() {
  console.log('\n🔐 GENERATING SECURE HASHES FOR ALL USERS\n');
  console.log('='.repeat(80));

  const sqlStatements: string[] = [];

  for (const user of users) {
    try {
      const hash = await bcryptjs.hash(user.password, SALT_ROUNDS);

      console.log(`\n✓ ${user.email}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Password: ${user.password}`);
      console.log(`  Hash generated (bcryptjs, ${SALT_ROUNDS} rounds)`);

      // Generate SQL statement
      const email = user.email.replace(/'/g, "''");
      const sql = `UPDATE users SET password_hash = '${hash}' WHERE email = '${email}';`;
      sqlStatements.push(sql);
    } catch (error) {
      console.error(`✗ Failed to hash ${user.email}:`, error);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n📋 COPY AND PASTE INTO NEON SQL EDITOR:\n');
  console.log(sqlStatements.join('\n'));
  console.log('\n' + '='.repeat(80) + '\n');
}

generateUserHashes().catch(console.error);
