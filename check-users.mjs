import { neon } from '@neondatabase/serverless';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

const sql = neon(dbUrl);

try {
  const result = await sql.query('SELECT COUNT(*) as count FROM users');
  const count = result[0].count;
  console.log(`✅ Total users in database: ${count}`);
  
  if (count > 0) {
    const users = await sql.query('SELECT id, email, name FROM users LIMIT 5');
    console.log('\n📋 Users:');
    users.forEach(user => {
      console.log(`  - ${user.name || user.email} (${user.id})`);
    });
  } else {
    console.log('⚠️  No users found. Need to sign up first.');
  }
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
