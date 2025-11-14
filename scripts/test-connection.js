const { neon } = require('@neondatabase/serverless');

async function testConnection() {
  console.log('\n=== TESTING NEON DATABASE CONNECTION ===\n');

  try {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      console.error('ERROR: DATABASE_URL environment variable not set');
      console.error('Please add it to your .env file');
      process.exit(1);
    }

    console.log('Connecting to Neon database...');
    const sql = neon(databaseUrl);

    // Test connection
    const result = await sql('SELECT NOW() as current_time');
    console.log('✅ Connection successful!');
    console.log('Server time:', result[0].current_time);

    // Check tables
    const tables = await sql(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
    );

    console.log('\n📋 Tables found:');
    if (tables.length === 0) {
      console.log('  ⚠️  No tables found. Run: scripts/01-init-database.sql');
    } else {
      tables.forEach(({ table_name }) => {
        console.log(`  ✓ ${table_name}`);
      });
    }

    // Check users
    const users = await sql('SELECT COUNT(*) as count FROM users');
    console.log(`\n👥 Users registered: ${users[0].count}`);

    // Check products
    const products = await sql('SELECT COUNT(*) as count FROM products');
    console.log(`📦 Products in inventory: ${products[0].count}`);

    console.log('\n=== ALL TESTS PASSED ===\n');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
